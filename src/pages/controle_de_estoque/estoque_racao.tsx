import React, { useCallback, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Compra } from "../../interfaces/interfaces";
import { criarRacao, listarCompras, listarMovimentacoesRacao, listarRacoes } from "../../services/api";
import { toBr } from "../../utils/formatters";

export type TipoRacao = "milho" | "farelo_soja" | "nucleo_mineral";
export type UnidadeRacao = "kg" | "sacos" | "fardos" | "ton";
export type TipoMovRacao = "entrada" | "saida" | "ajuste";

export interface Racao {
    id: number;
    nome: string;
    tipo: TipoRacao;
    unidade: UnidadeRacao;
    quantidadeAtual: number;
    estoqueMinimo: number;
    custoUnitario: number | null;
    fornecedor?: string | null;
    localizacao?: string | null;
    validade?: string | null;
    observacoes?: string | null;
    atualizadoEm?: string;
}

interface MovimentacaoRacao {
    id: number;
    racaoId: number;
    racaoNome: string;
    unidade: UnidadeRacao;
    tipo: TipoMovRacao;
    quantidade: number;
    data: string;
    motivo: string;
    destino?: string | null;
}

export const TIPOS_RACAO: { key: TipoRacao; label: string; color: string; bg: string }[] = [
    { key: "milho", label: "Milho", color: "#a16207", bg: "#fef9c3" },
    { key: "farelo_soja", label: "Farelo de soja", color: "#15803d", bg: "#dcfce7" },
    { key: "nucleo_mineral", label: "Núcleo mineral", color: "#7c3aed", bg: "#ede9fe" },
];

const UNIDADES_COMPRA_RACAO: Record<string, string> = {
    kg: "kg",
    saco: "saco",
    saca: "saca",
    fardo: "fardo",
    unidade: "un.",
};

