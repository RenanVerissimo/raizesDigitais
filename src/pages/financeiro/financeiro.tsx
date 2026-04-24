import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export interface Receita {
    id: string;
    data: string;
    litros: number;
    precoPorLitro: number;
    valorTotal: number;
    comprador: string;
    observacoes?: string;
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

export default function financeiro() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [receitas, setReceitas] = useState<Receita[]>([]);
    // 🔌 Quando plugar o backend, buscar despesas (compras concluídas) aqui
    const [despesas] = useState<DespesaResumo[]>([]);

    function handleAdicionarReceita(nova: Receita) {
        setReceitas((prev) => [nova, ...prev]);
    }

    function handleExcluir(receita: Receita) {
        Alert.alert("Excluir receita", `Excluir venda para "${receita.comprador}"?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: () => setReceitas((prev) => prev.filter((r) => r.id !== receita.id)),
            },
        ]);
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

    const saldoMes = receitaMes - despesaMes;

    // Últimos 6 meses
    const ultimosMeses = Array.from({ length: 6 }, (_, i) => {
        const data = new Date(anoAtual, mesAtual - (5 - i), 1);
        const mes = data.getMonth();
        const ano = data.getFullYear();

        const rec = receitas
            .filter((r) => {
                const d = new Date(r.data + "T12:00:00");
                return d.getMonth() === mes && d.getFullYear() === ano;
            })
            .reduce((s, r) => s + r.valorTotal, 0);

        const desp = despesas
            .filter((d) => {
                const dt = new Date(d.data + "T12:00:00");
                return dt.getMonth() === mes && dt.getFullYear() === ano;
            })
            .reduce((s, d) => s + d.valor, 0);

        return { mes: NOMES_MES[mes], receita: rec, despesa: desp, saldo: rec - desp };
    });

    const valorMaximoBarra = Math.max(
        ...ultimosMeses.map((m) => Math.max(m.receita, m.despesa)),
        1
    );

    // Despesas por categoria
    const despesasPorCategoria = despesas.reduce((acc, d) => {
        acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
        return acc;
    }, {} as Record<string, number>);

    const dadosCategorias = Object.entries(despesasPorCategoria)
        .map(([cat, valor]) => ({
            categoria: cat as DespesaResumo["categoria"],
            valor,
            percentual: (valor / totalDespesas) * 100,
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
                        </View>
                    </View>

                    {/* Gráfico de Barras - Últimos 6 Meses */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 14 }}>
                            Últimos 6 Meses
                        </Text>

                        <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#10b981" }} />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Receita</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#ef4444" }} />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Despesa</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 160, gap: 6 }}>
                            {ultimosMeses.map((m, i) => {
                                const alturaR = (m.receita / valorMaximoBarra) * 130;
                                const alturaD = (m.despesa / valorMaximoBarra) * 130;
                                return (
                                    <View key={i} style={{ flex: 1, alignItems: "center" }}>
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
                                        <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 6 }}>{m.mes}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Fluxo de Caixa - Saldo dos últimos 6 meses */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 14 }}>
                            Fluxo de Caixa (Saldo)
                        </Text>
                        <View style={{ gap: 8 }}>
                            {ultimosMeses.map((m, i) => {
                                const positivo = m.saldo >= 0;
                                return (
                                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <Text style={{ width: 32, fontSize: 11, color: "#6b7280" }}>{m.mes}</Text>
                                        <View style={{ flex: 1, height: 22, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden", flexDirection: "row", alignItems: "center" }}>
                                            <View style={{
                                                width: `${Math.min(Math.abs(m.saldo) / valorMaximoBarra * 100, 100)}%`,
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
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 14 }}>
                                Despesas por Categoria
                            </Text>
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
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 12 }}>
                            Receitas Recentes
                        </Text>
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
                                            <TouchableOpacity onPress={() => handleExcluir(r)} style={{ padding: 4 }} activeOpacity={0.7}>
                                                <Feather name="trash-2" size={16} color="#9ca3af" />
                                            </TouchableOpacity>
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
        </View>
    );
}