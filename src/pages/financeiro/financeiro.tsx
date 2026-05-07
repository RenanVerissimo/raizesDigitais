import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { excluirReceita, listarAnimais, listarCompras, listarReceitas } from "../../services/api";
import { Animal, Compra } from "../../interfaces/interfaces";
import Toast from "react-native-toast-message";


export interface Receita {
    id: number;
    data: string;
    litros: number;
    precoPorLitro: number;
    valorTotal: number;
    comprador: string;
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
const PERIODOS_GRAFICO = ["7D", "15D", "30D", "6M", "1A"] as const;
type PeriodoGrafico = typeof PERIODOS_GRAFICO[number];

export default function Financeiro() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [despesas, setDespesas] = useState<DespesaResumo[]>([]);
    const [despesasPendentes, setDespesasPendentes] = useState<Compra[]>([]);
    const [comprasMastite, setComprasMastite] = useState<Compra[]>([]);
    const [animaisMastite, setAnimaisMastite] = useState<Animal[]>([]);
    const [periodoReceitaDespesa, setPeriodoReceitaDespesa] = useState<PeriodoGrafico>("6M");
    const [periodoFluxoCaixa, setPeriodoFluxoCaixa] = useState<PeriodoGrafico>("6M");
    const [periodoCategorias, setPeriodoCategorias] = useState<PeriodoGrafico>("6M");
    const [modalExcluirVisible, setModalExcluirVisible] = useState(false);
    const [receitaSelecionada, setReceitaSelecionada] = useState<Receita | null>(null);

