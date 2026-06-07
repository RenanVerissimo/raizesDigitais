import React, { useState, useCallback } from "react";
import {
    View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert, ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
    VictoryChart, VictoryArea, VictoryScatter, VictoryPie, VictoryBar,
    VictoryAxis, VictoryTheme, VictoryLabel,
} from "victory-native";
import { Producao } from "../../interfaces/interfaces";
import { listarMovimentacoesRacao, listarProducoes } from "../../services/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CARD_CHART_WIDTH = CHART_WIDTH - 20;

type MovimentacaoRacaoGrafico = {
    id: number;
    tipo: "entrada" | "saida" | "ajuste";
    quantidade: number | string;
    data: string;
};

export default function Graficos() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [producoes, setProducoes] = useState<Producao[]>([]);
    const [movimentacoesRacao, setMovimentacoesRacao] = useState<MovimentacaoRacaoGrafico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [insightsAberto, setInsightsAberto] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setCarregando(true);
            Promise.all([listarProducoes(), listarMovimentacoesRacao()])
                .then(([dados, movsRacao]) => {
                    // MySQL devolve DECIMAL como string — converter para número
                    const normalizados = dados.map((p: { producao_diaria: any; }) => ({
                        ...p,
                        producao_diaria: Number(p.producao_diaria),
                    }));
                    setProducoes(normalizados);
                    setMovimentacoesRacao(movsRacao);
                })
                .catch(() => Alert.alert("Erro", "Não foi possível carregar os dados dos gráficos"))
                .finally(() => setCarregando(false));
        }, [])
    );

    const ordenadas = [...producoes].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    const ultimos15 = ordenadas.slice(-15);

    const mediaProducao = producoes.length > 0
        ? Math.round(producoes.reduce((s, p) => s + Number(p.producao_diaria), 0) / producoes.length)
        : 0;
    const totalProducao = producoes.reduce((s, p) => s + Number(p.producao_diaria), 0);
    const maxProducao = producoes.length ? Math.max(...producoes.map((p) => Number(p.producao_diaria))) : 0;
    const minProducao = producoes.length ? Math.min(...producoes.map((p) => Number(p.producao_diaria))) : 0;
    function formatarData(d: string) {
        if (!d) return "";
        const dataStr = d.substring(0, 10); // pega só "AAAA-MM-DD" (ignora hora se vier)
        const [ano, mes, dia] = dataStr.split("-");
        if (!ano || !mes || !dia) return "";
        return `${dia}/${mes}`;
    }

    function obterDataRegistro(d: string) {
        if (!d) return null;
        const data = new Date(`${d.substring(0, 10)}T00:00:00`);
        return Number.isNaN(data.getTime()) ? null : data;
    }

    // ── Dados linha (Evolução) ──────────────────────────────────────────────
    const dadosLinha = ultimos15.map((p, i) => ({
        x: i,
        y: Number(p.producao_diaria),
        _label: formatarData(p.data),
    }));

    // Quais índices mostrar no eixo X (máximo 5 labels)
    const stepLinha = Math.max(1, Math.floor((ultimos15.length - 1) / 4));
    const ticksLinha = dadosLinha
        .filter((_, i) => i % stepLinha === 0 || i === ultimos15.length - 1)
        .map((d) => d.x);

    const dataFinal30Dias = ordenadas.length ? obterDataRegistro(ordenadas[ordenadas.length - 1].data) : null;
    const dataInicial30Dias = dataFinal30Dias ? new Date(dataFinal30Dias) : null;
    dataInicial30Dias?.setDate(dataInicial30Dias.getDate() - 29);

    const producoesUltimos30Dias = dataInicial30Dias && dataFinal30Dias
        ? ordenadas.filter((p) => {
            const data = obterDataRegistro(p.data);
            return data && data >= dataInicial30Dias && data <= dataFinal30Dias;
        })
        : [];
    const mediaUltimos30Dias = producoesUltimos30Dias.length > 0
        ? Math.round(
            producoesUltimos30Dias.reduce((s, p) => s + Number(p.producao_diaria), 0) / producoesUltimos30Dias.length
        )
        : 0;
    const diasAcimaMedia30Dias = producoesUltimos30Dias.filter(
        (p) => Number(p.producao_diaria) >= mediaUltimos30Dias
    ).length;
    const diasAbaixoMedia30Dias = producoesUltimos30Dias.filter(
        (p) => Number(p.producao_diaria) < mediaUltimos30Dias
    ).length;
    const totalDiasComparados = producoesUltimos30Dias.length;
    const percentualAcimaMedia = totalDiasComparados > 0
        ? Math.round((diasAcimaMedia30Dias / totalDiasComparados) * 100)
        : 0;
    const percentualAbaixoMedia = totalDiasComparados > 0
        ? Math.round((diasAbaixoMedia30Dias / totalDiasComparados) * 100)
        : 0;
    const dadosPizzaEstabilidade = [
        {
            x: "Acima ou igual",
            y: diasAcimaMedia30Dias,
            percentual: percentualAcimaMedia,
            cor: "#16a34a",
        },
        {
            x: "Abaixo",
            y: diasAbaixoMedia30Dias,
            percentual: percentualAbaixoMedia,
            cor: "#ea580c",
        },
    ];

    const saidasRacao = movimentacoesRacao
        .filter((m) => m.tipo === "saida")
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const racaoPorDia = new Map<string, number>();
    saidasRacao.forEach((m) => {
        const data = m.data?.substring(0, 10);
        if (!data) return;
        racaoPorDia.set(data, (racaoPorDia.get(data) || 0) + Number(m.quantidade));
    });
    const dadosRacaoDia = Array.from(racaoPorDia.entries())
        .sort(([dataA], [dataB]) => new Date(dataA).getTime() - new Date(dataB).getTime())
        .slice(-10)
        .map(([data, quantidade], i) => ({
            x: i,
            y: quantidade,
            _label: formatarData(data),
        }));
    const ticksRacaoDia = dadosRacaoDia
        .filter((_, i) => i % Math.max(1, Math.floor((dadosRacaoDia.length - 1) / 4)) === 0 || i === dadosRacaoDia.length - 1)
        .map((d) => d.x);
    const totalRacaoGrafico = dadosRacaoDia.reduce((s, d) => s + d.y, 0);

    function formatarKg(valor: number) {
        return valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    }

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
                        <>
                        <View style={{
                            backgroundColor: "#fff", borderRadius: 14, padding: 40,
                            alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9",
                        }}>
                            <Feather name="bar-chart-2" size={48} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 12, textAlign: "center", lineHeight: 20 }}>
                                Nenhuma produção registrada ainda.{"\n"}Cadastre produções para ver as análises.
                            </Text>
                        </View>
                        </>
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
                                    width={CARD_CHART_WIDTH}
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

                            {/* ── GRÁFICO 2: Dias acima e abaixo da média ── */}
                            <View style={{
                                backgroundColor: "#fff", borderRadius: 14,
                                paddingTop: 18, paddingHorizontal: 10, paddingBottom: 4,
                                borderWidth: 1, borderColor: "#f1f5f9",
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 2, paddingHorizontal: 8 }}>
                                    <Feather name="bar-chart-2" size={17} color="#16a34a" />
                                    <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#0a0a0a", lineHeight: 20 }}>
                                        Dias Acima e Abaixo da Média
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 11, color: "#9ca3af", lineHeight: 16, marginBottom: 4, paddingHorizontal: 8 }}>
                                    {producoesUltimos30Dias.length} registro{producoesUltimos30Dias.length === 1 ? "" : "s"} nos últimos 30 dias. Média: {mediaUltimos30Dias} litros
                                </Text>

                                <View style={{ alignItems: "center", marginTop: 8 }}>
                                    <VictoryPie
                                        data={dadosPizzaEstabilidade}
                                        width={CARD_CHART_WIDTH}
                                        height={220}
                                        padding={{ top: 18, bottom: 18, left: 48, right: 48 }}
                                        colorScale={dadosPizzaEstabilidade.map((d) => d.cor)}
                                        labels={({ datum }) => `${datum.y} dia${datum.y === 1 ? "" : "s"}\n(${datum.percentual}%)`}
                                        labelRadius={48}
                                        style={{
                                            data: { stroke: "#fff", strokeWidth: 3 },
                                            labels: { fill: "#fff", fontSize: 10, fontWeight: "700" },
                                        }}
                                    />
                                </View>

                                <View style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    flexWrap: "wrap",
                                    gap: 12,
                                    paddingHorizontal: 8,
                                    paddingBottom: 10,
                                }}>
                                    <LegendaPizza
                                        cor="#16a34a"
                                        label="Acima ou igual"
                                        valor={diasAcimaMedia30Dias}
                                        percentual={percentualAcimaMedia}
                                    />
                                    <LegendaPizza
                                        cor="#ea580c"
                                        label="Abaixo da média"
                                        valor={diasAbaixoMedia30Dias}
                                        percentual={percentualAbaixoMedia}
                                    />
                                </View>
                            </View>

                            {/* ── GRÁFICO 3: Ração gasta por dia ── */}
                            <View style={{
                                backgroundColor: "#fff", borderRadius: 14,
                                paddingTop: 18, paddingHorizontal: 10, paddingBottom: 8,
                                borderWidth: 1, borderColor: "#f1f5f9",
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, paddingHorizontal: 8 }}>
                                    <Feather name="package" size={17} color="#a16207" />
                                    <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#0a0a0a", lineHeight: 20 }}>
                                        Ração Gasta por Dia
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 11, color: "#9ca3af", lineHeight: 16, marginBottom: 4, paddingHorizontal: 8 }}>
                                    Soma diária de todos os tipos de ração — total de {totalRacaoGrafico.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg
                                </Text>

                                {dadosRacaoDia.length === 0 ? (
                                    <View style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 12 }}>
                                        <Feather name="archive" size={34} color="#d1d5db" />
                                        <Text style={{ marginTop: 10, fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 18 }}>
                                            Nenhuma saída de ração registrada ainda.
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <VictoryChart
                                            width={CARD_CHART_WIDTH}
                                            height={170}
                                            padding={{ top: 32, bottom: 30, left: 34, right: 12 }}
                                            domainPadding={{ x: 18 }}
                                            theme={VictoryTheme.material}
                                        >
                                            <VictoryAxis
                                                tickValues={ticksRacaoDia}
                                                tickFormat={(t: number) => dadosRacaoDia[t]?._label ?? ""}
                                                style={axisStyle}
                                            />
                                            <VictoryAxis
                                                dependentAxis
                                                tickFormat={() => ""}
                                                style={{
                                                    ...dependentAxisStyle,
                                                    axis: { stroke: "transparent" },
                                                    tickLabels: { fill: "transparent" },
                                                }}
                                            />
                                            <VictoryBar
                                                data={dadosRacaoDia}
                                                x="x" y="y"
                                                barWidth={16}
                                                cornerRadius={{ top: 5 }}
                                                labels={({ datum }) => `${formatarKg(Number(datum.y))} kg`}
                                                style={{
                                                    data: { fill: "#a16207" },
                                                    labels: { fill: "#6b7280", fontSize: 9, fontWeight: "700" },
                                                }}
                                                labelComponent={
                                                    <VictoryLabel dy={-6} />
                                                }
                                            />
                                        </VictoryChart>
                                    </>
                                )}
                            </View>

                            {/* ── INSIGHTS ── */}
                            <View style={{
                                backgroundColor: "rgba(74,144,226,0.08)",
                                borderWidth: 1, borderColor: "rgba(74,144,226,0.2)",
                                borderRadius: 14, padding: 18,
                                marginBottom: insets.bottom + 20,
                            }}>
                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={() => setInsightsAberto((aberto) => !aberto)}
                                    accessibilityRole="button"
                                    accessibilityLabel={insightsAberto ? "Fechar insights" : "Abrir insights"}
                                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Feather name="zap" size={16} color="#4a90e2" />
                                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>Insights</Text>
                                    </View>
                                    <Feather name={insightsAberto ? "chevron-up" : "chevron-down"} size={20} color="#4a90e2" />
                                </TouchableOpacity>
                                {insightsAberto && (
                                    <View style={{ gap: 8, marginTop: 12 }}>
                                    <Insight texto={`Média de produção diária: ${mediaProducao} litros`} />
                                    <Insight texto={`Variação: ${maxProducao - minProducao} litros entre máximo e mínimo`} />
                                    <Insight texto={`Total de ${producoes.length} ${producoes.length === 1 ? "registro" : "registros"} analisado${producoes.length === 1 ? "" : "s"}`} />
                                    </View>
                                )}
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

function LegendaPizza({
    cor, label, valor, percentual,
}: {
    cor: string;
    label: string;
    valor: number;
    percentual: number;
}) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cor }} />
            <Text style={{ fontSize: 11, color: "#6b7280" }}>
                {label}: {valor} dia{valor === 1 ? "" : "s"} ({percentual}%)
            </Text>
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
