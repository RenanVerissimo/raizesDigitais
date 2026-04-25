import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export interface RegistroProducao {
    id: string;
    data: string;
    producao_manha: number;
    producao_tarde: number;
    producao_total: number;
    qualidade: "excellent" | "good" | "regular";
    observacoes?: string;
}

export default function graficos() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    // Recebe os dados da tela anterior OU usa array vazio
    const producoes: RegistroProducao[] = route.params?.producoes ?? [];

    // ===== Cálculos =====
    const ordenadas = [...producoes].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    const ultimos15 = ordenadas.slice(-15);
    const ultimos10 = ordenadas.slice(-10);

    const mediaProducao = producoes.length > 0
        ? Math.round(producoes.reduce((s, p) => s + p.producao_total, 0) / producoes.length)
        : 0;

    const totalProducao = producoes.reduce((s, p) => s + p.producao_total, 0);
    const maxProducao = producoes.length ? Math.max(...producoes.map((p) => p.producao_total)) : 0;
    const minProducao = producoes.length ? Math.min(...producoes.map((p) => p.producao_total)) : 0;

    // Para o "gráfico de linha" — pega o máximo dos últimos 15 dias pra escalar as barras
    const maxBarra = Math.max(...ultimos15.map((p) => p.producao_total), 1);
    const maxManhaTarde = Math.max(
        ...ultimos10.map((p) => Math.max(p.producao_manha, p.producao_tarde)),
        1
    );

    // Distribuição de qualidade
    const qualidades = [
        { label: "Excelente", chave: "excellent" as const, cor: "#10b981" },
        { label: "Boa", chave: "good" as const, cor: "#3b82f6" },
        { label: "Regular", chave: "regular" as const, cor: "#eab308" },
    ];

    const dadosQualidade = qualidades
        .map((q) => ({
            ...q,
            qtd: producoes.filter((p) => p.qualidade === q.chave).length,
        }))
        .filter((q) => q.qtd > 0);

    const totalQualidade = dadosQualidade.reduce((s, q) => s + q.qtd, 0);

    function formatarData(d: string) {
        const data = new Date(d + "T12:00:00");
        return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* HEADER */}
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Análises e Gráficos
                            </Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Visualize o desempenho da produção
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    {producoes.length === 0 ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Feather name="bar-chart-2" size={48} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10, textAlign: "center" }}>
                                Nenhuma produção registrada ainda.{"\n"}Cadastre produções para ver as análises.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* MÉTRICAS PRINCIPAIS */}
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                        <Feather name="trending-up" size={14} color="#16a34a" />
                                        <Text style={{ fontSize: 11, color: "#6b7280" }}>Média Diária</Text>
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: "700", color: "#0a0a0a" }}>
                                        {mediaProducao}L
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                        <Feather name="calendar" size={14} color="#4a90e2" />
                                        <Text style={{ fontSize: 11, color: "#6b7280" }}>Total Geral</Text>
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: "700", color: "#0a0a0a" }}>
                                        {totalProducao.toLocaleString("pt-BR")}L
                                    </Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Máximo</Text>
                                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#16a34a" }}>{maxProducao}L</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Mínimo</Text>
                                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#ea580c" }}>{minProducao}L</Text>
                                </View>
                            </View>

                            {/* GRÁFICO 1 - Evolução da Produção (últimos 15 dias) */}
                            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                    <Feather name="bar-chart-2" size={18} color="#4a90e2" />
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                        Evolução da Produção
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
                                    Últimos {ultimos15.length} registros (litros/dia)
                                </Text>

                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 160, gap: 4 }}>
                                    {ultimos15.map((p, i) => {
                                        const altura = (p.producao_total / maxBarra) * 130;
                                        return (
                                            <View key={i} style={{ flex: 1, alignItems: "center" }}>
                                                <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 2 }}>
                                                    {p.producao_total}
                                                </Text>
                                                <View style={{
                                                    width: "70%",
                                                    height: Math.max(altura, 4),
                                                    backgroundColor: "#4a90e2",
                                                    borderTopLeftRadius: 4,
                                                    borderTopRightRadius: 4,
                                                }} />
                                                <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 4 }}>
                                                    {formatarData(p.data)}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* GRÁFICO 2 - Manhã vs Tarde (últimos 10 dias) */}
                            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 12 }}>
                                    Produção Manhã vs Tarde
                                </Text>

                                <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#f97316" }} />
                                        <Text style={{ fontSize: 11, color: "#6b7280" }}>Manhã</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#6366f1" }} />
                                        <Text style={{ fontSize: 11, color: "#6b7280" }}>Tarde</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 160, gap: 6 }}>
                                    {ultimos10.map((p, i) => {
                                        const alturaM = (p.producao_manha / maxManhaTarde) * 130;
                                        const alturaT = (p.producao_tarde / maxManhaTarde) * 130;
                                        return (
                                            <View key={i} style={{ flex: 1, alignItems: "center" }}>
                                                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 130 }}>
                                                    <View style={{
                                                        width: 10,
                                                        height: Math.max(alturaM, p.producao_manha > 0 ? 4 : 0),
                                                        backgroundColor: "#f97316",
                                                        borderTopLeftRadius: 3, borderTopRightRadius: 3,
                                                    }} />
                                                    <View style={{
                                                        width: 10,
                                                        height: Math.max(alturaT, p.producao_tarde > 0 ? 4 : 0),
                                                        backgroundColor: "#6366f1",
                                                        borderTopLeftRadius: 3, borderTopRightRadius: 3,
                                                    }} />
                                                </View>
                                                <Text style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>
                                                    {formatarData(p.data)}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* GRÁFICO 3 - Distribuição de Qualidade */}
                            {dadosQualidade.length > 0 && (
                                <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 14 }}>
                                        Distribuição de Qualidade
                                    </Text>

                                    {/* Barra horizontal "empilhada" */}
                                    <View style={{ flexDirection: "row", height: 28, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                                        {dadosQualidade.map((q, i) => (
                                            <View key={i} style={{
                                                flex: q.qtd,
                                                backgroundColor: q.cor,
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}>
                                                <Text style={{ fontSize: 11, color: "#fff", fontWeight: "600" }}>
                                                    {((q.qtd / totalQualidade) * 100).toFixed(0)}%
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Legenda detalhada */}
                                    <View style={{ gap: 8 }}>
                                        {dadosQualidade.map((q, i) => (
                                            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: q.cor }} />
                                                    <Text style={{ fontSize: 13, color: "#0a0a0a" }}>{q.label}</Text>
                                                </View>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0a0a0a" }}>
                                                    {q.qtd} {q.qtd === 1 ? "registro" : "registros"} ({((q.qtd / totalQualidade) * 100).toFixed(0)}%)
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* INSIGHTS */}
                            <View style={{
                                backgroundColor: "rgba(74,144,226,0.08)",
                                borderWidth: 1,
                                borderColor: "rgba(74,144,226,0.2)",
                                borderRadius: 14,
                                padding: 18,
                                marginBottom: insets.bottom + 20,
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <Feather name="zap" size={16} color="#4a90e2" />
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>Insights</Text>
                                </View>
                                <View style={{ gap: 8 }}>
                                    <Insight texto={`Média de produção diária: ${mediaProducao} litros`} />
                                    <Insight texto={`Variação: ${maxProducao - minProducao} litros entre máximo e mínimo`} />
                                    {dadosQualidade.length > 0 && (
                                        <Insight texto={`Qualidade predominante: ${
                                            [...dadosQualidade].sort((a, b) => b.qtd - a.qtd)[0].label
                                        }`} />
                                    )}
                                    <Insight texto={`Total de ${producoes.length} ${producoes.length === 1 ? "registro" : "registros"} analisado${producoes.length === 1 ? "" : "s"}`} />
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function Insight({ texto }: { texto: string }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <Text style={{ color: "#4a90e2", fontSize: 14, lineHeight: 20 }}>•</Text>
            <Text style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 20 }}>{texto}</Text>
        </View>
    );
}