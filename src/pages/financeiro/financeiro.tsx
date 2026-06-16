import React, { useCallback, useState } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { VictoryLabel, VictoryPie } from "victory-native";
import { listarCompras, listarReceitas } from "../../services/api";
import { Compra } from "../../interfaces/interfaces";
import Toast from "react-native-toast-message";


export interface Receita {
    id: number;
    tipoReceita?: "leite" | "animal";
    data: string;
    litros: number;
    precoPorLitro: number;
    valorTotal: number;
    comprador: string;
    animalId?: number | null;
    animalNome?: string | null;
    animalIdentificador?: string | null;
    animalPeso?: number | null;
    valorAnimal?: number | null;
    observacoes?: string | null;
}

export interface DespesaResumo {
    categoria: "racao" | "medicamento" | "equipamento" | "manutencao" | "outros";
    valor: number;
    data: string;
}

const CATEGORIA_LABEL: Record<DespesaResumo["categoria"], { label: string; cor: string }> = {
    racao: { label: "Ração", cor: "#f97316" },
    medicamento: { label: "Medicamentos", cor: "#ef4444" },
    equipamento: { label: "Equipamentos", cor: "#3b82f6" },
    manutencao: { label: "Manutenção", cor: "#a855f7" },
    outros: { label: "Outros", cor: "#6b7280" },
};

const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CHART_WIDTH = Dimensions.get("window").width - 40;
const PERIODOS_GRAFICO = ["7D", "15D", "30D", "6M", "1A"] as const;
type PeriodoGrafico = typeof PERIODOS_GRAFICO[number];
type GrupoMedicamento = { chave: string; label: string; cor: string };

const GRUPOS_MEDICAMENTO_PRODUTO: Record<string, GrupoMedicamento> = {
    vacina: { chave: "vacina", label: "Vacina", cor: "#2563eb" },
    antibiotico: { chave: "antibiotico", label: "Antibiótico", cor: "#7c3aed" },
    remedio: { chave: "remedio", label: "Remédio", cor: "#dc2626" },
    outro: { chave: "outro", label: "Outro", cor: "#4b5563" },
};

function normalizarTexto(texto: string) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarMoedaGrafico(valor: number) {
    if (valor <= 0) return "R$ 0";
    if (valor >= 1000000) {
        const valorCompacto = valor >= 10000000 ? (valor / 1000000).toFixed(0) : (valor / 1000000).toFixed(1).replace(".", ",");
        return `R$ ${valorCompacto} mi`;
    }
    if (valor >= 1000) {
        const valorCompacto = valor >= 10000 ? (valor / 1000).toFixed(0) : (valor / 1000).toFixed(1).replace(".", ",");
        return `R$ ${valorCompacto} mil`;
    }
    return `R$ ${valor.toFixed(0)}`;
}

function classificarMedicamento(compra: Compra): GrupoMedicamento {
    const item = normalizarTexto(compra.item);

    if (item === "vacina" || item.includes("vacina") || item.includes("vacin")) return GRUPOS_MEDICAMENTO_PRODUTO.vacina;
    if (item === "antibiotico" || item.includes("antibiotico")) return GRUPOS_MEDICAMENTO_PRODUTO.antibiotico;
    if (item === "remedio" || item.includes("remedio")) return GRUPOS_MEDICAMENTO_PRODUTO.remedio;

    return GRUPOS_MEDICAMENTO_PRODUTO.outro;
}

