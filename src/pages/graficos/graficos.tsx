import React, { useState, useCallback } from "react";
import {
    View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert, ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
    VictoryChart, VictoryArea, VictoryScatter, VictoryBar,
    VictoryGroup, VictoryPie, VictoryAxis, VictoryTheme,
} from "victory-native";
import { Producao } from "../../interfaces/interfaces";
import { listarProducoes } from "../../services/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40;


export default function graficos() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [producoes, setProducoes] = useState<Producao[]>([]);
    const [carregando, setCarregando] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setCarregando(true);
            listarProducoes()
                .then((dados) => {
                    // MySQL devolve DECIMAL como string — converter para número
                    const normalizados = dados.map((p: { producao_manha: any; producao_tarde: any; producao_total: any; }) => ({
                        ...p,
                        producao_manha: Number(p.producao_manha),
                        producao_tarde: Number(p.producao_tarde),
                        producao_total: Number(p.producao_total),
                    }));
                    setProducoes(normalizados);
                })
                .catch(() => Alert.alert("Erro", "Não foi possível carregar as produções"))
                .finally(() => setCarregando(false));
        }, [])
    );

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
    function formatarData(d: string) {
        if (!d) return "";
        const dataStr = d.substring(0, 10); // pega só "AAAA-MM-DD" (ignora hora se vier)
        const [ano, mes, dia] = dataStr.split("-");
        if (!ano || !mes || !dia) return "";
        return `${dia}/${mes}`;
    }

    // ── Dados linha (Evolução) ──────────────────────────────────────────────
    const dadosLinha = ultimos15.map((p, i) => ({
        x: i,
        y: p.producao_total,
        _label: formatarData(p.data),
    }));

    // Quais índices mostrar no eixo X (máximo 5 labels)
    const stepLinha = Math.max(1, Math.floor((ultimos15.length - 1) / 4));
    const ticksLinha = dadosLinha
        .filter((_, i) => i % stepLinha === 0 || i === ultimos15.length - 1)
        .map((d) => d.x);

    // ── Dados barras agrupadas (Manhã vs Tarde) ─────────────────────────────
    const dadosManha = ultimos10.map((p, i) => ({ x: i, y: p.producao_manha }));
    const dadosTarde = ultimos10.map((p, i) => ({ x: i, y: p.producao_tarde }));

    const stepBarras = Math.max(1, Math.floor((ultimos10.length - 1) / 4));
    const ticksBarras = dadosManha
        .filter((_, i) => i % stepBarras === 0 || i === ultimos10.length - 1)
        .map((d) => d.x);

    // ── Dados pizza de qualidade ────────────────────────────────────────────
    const qualidadeConfig = [
        { chave: "excellent" as const, label: "Excelente", cor: "#10b981" },
        { chave: "good" as const, label: "Boa", cor: "#3b82f6" },
        { chave: "regular" as const, label: "Regular", cor: "#eab308" },
    ];

    const dadosQualidade = qualidadeConfig
        .map((q) => ({
            ...q,
            qtd: producoes.filter((p) => p.qualidade === q.chave).length,
        }))
        .filter((q) => q.qtd > 0);

    const totalQualidade = dadosQualidade.reduce((s, q) => s + q.qtd, 0);

    const dadosPizza = dadosQualidade.map((q) => ({
        x: q.label,
        y: q.qtd,
        label: `${((q.qtd / totalQualidade) * 100).toFixed(0)}%`,
    }));
    const coresPizza = dadosQualidade.map((q) => q.cor);

    const qualidadePredominante = dadosQualidade.length > 0
        ? [...dadosQualidade].sort((a, b) => b.qtd - a.qtd)[0].label
        : null;

    // ── Estilos de eixo compartilhados ─────────────────────────────────────
    const axisStyle = {
        axis: { stroke: "#e5e7eb" },
        tickLabels: { fontSize: 9, fill: "#9ca3af", padding: 4 },
        grid: { stroke: "#f1f5f9", strokeDasharray: "4" },
    };
    const dependentAxisStyle = {
        axis: { stroke: "transparent" },
        tickLabels: { fontSize: 9, fill: "#9ca3af", padding: 4 },
        grid: { stroke: "#f1f5f9", strokeDasharray: "4" },
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* HEADER */}
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16, paddingHorizontal: 20,
                        paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
                    }}
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

                    {carregando ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <ActivityIndicator size="large" color="#4a90e2" />
                            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 12 }}>Carregando produções...</Text>
                        </View>
                    ) : producoes.length === 0 ? (
                        <View style={{
                            backgroundColor: "#fff", borderRadius: 14, padding: 40,
                            alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9",
                        }}>
                            <Feather name="bar-chart-2" size={48} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 12, textAlign: "center", lineHeight: 20 }}>
                                Nenhuma produção registrada ainda.{"\n"}Cadastre produções para ver as análises.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* ── MÉTRICAS ── */}
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <MetricCard
                                    icon="trending-up" iconColor="#16a34a"
                                    label="Média Diária" valor={`${mediaProducao}L`}
                                />
                                <MetricCard
                                    icon="calendar" iconColor="#4a90e2"
                                    label="Total Geral" valor={`${totalProducao.toLocaleString("pt-BR")}L`}
                                />
                            </View>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <MetricCard label="Máximo" valor={`${maxProducao}L`} valorColor="#16a34a" />
                                <MetricCard label="Mínimo" valor={`${minProducao}L`} valorColor="#ea580c" />
                            </View>

                            {/* ── GRÁFICO 1: Evolução da Produção ── */}
                            <View style={{
                                backgroundColor: "#fff", borderRadius: 14,
                                paddingTop: 18, paddingHorizontal: 10, paddingBottom: 8,
                                borderWidth: 1, borderColor: "#f1f5f9",
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, paddingHorizontal: 8 }}>
                                    <Feather name="trending-up" size={17} color="#4a90e2" />
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                        Evolução da Produção
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, paddingHorizontal: 8 }}>
                                    Últimos {ultimos15.length} registros — litros/dia
                                </Text>

                                <VictoryChart
                                    width={CHART_WIDTH}
                                    height={220}
                                    padding={{ top: 20, bottom: 40, left: 52, right: 16 }}
                                    theme={VictoryTheme.material}
                                >
                                    <VictoryAxis
                                        tickValues={ticksLinha}
                                        tickFormat={(t: number) => dadosLinha[t]?._label ?? ""}
                                        style={axisStyle}
                                    />
                                    <VictoryAxis
                                        dependentAxis
                                        style={dependentAxisStyle}
                                    />
                                    <VictoryArea
                                        data={dadosLinha}
                                        x="x" y="y"
                                        interpolation="monotoneX"
                                        style={{
                                            data: {
                                                fill: "rgba(74,144,226,0.15)",
                                                stroke: "#4a90e2",
                                                strokeWidth: 2.5,
                                            },
                                        }}
                                    />
                                    <VictoryScatter
                                        data={dadosLinha}
                                        x="x" y="y"
                                        size={5}
                                        style={{ data: { fill: "#4a90e2", stroke: "#fff", strokeWidth: 2 } }}
                                    />
                                </VictoryChart>

                                <View style={{
                                    flexDirection: "row", alignItems: "center",
                                    justifyContent: "center", gap: 6, marginTop: 2, marginBottom: 8,
                                }}>
                                    <View style={{ width: 20, height: 2, backgroundColor: "#4a90e2", borderRadius: 1 }} />
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#4a90e2" }} />
                                    <Text style={{ fontSize: 11, color: "#6b7280" }}>Total diário</Text>
                                </View>
                            </View>

                            {/* ── GRÁFICO 2: Manhã vs Tarde ── */}
                            <View style={{
                                backgroundColor: "#fff", borderRadius: 14,
                                paddingTop: 18, paddingHorizontal: 10, paddingBottom: 8,
                                borderWidth: 1, borderColor: "#f1f5f9",
                            }}>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 12, paddingHorizontal: 8 }}>
                                    Produção Manhã vs Tarde
                                </Text>

                                <View style={{ flexDirection: "row", gap: 16, marginBottom: 4, paddingHorizontal: 8 }}>
                                    <LegendItem cor="#f97316" label="Manhã" />
                                    <LegendItem cor="#6366f1" label="Tarde" />
                                </View>

                                <VictoryChart
                                    width={CHART_WIDTH}
                                    height={220}
                                    padding={{ top: 20, bottom: 40, left: 52, right: 16 }}
                                    domainPadding={{ x: 20 }}
                                    theme={VictoryTheme.material}
                                >
                                    <VictoryAxis
                                        tickValues={ticksBarras}
                                        tickFormat={(t: number) => formatarData(ultimos10[t]?.data ?? "")}
                                        style={axisStyle}
                                    />
                                    <VictoryAxis
                                        dependentAxis
                                        style={dependentAxisStyle}
                                    />
                                    <VictoryGroup offset={14}>
                                        <VictoryBar
                                            data={dadosManha}
                                            x="x" y="y"
                                            barWidth={12}
                                            cornerRadius={{ top: 4 }}
                                            style={{ data: { fill: "#f97316" } }}
                                        />
                                        <VictoryBar
                                            data={dadosTarde}
                                            x="x" y="y"
                                            barWidth={12}
                                            cornerRadius={{ top: 4 }}
                                            style={{ data: { fill: "#6366f1" } }}
                                        />
                                    </VictoryGroup>
                                </VictoryChart>
                            </View>

                            {/* ── GRÁFICO 3: Distribuição de Qualidade ── */}
                            {dadosPizza.length > 0 && (
                                <View style={{
                                    backgroundColor: "#fff", borderRadius: 14, padding: 18,
                                    borderWidth: 1, borderColor: "#f1f5f9",
                                }}>
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 16 }}>
                                        Distribuição de Qualidade
                                    </Text>

                                    <View style={{ alignItems: "center" }}>
                                        <VictoryPie
                                            data={dadosPizza}
                                            x="x" y="y"
                                            colorScale={coresPizza}
                                            width={220}
                                            height={220}
                                            innerRadius={0}
                                            padding={24}
                                            labels={({ datum }: any) =>
                                                `${((datum.y / totalQualidade) * 100).toFixed(0)}%`
                                            }
                                            style={{
                                                labels: {
                                                    fill: "#fff",
                                                    fontSize: 13,
                                                    fontWeight: "700",
                                                },
                                            }}
                                        />
                                    </View>

                                    <View style={{ gap: 8, marginTop: 8 }}>
                                        {dadosQualidade.map((q, i) => (
                                            <View key={i} style={{
                                                flexDirection: "row", justifyContent: "space-between",
                                                alignItems: "center", paddingVertical: 8,
                                                paddingHorizontal: 12, backgroundColor: "#f9fafb",
                                                borderRadius: 10,
                                            }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                    <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: q.cor }} />
                                                    <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500" }}>
                                                        {q.label}
                                                    </Text>
                                                </View>
                                                <Text style={{ fontSize: 13, fontWeight: "700", color: q.cor }}>
                                                    {((q.qtd / totalQualidade) * 100).toFixed(0)}%
                                                    <Text style={{ fontWeight: "400", color: "#9ca3af", fontSize: 12 }}>
                                                        {" "}({q.qtd} {q.qtd === 1 ? "reg." : "regs."})
                                                    </Text>
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ── INSIGHTS ── */}
                            <View style={{
                                backgroundColor: "rgba(74,144,226,0.08)",
                                borderWidth: 1, borderColor: "rgba(74,144,226,0.2)",
                                borderRadius: 14, padding: 18,
                                marginBottom: insets.bottom + 20,
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <Feather name="zap" size={16} color="#4a90e2" />
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>Insightss</Text>
                                </View>
                                <View style={{ gap: 8 }}>
                                    <Insight texto={`Média de produção diária: ${mediaProducao} litros`} />
                                    <Insight texto={`Variação: ${maxProducao - minProducao} litros entre máximo e mínimo`} />
                                    {qualidadePredominante && (
                                        <Insight texto={`Qualidade predominante: ${qualidadePredominante}`} />
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

// ── Componentes auxiliares ───────────────────────────────────────────────────

function MetricCard({
    icon, iconColor, label, valor, valorColor,
}: {
    icon?: React.ComponentProps<typeof Feather>["name"];
    iconColor?: string;
    label: string;
    valor: string;
    valorColor?: string;
}) {
    return (
        <View style={{
            flex: 1, backgroundColor: "#fff", borderRadius: 14,
            padding: 14, borderWidth: 1, borderColor: "#f1f5f9",
        }}>
            {icon ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Feather name={icon} size={14} color={iconColor ?? "#4a90e2"} />
                    <Text style={{ fontSize: 11, color: "#6b7280" }}>{label}</Text>
                </View>
            ) : (
                <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{label}</Text>
            )}
            <Text style={{ fontSize: 22, fontWeight: "700", color: valorColor ?? "#0a0a0a" }}>
                {valor}
            </Text>
        </View>
    );
}

function LegendItem({ cor, label }: { cor: string; label: string }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: cor }} />
            <Text style={{ fontSize: 12, color: "#6b7280" }}>{label}</Text>
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