    async function carregarDadosFinanceiros() {
        try {
            // listarCompras() busca os dados da tabela/página compras para separar despesas concluídas e pendentes.
            const [receitasDados, comprasDados, animaisDados] = await Promise.all([
                listarReceitas(),
                listarCompras(),
                listarAnimais(),
            ]);

            const comprasConcluidas = comprasDados.filter((compra) => compra.status === "concluido");
            const comprasPendentes = comprasDados.filter((compra) => compra.status === "pendente");
            const comprasTratamentoMastite = comprasConcluidas.filter((compra) => {
                const texto = `${compra.item} ${compra.observacoes || ""}`.toLowerCase();
                return compra.categoria === "medicamento" && texto.includes("mastite");
            });

            setReceitas(receitasDados);
            setDespesas(
                comprasConcluidas.map((compra) => ({
                    categoria: compra.categoria,
                    valor: compra.precoTotal,
                    data: compra.data,
                }))
            );
            setDespesasPendentes(comprasPendentes);
            setComprasMastite(comprasTratamentoMastite);
            setAnimaisMastite(animaisDados.filter((animal) => Number(animal.mastite) === 1));
        } catch (error: any) {
            Alert.alert("Erro", error.message || "Não foi possível carregar os dados financeiros.");
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

    function handleExcluir(receita: Receita) {
        setReceitaSelecionada(receita);
        setModalExcluirVisible(true);
    }

    async function confirmarExclusaoReceita() {
        if (!receitaSelecionada) return;

        const nomeComprador = receitaSelecionada.comprador;

        try {
            await excluirReceita(receitaSelecionada.id);
            setReceitas((prev) => prev.filter((r) => r.id !== receitaSelecionada.id));

            Toast.show({
                type: "success",
                text1: "Receita excluída",
                text2: `Venda de ${nomeComprador} foi removida com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: error.message || "Não foi possível excluir a receita.",
                position: "top",
                visibilityTime: 3000,
            });
        } finally {
            setModalExcluirVisible(false);
            setReceitaSelecionada(null);
        }
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
    const totalCustoMastite = comprasMastite.reduce((s, compra) => s + compra.precoTotal, 0);
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
    const larguraGraficoReceitaDespesa = periodoReceitaDespesa === "6M" ? "100%" : Math.max(dadosReceitaDespesa.length * 34, 320);
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
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
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
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

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

                    {/* Custo com Mastite */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#fee2e2" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="heart" size={16} color="#dc2626" />
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>Custo com Mastite</Text>
                            </View>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: "#dc2626" }}>
                                {animaisMastite.length} {animaisMastite.length === 1 ? "caso ativo" : "casos ativos"}
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: "#fef2f2", borderRadius: 10 }}>
                            <Text style={{ fontSize: 13, color: "#6b7280" }}>Medicamentos vinculados</Text>
                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#dc2626" }}>R$ {totalCustoMastite.toFixed(2)}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                            Considera compras concluídas em Medicamentos com "mastite" no item ou nas observações.
                        </Text>
                    </View>

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

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ width: larguraGraficoReceitaDespesa, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 160, gap: 6 }}>
                                {dadosReceitaDespesa.map((m, i) => {
                                    const alturaR = (m.receita / valorMaximoReceitaDespesa) * 130;
                                    const alturaD = (m.despesa / valorMaximoReceitaDespesa) * 130;
                                    return (
                                        <View key={`${m.label}-${i}`} style={{ flex: 1, minWidth: periodoReceitaDespesa === "6M" ? 0 : 28, alignItems: "center" }}>
                                            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 130 }}>
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
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Fluxo de Caixa - Saldo dos últimos 6 meses */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                Fluxo de Caixa (Saldo)
                            </Text>
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
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                    Despesas por Categoria
                                </Text>
                            </View>
                            <View style={{ gap: 10 }}>
                                {dadosCategorias.map((d, i) => {
                                    const cfg = CATEGORIA_LABEL[d.categoria];
                                    return (
                                        <View key={i}>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: cfg.cor }} />
                                                    <Text style={{ fontSize: 13, color: "#0a0a0a" }}>{cfg.label}</Text>
                                                </View>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0a0a0a" }}>
                                                    R$ {d.valor.toFixed(2)} ({d.percentual.toFixed(0)}%)
                                                </Text>
                                            </View>
                                            <View style={{ width: "100%", height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                                                <View style={{ width: `${d.percentual}%`, height: "100%", backgroundColor: cfg.cor }} />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Receitas Recentes */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: insets.bottom + 20 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
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
                        {receitas.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", paddingVertical: 20 }}>
                                Nenhuma receita registrada
                            </Text>
                        ) : (
                            <View style={{ gap: 10 }}>
                                {receitas.slice(0, 5).map((r) => (
                                    <View key={r.id} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12 }}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>{r.comprador}</Text>
                                                <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                    {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row", gap: 6 }}>
                                                <TouchableOpacity
                                                    onPress={() => navigation.navigate("editar_receita", { receita: r })}
                                                    activeOpacity={0.7}
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        backgroundColor: "#f59e0b",
                                                        borderRadius: 8,
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Feather name="edit-2" size={16} color="#fff" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleExcluir(r)}
                                                    activeOpacity={0.7}
                                                    style={{ width: 32, height: 32, backgroundColor: "#ef4444", borderRadius: 8, alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Feather name="trash-2" size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                                {r.litros}L × R$ {r.precoPorLitro.toFixed(2)}
                                            </Text>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
                                                R$ {r.valorTotal.toFixed(2)}
                                            </Text>
                                        </View>
                                        {r.observacoes && (
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6, fontStyle: "italic" }}>
                                                {r.observacoes}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
            <Modal
                visible={modalExcluirVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalExcluirVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
                        <View style={{ alignItems: "center", marginBottom: 16 }}>
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fecaca" }}>
                                <Feather name="trash-2" size={28} color="#ef4444" />
                            </View>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0a0a0a", textAlign: "center", marginBottom: 8 }}>
                            Excluir receita
                        </Text>
                        <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
                            Tem certeza que deseja excluir a venda para{" "}
                            <Text style={{ fontWeight: "700", color: "#0a0a0a" }}>{receitaSelecionada?.comprador || ""}</Text>?
                        </Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setModalExcluirVisible(false)}
                                activeOpacity={0.7}
                                style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmarExclusaoReceita}
                                activeOpacity={0.8}
                                style={{ flex: 1, backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
                            >
                                <Feather name="trash-2" size={16} color="#fff" />
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Excluir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