export default function Financeiro() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const receitaDespesaScrollRef = React.useRef<ScrollView | null>(null);

    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [despesas, setDespesas] = useState<DespesaResumo[]>([]);
    const [despesasPendentes, setDespesasPendentes] = useState<Compra[]>([]);
    const [comprasConcluidas, setComprasConcluidas] = useState<Compra[]>([]);
    const [periodoReceitaDespesa, setPeriodoReceitaDespesa] = useState<PeriodoGrafico>("6M");
    const [periodoFluxoCaixa, setPeriodoFluxoCaixa] = useState<PeriodoGrafico>("6M");
    const [periodoCategorias, setPeriodoCategorias] = useState<PeriodoGrafico>("6M");
    const [carregando, setCarregando] = useState(true);

    async function carregarDadosFinanceiros() {
        try {
            setCarregando(true);
            // listarCompras() busca os dados da tabela/página compras para separar despesas concluídas e pendentes.
            const [receitasDados, comprasDados] = await Promise.all([
                listarReceitas(),
                listarCompras(),
            ]);

            const comprasConcluidas = comprasDados.filter((compra) => compra.status === "concluido");
            const comprasPendentes = comprasDados.filter((compra) => compra.status === "pendente");

            setReceitas(receitasDados);
            setComprasConcluidas(comprasConcluidas);
            setDespesas(
                comprasConcluidas.map((compra) => ({
                    categoria: compra.categoria,
                    valor: compra.precoTotal,
                    data: compra.data,
                }))
            );
            setDespesasPendentes(comprasPendentes);
        } catch (error: any) {
            Toast.show({ type: "error", text1: "Erro", text2: error.message || "Não foi possível carregar os dados financeiros.", position: "top", visibilityTime: 3000 });
        } finally {
            setCarregando(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            carregarDadosFinanceiros();
        }, [])
    );

    function handleAdicionarReceita(nova: Receita) {
        setReceitas((prev) => [nova, ...prev.filter((r) => r.id !== nova.id)]);
    }
    function formatarChaveData(data: Date) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    // ===== Cálculos =====
    const totalReceitas = receitas.reduce((s, r) => s + r.valorTotal, 0);
    const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const receitaMes = receitas
        .filter((r) => {
            const d = new Date(r.data + "T12:00:00");
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        })
        .reduce((s, r) => s + r.valorTotal, 0);

    const despesaMes = despesas
        .filter((d) => {
            const dt = new Date(d.data + "T12:00:00");
            return dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual;
        })
        .reduce((s, d) => s + d.valor, 0);

    const despesaPendenteMes = despesasPendentes
        .filter((d) => {
            const dt = new Date(d.data + "T12:00:00");
            return dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual;
        })
        .reduce((s, d) => s + d.precoTotal, 0);

    const saldoMes = receitaMes - despesaMes;

    // Últimos 6 meses
    function gerarDadosGrafico(periodo: PeriodoGrafico) {
        if (periodo === "6M" || periodo === "1A") {
            const quantidadeMeses = periodo === "6M" ? 6 : 12;

            return Array.from({ length: quantidadeMeses }, (_, i) => {
                const data = new Date(anoAtual, mesAtual - (quantidadeMeses - 1 - i), 1);
                const mes = data.getMonth();
                const ano = data.getFullYear();

                const receita = receitas
                    .filter((r) => {
                        const d = new Date(r.data + "T12:00:00");
                        return d.getMonth() === mes && d.getFullYear() === ano;
                    })
                    .reduce((s, r) => s + r.valorTotal, 0);

                const despesa = despesas
                    .filter((d) => {
                        const dt = new Date(d.data + "T12:00:00");
                        return dt.getMonth() === mes && dt.getFullYear() === ano;
                    })
                    .reduce((s, d) => s + d.valor, 0);

                return { label: NOMES_MES[mes], receita, despesa, saldo: receita - despesa };
            });
        }

        const quantidadeDias = Number(periodo.replace("D", ""));

        return Array.from({ length: quantidadeDias }, (_, i) => {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() - (quantidadeDias - 1 - i));

            const chave = formatarChaveData(data);
            const label = `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;

            const receita = receitas
                .filter((r) => r.data === chave)
                .reduce((s, r) => s + r.valorTotal, 0);

            const despesa = despesas
                .filter((d) => d.data === chave)
                .reduce((s, d) => s + d.valor, 0);

            return { label, receita, despesa, saldo: receita - despesa };
        });
    }

    function renderSeletorPeriodo(periodoAtual: PeriodoGrafico, onChange: (periodo: PeriodoGrafico) => void) {
        return (
            <View style={{
                flexDirection: "row",
                backgroundColor: "#f3f4f6",
                borderRadius: 10,
                padding: 3,
                alignSelf: "stretch",  // ocupa toda a largura disponível
            }}>
                {PERIODOS_GRAFICO.map((periodo) => {
                    const ativo = periodoAtual === periodo;
                    return (
                        <TouchableOpacity
                            key={periodo}
                            activeOpacity={0.75}
                            onPress={() => onChange(periodo)}
                            style={{
                                flex: 1,
                                backgroundColor: ativo ? "#fff" : "transparent",
                                borderRadius: 8,
                                paddingVertical: 7,
                                alignItems: "center",
                                shadowColor: ativo ? "#000" : "transparent",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: ativo ? 0.08 : 0,
                                shadowRadius: 2,
                                elevation: ativo ? 2 : 0,
                            }}
                        >
                            <Text style={{
                                fontSize: 11,
                                fontWeight: ativo ? "700" : "500",
                                color: ativo ? "#4a90e2" : "#9ca3af",
                            }}>
                                {periodo}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    }

    const dadosReceitaDespesa = gerarDadosGrafico(periodoReceitaDespesa);
    const dadosFluxoCaixa = gerarDadosGrafico(periodoFluxoCaixa);
    const larguraGraficoReceitaDespesa = Math.max(dadosReceitaDespesa.length * 58, CHART_WIDTH - 36);
    const valorMaximoReceitaDespesa = Math.max(
        ...dadosReceitaDespesa.map((m) => Math.max(m.receita, m.despesa)),
        1
    );
    const valorMaximoFluxo = Math.max(
        ...dadosFluxoCaixa.map((m) => Math.abs(m.saldo)),
        1
    );

    function dataDentroDoPeriodo(dataTexto: string, periodo: PeriodoGrafico) {
        const data = new Date(dataTexto + "T12:00:00");

        if (periodo === "6M" || periodo === "1A") {
            const meses = periodo === "6M" ? 6 : 12;
            const inicio = new Date(anoAtual, mesAtual - (meses - 1), 1);
            const fim = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59);
            return data >= inicio && data <= fim;
        }

        const dias = Number(periodo.replace("D", ""));
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - (dias - 1));
        inicio.setHours(0, 0, 0, 0);

        const fim = new Date(hoje);
        fim.setHours(23, 59, 59, 999);

        return data >= inicio && data <= fim;
    }

    // Despesas por categoria
    const despesasPorCategoria = despesas
        .filter((d) => dataDentroDoPeriodo(d.data, periodoCategorias))
        .reduce((acc, d) => {
            acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
            return acc;
        }, {} as Record<string, number>);

    const totalDespesasCategorias = Object.values(despesasPorCategoria).reduce((s, valor) => s + valor, 0);

    const dadosCategorias = Object.entries(despesasPorCategoria)
        .map(([cat, valor]) => ({
            categoria: cat as DespesaResumo["categoria"],
            valor,
            percentual: totalDespesasCategorias > 0 ? (valor / totalDespesasCategorias) * 100 : 0,
        }))
        .sort((a, b) => b.valor - a.valor);

    const comprasMedicamentos = comprasConcluidas.filter((compra) => compra.categoria === "medicamento");
    const totalMedicamentos = comprasMedicamentos.reduce((s, compra) => s + compra.precoTotal, 0);
    const dadosMedicamentosPorProduto = comprasMedicamentos.reduce((acc, compra) => {
        const grupo = classificarMedicamento(compra);
        acc[grupo.chave].valor += compra.precoTotal;
        acc[grupo.chave].quantidade += 1;
        return acc;
    }, {
        vacina: { ...GRUPOS_MEDICAMENTO_PRODUTO.vacina, valor: 0, quantidade: 0 },
        antibiotico: { ...GRUPOS_MEDICAMENTO_PRODUTO.antibiotico, valor: 0, quantidade: 0 },
        remedio: { ...GRUPOS_MEDICAMENTO_PRODUTO.remedio, valor: 0, quantidade: 0 },
        outro: { ...GRUPOS_MEDICAMENTO_PRODUTO.outro, valor: 0, quantidade: 0 },
    } as Record<string, GrupoMedicamento & { valor: number; quantidade: number }>);

    const dadosGraficoMedicamentos = ["vacina", "antibiotico", "remedio", "outro"]
        .map((chave) => {
            const grupo = dadosMedicamentosPorProduto[chave];
            return {
                ...grupo,
                percentual: totalMedicamentos > 0 ? (grupo.valor / totalMedicamentos) * 100 : 0,
            };
        });

    const dadosMedicamentosComValor = dadosGraficoMedicamentos.filter((grupo) => grupo.valor > 0);
    const valorMaximoMedicamentos = Math.max(...dadosGraficoMedicamentos.map((grupo) => grupo.valor), 1);

    function renderReceitasRecentes() {
        return (
            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                        Receitas Recentes
                    </Text>
                    {receitas.length > 5 && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate("ver_todas_receitas")}
                            activeOpacity={0.7}
                            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: "600", color: "#4a90e2" }}>Ver todos</Text>
                            <Feather name="chevron-right" size={16} color="#4a90e2" />
                        </TouchableOpacity>
                    )}
                </View>

                {carregando ? (
                    <View style={{ alignItems: "center", paddingVertical: 18 }}>
                        <ActivityIndicator color="#4a90e2" />
                        <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                            Carregando receitas
                        </Text>
                    </View>
                ) : receitas.length === 0 ? (
                    <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", paddingVertical: 16 }}>
                        Nenhuma receita registrada
                    </Text>
                ) : (
                    <View style={{ gap: 8 }}>
                        {receitas.slice(0, 5).map((r) => {
                            const vendaAnimal = r.tipoReceita === "animal";
                            return (
                                <View key={r.id} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                                        <View
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 9,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: vendaAnimal ? "#fff7ed" : "#eff6ff",
                                            }}
                                        >
                                            {vendaAnimal ? (
                                                <MaterialCommunityIcons name="cow" size={20} color="#ea580c" />
                                            ) : (
                                                <Feather name="droplet" size={18} color="#2563eb" />
                                            )}
                                        </View>

                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 13, fontWeight: "700", color: "#0a0a0a" }}>
                                                    {r.comprador || "Comprador não informado"}
                                                </Text>
                                                <View
                                                    style={{
                                                        paddingHorizontal: 7,
                                                        paddingVertical: 3,
                                                        borderRadius: 999,
                                                        backgroundColor: vendaAnimal ? "#fff7ed" : "#eff6ff",
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 10, fontWeight: "800", color: vendaAnimal ? "#c2410c" : "#1d4ed8" }}>
                                                        {vendaAnimal ? "Animal" : "Leite"}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
                                                {!vendaAnimal ? ` - ${r.litros}L x R$ ${r.precoPorLitro.toFixed(2)}` : ""}
                                            </Text>
                                        </View>

                                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#16a34a" }}>
                                            R$ {r.valorTotal.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 }}>
                        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Financeiro</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Controle de receitas e despesas
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("cadastrar_receita", { onCadastrar: handleAdicionarReceita })}
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                            Registrar Receita (Venda)
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("financiamentos")}
                        style={{ marginTop: 10, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                        <Feather name="dollar-sign" size={20} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                            Financiamentos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("previsao_receita")}
                        style={{ marginTop: 10, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                        <Feather name="trending-up" size={20} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                            Previsão de Receita
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    {carregando && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9", alignItems: "center" }}>
                            <ActivityIndicator color="#4a90e2" />
                            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                                Carregando dados financeiros
                            </Text>
                        </View>
                    )}

                    {/* Saldo Total */}
                    <View style={{
                        backgroundColor: saldo >= 0 ? "#f0fdf4" : "#fef2f2",
                        borderWidth: 1,
                        borderColor: saldo >= 0 ? "#bbf7d0" : "#fecaca",
                        borderRadius: 16,
                        padding: 18,
                    }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 13, color: saldo >= 0 ? "#15803d" : "#b91c1c" }}>Saldo Total</Text>
                            <Feather name="dollar-sign" size={20} color={saldo >= 0 ? "#16a34a" : "#dc2626"} />
                        </View>
                        <Text style={{ fontSize: 28, fontWeight: "700", color: saldo >= 0 ? "#15803d" : "#b91c1c" }}>
                            R$ {saldo.toFixed(2)}
                        </Text>
                    </View>

                    {/* Cards Receitas / Despesas */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <Feather name="trending-up" size={14} color="#16a34a" />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Receitas</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#16a34a" }}>
                                R$ {totalReceitas.toFixed(2)}
                            </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <Feather name="trending-down" size={14} color="#dc2626" />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Despesas</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#dc2626" }}>
                                R$ {totalDespesas.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {renderReceitasRecentes()}

                    {/* Mês Atual */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 12 }}>
                            Mês Atual ({NOMES_MES[mesAtual]}/{anoAtual})
                        </Text>
                        <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: "#f0fdf4", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Receitas</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#16a34a" }}>R$ {receitaMes.toFixed(2)}</Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: "#fef2f2", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Despesas</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#dc2626" }}>R$ {despesaMes.toFixed(2)}</Text>
                            </View>
                            <View style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                padding: 12,
                                backgroundColor: saldoMes >= 0 ? "#eff6ff" : "#fff7ed",
                                borderRadius: 10
                            }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Saldo do Mês</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: saldoMes >= 0 ? "#4a90e2" : "#ea580c" }}>
                                    R$ {saldoMes.toFixed(2)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => navigation.navigate("compras_e_pedidos", { filtroStatusInicial: "pendente" })}
                                style={{
                                    padding: 12,
                                    backgroundColor: "#f9fafb",
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                                        <Feather name="clock" size={15} color="#6b7280" />
                                        <Text style={{ fontSize: 13, color: "#6b7280" }}>
                                            Compras pendentes
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>
                                            R$ {despesaPendenteMes.toFixed(2)}
                                        </Text>
                                        <Feather name="chevron-right" size={16} color="#9ca3af" />
                                    </View>
                                </View>
                                <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                                    {despesasPendentes.length} compra{despesasPendentes.length === 1 ? "" : "s"} aguardando conclusão. Este valor ainda não entra no saldo.
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Gráfico de Barras - Últimos 6 Meses */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                Receita x Despesa
                            </Text>

                        </View>

                        <View style={{ backgroundColor: "#fff", borderRadius: 14, alignItems: "center" }}>
                            {renderSeletorPeriodo(periodoReceitaDespesa, setPeriodoReceitaDespesa)}
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 24, marginBottom: 8, marginTop: 8 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#10b981" }} />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Receita</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#ef4444" }} />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Despesa</Text>
                            </View>
                        </View>
                        {periodoReceitaDespesa !== "6M" && (
                            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 8 }}>

                            </View>
                        )}

                        <ScrollView
                            ref={receitaDespesaScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            onContentSizeChange={() => receitaDespesaScrollRef.current?.scrollToEnd({ animated: false })}
                        >
                            <View style={{ width: larguraGraficoReceitaDespesa, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", minHeight: 196, gap: 6 }}>
                                {dadosReceitaDespesa.map((m, i) => {
                                    const alturaR = (m.receita / valorMaximoReceitaDespesa) * 115;
                                    const alturaD = (m.despesa / valorMaximoReceitaDespesa) * 115;
                                    return (
                                        <View key={`${m.label}-${i}`} style={{ width: 52, alignItems: "center" }}>
                                            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 115 }}>
                                                <View style={{
                                                    width: 12,
                                                    height: Math.max(alturaR, m.receita > 0 ? 4 : 0),
                                                    backgroundColor: "#10b981",
                                                    borderTopLeftRadius: 4,
                                                    borderTopRightRadius: 4,
                                                }} />
                                                <View style={{
                                                    width: 12,
                                                    height: Math.max(alturaD, m.despesa > 0 ? 4 : 0),
                                                    backgroundColor: "#ef4444",
                                                    borderTopLeftRadius: 4,
                                                    borderTopRightRadius: 4,
                                                }} />
                                            </View>
                                            <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 6 }}>{m.label}</Text>
                                            <View style={{ marginTop: 4, alignItems: "center", gap: 2, width: 52 }}>
                                                <Text
                                                    numberOfLines={1}
                                                    adjustsFontSizeToFit
                                                    minimumFontScale={0.65}
                                                    style={{ width: 52, fontSize: 9, fontWeight: "800", color: "#059669", textAlign: "center" }}
                                                >
                                                    {formatarMoedaGrafico(m.receita)}
                                                </Text>
                                                <Text
                                                    numberOfLines={1}
                                                    adjustsFontSizeToFit
                                                    minimumFontScale={0.65}
                                                    style={{ width: 52, fontSize: 9, fontWeight: "800", color: "#dc2626", textAlign: "center" }}
                                                >
                                                    {formatarMoedaGrafico(m.despesa)}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Fluxo de Caixa - Saldo dos últimos 6 meses */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                    Fluxo de Caixa (Saldo)
                                </Text>
                                <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                                    Saldo = receitas - despesas concluídas
                                </Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 12, gap: 10 }}>
                            {renderSeletorPeriodo(periodoFluxoCaixa, setPeriodoFluxoCaixa)}
                        </View>

                        <View style={{ gap: 8 }}>
                            {dadosFluxoCaixa.map((m, i) => {
                                const positivo = m.saldo >= 0;
                                return (
                                    <View key={`${m.label}-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <Text style={{ width: periodoFluxoCaixa === "6M" ? 32 : 46, fontSize: 11, color: "#6b7280" }}>{m.label}</Text>
                                        <View style={{ flex: 1, height: 22, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden", flexDirection: "row", alignItems: "center" }}>
                                            <View style={{
                                                width: `${Math.min(Math.abs(m.saldo) / valorMaximoFluxo * 100, 100)}%`,
                                                height: "100%",
                                                backgroundColor: positivo ? "#4a90e2" : "#f97316",
                                            }} />
                                        </View>
                                        <Text style={{ width: 80, fontSize: 11, fontWeight: "600", color: positivo ? "#4a90e2" : "#f97316", textAlign: "right" }}>
                                            R$ {m.saldo.toFixed(0)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Despesas por Categoria */}
                    {dadosCategorias.length > 0 && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Feather name="pie-chart" size={17} color="#dc2626" />
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                        Despesas por Categoria
                                    </Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
                                Compras concluídas - total {formatarMoeda(totalDespesasCategorias)}
                            </Text>

                            {renderSeletorPeriodo(periodoCategorias, setPeriodoCategorias)}

                            <VictoryPie
                                width={CHART_WIDTH - 36}
                                height={230}
                                data={dadosCategorias.map((d) => ({
                                    x: CATEGORIA_LABEL[d.categoria].label,
                                    y: d.valor,
                                    label: `${d.percentual.toFixed(1)}%`,
                                }))}
                                colorScale={dadosCategorias.map((d) => CATEGORIA_LABEL[d.categoria].cor)}
                                radius={92}
                                innerRadius={38}
                                labelRadius={68}
                                padAngle={2}
                                labels={({ datum }: any) => datum.label}
                                labelComponent={
                                    <VictoryLabel
                                        textAnchor="middle"
                                        verticalAnchor="middle"
                                    />
                                }
                                style={{
                                    data: { stroke: "#fff", strokeWidth: 2 },
                                    labels: { fill: "#fff", fontSize: 10, fontWeight: "900" },
                                }}
                            />

                            <View style={{ gap: 10 }}>
                                {dadosCategorias.map((d) => {
                                    const cfg = CATEGORIA_LABEL[d.categoria];
                                    const larguraBarra = `${Math.max(d.percentual, d.valor > 0 ? 8 : 0)}%` as `${number}%`;
                                    return (
                                        <View key={d.categoria} style={{ gap: 6 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                                <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: cfg.cor }} />
                                                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: "800", color: "#374151" }}>
                                                        {cfg.label}
                                                    </Text>
                                                </View>
                                                <Text style={{ fontSize: 12, fontWeight: "900", color: "#0f172a" }}>
                                                    {d.percentual.toFixed(1)}% - {formatarMoeda(d.valor)}
                                                </Text>
                                            </View>
                                            <View style={{ height: 22, borderRadius: 999, backgroundColor: "#f3f4f6", overflow: "hidden" }}>
                                                <View style={{ width: larguraBarra, height: "100%", backgroundColor: cfg.cor, borderRadius: 999, justifyContent: "center", paddingHorizontal: 8 }}>
                                                    {d.percentual >= 18 && (
                                                        <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}>
                                                            {d.percentual.toFixed(1)}%
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                    {/* Gastos com Medicamentos */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: insets.bottom + 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <Feather name="plus-circle" size={16} color="#ef4444" />
                            <View>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>Gastos com Medicamentos</Text>
                                <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Por tipo de produto</Text>
                            </View>
                        </View>

                        <View style={{ gap: 8 }}>
                            {dadosMedicamentosComValor.length === 0 ? (
                                <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", paddingVertical: 18 }}>
                                    Nenhuma compra concluída em Medicamentos.
                                </Text>
                            ) : (
                                dadosMedicamentosComValor.map((dados) => (
                                    <View key={dados.chave} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <Text style={{ width: 96, fontSize: 11, color: "#6b7280" }} numberOfLines={1}>
                                            {dados.label}
                                        </Text>
                                        <View style={{ flex: 1, height: 18, backgroundColor: "#f3f4f6", borderRadius: 999, overflow: "hidden", flexDirection: "row", alignItems: "center" }}>
                                            <View style={{
                                                width: `${Math.min((dados.valor / valorMaximoMedicamentos) * 100, 100)}%` as `${number}%`,
                                                height: "100%",
                                                backgroundColor: dados.cor,
                                                borderRadius: 999,
                                            }} />
                                        </View>
                                        <Text style={{ width: 76, fontSize: 11, fontWeight: "700", color: dados.cor, textAlign: "right" }}>
                                            R$ {dados.valor.toFixed(0)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                                <Text style={{ fontSize: 11, color: "#6b7280", fontWeight: "700" }}>Total em medicamentos</Text>
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: "900", color: "#0f172a" }}>
                                {formatarMoeda(totalMedicamentos)}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
                            Considera compras concluídas na categoria Medicamentos.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

