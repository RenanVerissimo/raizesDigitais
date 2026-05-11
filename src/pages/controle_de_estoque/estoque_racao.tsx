import React, { useCallback, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { listarMovimentacoesRacao, listarRacoes } from "../../services/api";
import { toBr } from "../../utils/formatters";

export type TipoRacao = "milho" | "farelo_soja" | "nucleo_mineral" | "vitaminas";
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
    { key: "nucleo_mineral", label: "Nucleo mineral", color: "#7c3aed", bg: "#ede9fe" },
    { key: "vitaminas", label: "Vitaminas", color: "#1d4ed8", bg: "#dbeafe" },
];

function formatarNumero(valor: number) {
    return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
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

    async function carregarDados() {
        try {
            const [racoesDados, movsDados] = await Promise.all([listarRacoes(), listarMovimentacoesRacao()]);
            setRacoes(racoesDados);
            setMovimentacoes(movsDados);
        } catch (err: any) {
            Toast.show({ type: "error", text1: "Erro ao carregar", text2: err.message || "Nao foi possivel carregar o estoque.", position: "top" });
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
    const valorTotal = racoes.reduce((sum, r) => sum + (r.custoUnitario ?? 0) * r.quantidadeAtual, 0);

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
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Estoque de Racao</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Controle opcional de alimentacao</Text>
                        </View>
                        <MaterialCommunityIcons name="silo" size={28} color="#fff" />
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
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a0a0a" }}>Atencao no estoque</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{baixoEstoque.length} abaixo do minimo e {vencendo.length} vencendo em ate 30 dias</Text>
                            </View>
                        </View>
                    )}

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <ResumoCard icon="package" label="Itens" valor={String(racoes.length)} color="#4a90e2" />
                        <ResumoCard icon="alert-circle" label="Baixo" valor={String(baixoEstoque.length)} color="#ea580c" />
                        <ResumoCard icon="dollar-sign" label="Valor" valor={`R$ ${valorTotal.toFixed(2)}`} color="#16a34a" />
                    </View>

                    <View style={{ gap: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>Itens em estoque</Text>
                        {racoes.length === 0 ? (
                            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                                <Feather name="package" size={44} color="#d1d5db" />
                                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10, textAlign: "center" }}>Cadastre compras de racao para alimentar este estoque</Text>
                            </View>
                        ) : racoes.map((racao) => {
                            const tipo = TIPOS_RACAO.find((t) => t.key === racao.tipo) || TIPOS_RACAO[0];
                            const baixo = racao.quantidadeAtual <= racao.estoqueMinimo;
                            const dias = diasAteValidade(racao.validade);
                            const validadeRuim = dias !== null && dias <= 30;
                            return (
                                <View key={racao.id} style={{ backgroundColor: baixo || validadeRuim ? "#fff7ed" : "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: baixo || validadeRuim ? "#fed7aa" : "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0a0a0a" }}>{racao.nome}</Text>
                                            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                                <Tag label={tipo.label} bg={tipo.bg} text={tipo.color} />
                                                {baixo && <Tag label="Baixo estoque" bg="#fee2e2" text="#b91c1c" />}
                                                {validadeRuim && <Tag label={dias! < 0 ? "Vencida" : `Vence em ${dias}d`} bg="#fef9c3" text="#a16207" />}
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                                        <Info label="Atual" value={`${formatarNumero(racao.quantidadeAtual)} ${racao.unidade}`} />
                                        <Info label="Minimo" value={`${formatarNumero(racao.estoqueMinimo)} ${racao.unidade}`} />
                                        <Info label="Custo" value={racao.custoUnitario == null ? "-" : `R$ ${racao.custoUnitario.toFixed(2)}`} />
                                    </View>
                                    {(racao.fornecedor || racao.localizacao || racao.validade) && (
                                        <View style={{ marginTop: 10, gap: 3 }}>
                                            {racao.fornecedor && <LinhaInfo icon="truck" texto={racao.fornecedor} />}
                                            {racao.localizacao && <LinhaInfo icon="map-pin" texto={racao.localizacao} />}
                                            {racao.validade && <LinhaInfo icon="calendar" texto={`Validade ${toBr(racao.validade)}`} />}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a", marginBottom: 10 }}>Movimentacoes recentes</Text>
                        {movimentacoes.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", paddingVertical: 12 }}>Nenhuma movimentacao registrada</Text>
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

function ResumoCard({ icon, label, valor, color }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; valor: string; color: string }) {
    return (
        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#f1f5f9" }}>
            <Feather name={icon} size={15} color={color} />
            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>{label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 17, fontWeight: "800", color: "#0a0a0a", marginTop: 2 }}>{valor}</Text>
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

function Info({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 10, color: "#6b7280" }}>{label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 13, fontWeight: "800", color: "#0a0a0a", marginTop: 2 }}>{value}</Text>
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