function formatarNumero(valor: number) {
    return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function normalizarTexto(valor?: string | null) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterTipoCompra(compra: Compra) {
    return (
        TIPOS_RACAO.find((t) => t.key === compra.tipoRacao) ||
        TIPOS_RACAO.find((t) => normalizarTexto(t.label) === normalizarTexto(compra.item)) ||
        TIPOS_RACAO[0]
    );
}

function agruparComprasRacao(compras: Compra[]) {
    const grupos = new Map<TipoRacao, { tipo: TipoRacao; quantidade: number; valor: number; fornecedor: string | null }>();

    compras.forEach((compra) => {
        const tipo = obterTipoCompra(compra).key;
        const quantidade = Number(compra.quantidadeEstoqueKg ?? compra.quantidade ?? 0);
        if (Number.isNaN(quantidade) || quantidade <= 0) return;

        const atual = grupos.get(tipo) || { tipo, quantidade: 0, valor: 0, fornecedor: null };
        grupos.set(tipo, {
            tipo,
            quantidade: atual.quantidade + quantidade,
            valor: atual.valor + Number(compra.precoTotal || 0),
            fornecedor: compra.fornecedor || atual.fornecedor,
        });
    });

    return Array.from(grupos.values());
}

function diasAteValidade(validade?: string | null) {
    if (!validade) return null;
    const hoje = new Date();
    const data = new Date(`${validade.slice(0, 10)}T12:00:00`);
    hoje.setHours(12, 0, 0, 0);
    return Math.ceil((data.getTime() - hoje.getTime()) / 86400000);
}

export default function EstoqueRacao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [racoes, setRacoes] = useState<Racao[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRacao[]>([]);
    const [comprasRacao, setComprasRacao] = useState<Compra[]>([]);

    async function carregarDados() {
        try {
            const [racoesDados, movsDados, comprasDados] = await Promise.all([listarRacoes(), listarMovimentacoesRacao(), listarCompras()]);
            const comprasConcluidas = comprasDados
                .filter((compra) => compra.categoria === "racao" && compra.status === "concluido")
                .sort((a, b) => String(b.data).localeCompare(String(a.data)));
            let racoesAtualizadas = racoesDados as Racao[];
            const tiposEmEstoque = new Set(racoesAtualizadas.map((racao) => racao.tipo));
            const racoesFaltantes = agruparComprasRacao(comprasConcluidas).filter((grupo) => !tiposEmEstoque.has(grupo.tipo));

            if (racoesFaltantes.length > 0) {
                await Promise.all(racoesFaltantes.map((grupo) => {
                    const tipo = TIPOS_RACAO.find((item) => item.key === grupo.tipo) || TIPOS_RACAO[0];
                    return criarRacao({
                        nome: tipo.label,
                        tipo: grupo.tipo,
                        unidade: "kg",
                        quantidadeAtual: grupo.quantidade,
                        estoqueMinimo: 0,
                        custoUnitario: grupo.quantidade > 0 ? grupo.valor / grupo.quantidade : null,
                        fornecedor: grupo.fornecedor,
                        localizacao: null,
                        validade: null,
                        observacoes: "Gerado automaticamente a partir de compras de ração concluídas.",
                    });
                }));
                racoesAtualizadas = await listarRacoes();
            }

            setRacoes(racoesAtualizadas);
            setMovimentacoes(movsDados);
            setComprasRacao(comprasConcluidas);
        } catch (err: any) {
            Toast.show({ type: "error", text1: "Erro ao carregar", text2: err.message || "Não foi possível carregar o estoque.", position: "top" });
        }
    }

    useFocusEffect(useCallback(() => {
        carregarDados();
    }, []));

    const baixoEstoque = racoes.filter((r) => r.quantidadeAtual <= r.estoqueMinimo);
    const vencendo = racoes.filter((r) => {
        const dias = diasAteValidade(r.validade);
        return dias !== null && dias >= 0 && dias <= 30;
    });
    function abrirMovimentacao(racao: Racao) {
        const ultimaCompra = comprasRacao.find((compra) => compra.tipoRacao === racao.tipo || normalizarTexto(compra.item) === normalizarTexto(racao.nome));
        navigation.navigate("movimentar_racao", {
            racoes,
            racaoId: racao.id,
            unidadeCompra: ultimaCompra?.unidadeCompra || null,
            pesoPorUnidadeKg: ultimaCompra?.pesoPorUnidadeKg || null,
        });
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 }}>
                        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Estoque de Ração</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Controle opcional de alimentação</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity onPress={() => navigation.navigate("movimentar_racao", { racoes })} activeOpacity={0.85} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <Feather name="repeat" size={18} color="#fff" />
                            <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Movimentar</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 24 }}>
                    {(baixoEstoque.length > 0 || vencendo.length > 0) && (
                        <View style={{ backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 14, padding: 14, flexDirection: "row", gap: 10 }}>
                            <Feather name="alert-triangle" size={20} color="#ea580c" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a0a0a" }}>Atenção no estoque</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{baixoEstoque.length} abaixo do mínimo e {vencendo.length} vencendo em até 30 dias</Text>
                            </View>
                        </View>
                    )}

                    <View style={{ gap: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>Itens em estoque</Text>
                        {racoes.length === 0 ? (
                            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                                <Feather name="package" size={44} color="#d1d5db" />
                                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10, textAlign: "center" }}>Cadastre compras de ração para alimentar este estoque</Text>
                            </View>
                        ) : (
                            <View style={{ backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f1f5f9", overflow: "hidden" }}>
                                {racoes.map((racao) => {
                                    const tipo = TIPOS_RACAO.find((t) => t.key === racao.tipo) || TIPOS_RACAO[0];
                                    const baixo = racao.quantidadeAtual <= racao.estoqueMinimo;
                                    const dias = diasAteValidade(racao.validade);
                                    const validadeRuim = dias !== null && dias <= 30;
                                    return (
                                        <TouchableOpacity key={racao.id} activeOpacity={0.78} onPress={() => abrirMovimentacao(racao)} style={{ backgroundColor: baixo || validadeRuim ? "#fff7ed" : "#fff", paddingHorizontal: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: tipo.bg, alignItems: "center", justifyContent: "center" }}>
                                                    {racao.tipo === "milho" ? (
                                                        <MaterialCommunityIcons name="corn" size={21} color={tipo.color} />
                                                    ) : (
                                                        <Feather name="package" size={16} color={tipo.color} />
                                                    )}
                                                </View>
                                                <View style={{ flex: 1, minWidth: 0 }}>
                                                    <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: "800", color: "#0a0a0a", lineHeight: 18 }}>{tipo.label}</Text>
                                                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                                        {baixo && <Tag label="Baixo" bg="#fee2e2" text="#b91c1c" />}
                                                        {validadeRuim && <Tag label={dias! < 0 ? "Vencida" : `Vence ${dias}d`} bg="#fef9c3" text="#a16207" />}
                                                    </View>
                                                </View>
                                                <View style={{ alignItems: "flex-end", width: 76 }}>
                                                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 15, fontWeight: "900", color: tipo.color }}>{formatarNumero(racao.quantidadeAtual)} kg</Text>
                                                </View>
                                                <Feather name="chevron-right" size={18} color="#9ca3af" />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a", marginBottom: 10 }}>Compras de ração realizadas</Text>
                        {comprasRacao.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", paddingVertical: 12 }}>Nenhuma compra de ração concluída</Text>
                        ) : comprasRacao.slice(0, 8).map((compra) => {
                            const tipo = obterTipoCompra(compra);
                            const unidade = compra.unidadeCompra ? UNIDADES_COMPRA_RACAO[compra.unidadeCompra] || compra.unidadeCompra : "un.";
                            return (
                                <View key={compra.id} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, fontWeight: "800", color: "#0a0a0a" }}>{tipo.label}</Text>
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                {formatarNumero(compra.quantidade)} {unidade} - {formatarNumero(Number(compra.quantidadeEstoqueKg ?? compra.quantidade))} kg no estoque
                                            </Text>
                                            <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{toBr(compra.data)}{compra.fornecedor ? ` - ${compra.fornecedor}` : ""}</Text>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Tag label={tipo.label} bg={tipo.bg} text={tipo.color} />
                                            <Text style={{ fontSize: 12, fontWeight: "800", color: "#16a34a", marginTop: 6 }}>R$ {compra.precoTotal.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a", marginBottom: 10 }}>Movimentações recentes</Text>
                        {movimentacoes.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", paddingVertical: 12 }}>Nenhuma movimentação registrada</Text>
                        ) : movimentacoes.map((m) => (
                            <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                                <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: m.tipo === "entrada" ? "#dcfce7" : m.tipo === "saida" ? "#fee2e2" : "#dbeafe", alignItems: "center", justifyContent: "center" }}>
                                    <Feather name={m.tipo === "entrada" ? "trending-up" : m.tipo === "saida" ? "trending-down" : "sliders"} size={15} color={m.tipo === "entrada" ? "#15803d" : m.tipo === "saida" ? "#b91c1c" : "#1d4ed8"} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#0a0a0a" }}>{m.racaoNome}</Text>
                                    <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{m.motivo}</Text>
                                    <Text style={{ fontSize: 10, color: "#9ca3af" }}>{toBr(m.data)}{m.destino ? ` - ${m.destino}` : ""}</Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: m.tipo === "entrada" ? "#15803d" : m.tipo === "saida" ? "#b91c1c" : "#1d4ed8" }}>
                                    {m.tipo === "entrada" ? "+" : m.tipo === "saida" ? "-" : "="}{formatarNumero(m.quantidade)} {m.unidade}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function Tag({ label, bg, text }: { label: string; bg: string; text: string }) {
    return (
        <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: text }}>{label}</Text>
        </View>
    );
}

function LinhaInfo({ icon, texto }: { icon: React.ComponentProps<typeof Feather>["name"]; texto: string }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name={icon} size={12} color="#6b7280" />
            <Text style={{ fontSize: 11, color: "#6b7280" }}>{texto}</Text>
        </View>
    );
}
