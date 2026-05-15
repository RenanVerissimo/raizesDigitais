import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { excluirTanque, listarMovimentacoes, listarTanques } from "../../services/api";
import Toast from "react-native-toast-message";

export type Qualidade = "excelente" | "boa" | "regular";
export type TipoMovimento = "entrada" | "saida";

export interface Tanque {
    id: number;
    nome: string;
    capacidade: number;
    volumeAtual: number;
    temperatura: number;
    qualidade: Qualidade;
    localizacao?: string;
    observacoes?: string;
    atualizadoEm: string;
}

export interface Movimentacao {
    id: number;
    tanqueId: number;
    tanqueNome: string;
    tipo: TipoMovimento;
    volume: number;
    data: string;
    motivo: string;
    comprador?: string;
    temperatura?: number | null;
    consumoProprio?: number;
    observacoes?: string;
}

const QUALIDADE_CFG: Record<Qualidade, { label: string; bg: string; text: string }> = {
    excelente: { label: "Excelente", bg: "#dcfce7", text: "#15803d" },
    boa: { label: "Boa", bg: "#dbeafe", text: "#1d4ed8" },
    regular: { label: "Regular", bg: "#fef9c3", text: "#a16207" },
};

function corOcupacao(p: number) {
    if (p > 90) return "#ef4444";
    if (p > 70) return "#f97316";
    if (p > 50) return "#eab308";
    return "#22c55e";
}

export default function Estoque() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [tanques, setTanques] = useState<Tanque[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [dicasAberto, setDicasAberto] = useState(true);

    async function carregarDados() {
        try {
            const [tanquesDados, movsDados] = await Promise.all([
                listarTanques(),
                listarMovimentacoes(),
            ]);
            setTanques(tanquesDados);
            setMovimentacoes(movsDados);
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar",
                text2: err.message || "Não foi possível carregar os dados.",
                position: "top",
                visibilityTime: 3000,
            });
        }
    }

    useFocusEffect(
        useCallback(() => {
            carregarDados();
        }, [])
    );

    const capacidadeTotal = tanques.reduce((s, t) => s + t.capacidade, 0);
    const volumeTotal = tanques.reduce((s, t) => s + t.volumeAtual, 0);
    const ocupacao = capacidadeTotal > 0 ? (volumeTotal / capacidadeTotal) * 100 : 0;
    const tanquesCriticos = tanques.filter((t) => t.volumeAtual / t.capacidade > 0.9);
    const problemasTemperatura = tanques.filter((t) => t.temperatura > 4);

    function handleExcluir(t: Tanque) {
        Alert.alert("Excluir tanque", `Excluir "${t.nome}"?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        await excluirTanque(t.id);
                        setTanques((prev) => prev.filter((x) => x.id !== t.id));
                        Toast.show({
                            type: "success",
                            text1: "Tanque excluído",
                            text2: `${t.nome} foi removido com sucesso.`,
                            position: "top",
                            visibilityTime: 3000,
                        });
                    } catch (err: any) {
                        Toast.show({
                            type: "error",
                            text1: "Erro ao excluir",
                            text2: err.message || "Não foi possível excluir o tanque.",
                            position: "top",
                            visibilityTime: 3000,
                        });
                    }
                },
            },
        ]);
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
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Estoque de Leite</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {tanques.length} {tanques.length === 1 ? "tanque" : "tanques"}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate("cadastar_tanque")}
                            style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                            <Feather name="plus" size={18} color="#fff" />
                            <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Novo Tanque</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate("registrar_movimentacao", { tanques })}
                            style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                            <Feather name="trending-up" size={18} color="#fff" />
                            <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Movimentação</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    {tanquesCriticos.length > 0 && (
                        <View style={{ backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 14, padding: 14, flexDirection: "row", gap: 10 }}>
                            <Feather name="alert-triangle" size={20} color="#ea580c" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a", marginBottom: 2 }}>Tanque(s) quase cheio(s)!</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                    {tanquesCriticos.length} {tanquesCriticos.length === 1 ? "tanque está" : "tanques estão"} acima de 90% da capacidade
                                </Text>
                            </View>
                        </View>
                    )}

                    {problemasTemperatura.length > 0 && (
                        <View style={{ backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 14, padding: 14, flexDirection: "row", gap: 10 }}>
                            <Feather name="thermometer" size={20} color="#dc2626" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a", marginBottom: 2 }}>Alerta de Temperatura!</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                    {problemasTemperatura.length} {problemasTemperatura.length === 1 ? "tanque está" : "tanques estão"} acima de 4°C
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a", marginBottom: 14 }}>Resumo Geral</Text>
                        <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#eff6ff", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Volume Total Armazenado</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#4a90e2" }}>{volumeTotal.toFixed(1)} L</Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#eef2ff", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Capacidade Total</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#4f46e5" }}>{capacidadeTotal.toFixed(1)} L</Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#f0fdf4", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Espaço Disponível</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#16a34a" }}>{(capacidadeTotal - volumeTotal).toFixed(1)} L</Text>
                            </View>
                        </View>
                        <View style={{ marginTop: 14 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Taxa de Ocupação</Text>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: corOcupacao(ocupacao) }}>{ocupacao.toFixed(1)}%</Text>
                            </View>
                            <View style={{ width: "100%", height: 12, backgroundColor: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                                <View style={{ width: `${Math.min(ocupacao, 100)}%`, height: "100%", backgroundColor: corOcupacao(ocupacao) }} />
                            </View>
                        </View>
                    </View>

                    <View style={{ gap: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>Tanques de Armazenamento</Text>

                        {tanques.length === 0 ? (
                            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                                <Feather name="droplet" size={48} color="#d1d5db" />
                                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>Nenhum tanque cadastrado</Text>
                            </View>
                        ) : (
                            tanques.map((tank) => {
                                const fill = (tank.volumeAtual / tank.capacidade) * 100;
                                const critico = fill > 90;
                                const tempRuim = tank.temperatura > 4;
                                const qcfg = QUALIDADE_CFG[tank.qualidade];
                                return (
                                    <View key={tank.id} style={{ backgroundColor: critico || tempRuim ? "#fff7ed" : "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: critico || tempRuim ? "#fed7aa" : "#f1f5f9" }}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                                    <Feather name="droplet" size={18} color="#4a90e2" />
                                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>{tank.nome}</Text>
                                                    {critico && <Feather name="alert-triangle" size={14} color="#ea580c" />}
                                                    {tempRuim && <Feather name="thermometer" size={14} color="#dc2626" />}
                                                </View>
                                                {tank.localizacao && (
                                                    <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>📍 {tank.localizacao}</Text>
                                                )}
                                                <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                                                    Atualizado: {new Date(tank.atualizadoEm).toLocaleString("pt-BR")}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row", gap: 6 }}>
                                                <TouchableOpacity
                                                    onPress={() => navigation.navigate("cadastar_tanque", { tanque: tank })}
                                                    activeOpacity={0.7}
                                                    style={{ width: 32, height: 32, backgroundColor: "#f59e0b", borderRadius: 8, alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Feather name="edit-2" size={16} color="#fff" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleExcluir(tank)}
                                                    activeOpacity={0.7}
                                                    style={{ width: 32, height: 32, backgroundColor: "#ef4444", borderRadius: 8, alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Feather name="trash-2" size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
                                            <View style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, padding: 8 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280" }}>Volume</Text>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0a0a0a", marginTop: 2 }}>{tank.volumeAtual.toFixed(1)} L</Text>
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, padding: 8 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280" }}>Capacidade</Text>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0a0a0a", marginTop: 2 }}>{tank.capacidade.toFixed(1)} L</Text>
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: tempRuim ? "#fef2f2" : "#eff6ff", borderRadius: 8, padding: 8 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280" }}>Temp.</Text>
                                                <Text style={{ fontSize: 13, fontWeight: "700", color: tempRuim ? "#dc2626" : "#4a90e2", marginTop: 2 }}>{tank.temperatura.toFixed(1)}°C</Text>
                                            </View>
                                        </View>

                                        <View style={{ marginBottom: 8 }}>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Nível de Preenchimento</Text>
                                                <Text style={{ fontSize: 11, fontWeight: "600", color: corOcupacao(fill) }}>{fill.toFixed(1)}%</Text>
                                            </View>
                                            <View style={{ width: "100%", height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                                                <View style={{ width: `${Math.min(fill, 100)}%`, height: "100%", backgroundColor: corOcupacao(fill) }} />
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: "row" }}>
                                            <View style={{ backgroundColor: qcfg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                <Text style={{ fontSize: 11, fontWeight: "500", color: qcfg.text }}>Qualidade: {qcfg.label}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>Movimentações Recentes</Text>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => navigation.navigate("todas_movimentacoes")}
                                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5 }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: "700", color: "#4a90e2" }}>Ver todas</Text>
                                <Feather name="chevron-right" size={15} color="#4a90e2" />
                            </TouchableOpacity>
                        </View>
                        {movimentacoes.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", paddingVertical: 16 }}>
                                Nenhuma movimentação registrada
                            </Text>
                        ) : (
                            <View style={{ gap: 8 }}>
                                {movimentacoes.slice(0, 10).map((m) => (
                                    <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, backgroundColor: "#f9fafb", borderRadius: 10 }}>
                                        <View style={{ padding: 8, borderRadius: 8, backgroundColor: m.tipo === "entrada" ? "#dcfce7" : "#fee2e2" }}>
                                            <Feather name={m.tipo === "entrada" ? "trending-up" : "trending-down"} size={14} color={m.tipo === "entrada" ? "#16a34a" : "#dc2626"} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>{m.tanqueNome}</Text>
                                                <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: m.tipo === "entrada" ? "#dcfce7" : "#fee2e2" }}>
                                                    <Text style={{ fontSize: 9, fontWeight: "600", color: m.tipo === "entrada" ? "#15803d" : "#b91c1c" }}>
                                                        {m.tipo === "entrada" ? "Entrada" : "Saída"}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{m.motivo}</Text>
                                            {m.comprador && <Text style={{ fontSize: 10, color: "#9ca3af" }}>Comprador: {m.comprador}</Text>}
                                            {Number(m.consumoProprio || 0) > 0 && (
                                                <View style={{ alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                    <Feather name="home" size={12} color="#ea580c" />
                                                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#9a3412" }}>
                                                        Consumo próprio
                                                    </Text>
                                                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#ea580c" }}>
                                                        {Number(m.consumoProprio).toFixed(1)} L
                                                    </Text>
                                                </View>
                                            )}
                                            <Text style={{ fontSize: 10, color: "#9ca3af" }}>
                                                {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text style={{ fontSize: 13, fontWeight: "700", color: m.tipo === "entrada" ? "#16a34a" : "#dc2626" }}>
                                                {m.tipo === "entrada" ? "+" : "-"}{m.tipo === "entrada" ? m.volume : m.volume + Number(m.consumoProprio || 0)} L
                                            </Text>
                                            {Number(m.consumoProprio || 0) > 0 && (
                                                <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Total saída</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ backgroundColor: "rgba(74,144,226,0.08)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(74,144,226,0.2)", marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => setDicasAberto((aberto) => !aberto)}
                            accessibilityRole="button"
                            accessibilityLabel={dicasAberto ? "Fechar dicas" : "Abrir dicas"}
                            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="info" size={16} color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>Dicas</Text>
                            </View>
                            <Feather name={dicasAberto ? "chevron-up" : "chevron-down"} size={20} color="#4a90e2" />
                        </TouchableOpacity>
                        {dicasAberto && (
                            <View style={{ marginTop: 10 }}>
                                {[
                                    "Mantenha a temperatura do leite entre 2°C e 4°C",
                                    "Leite resfriado pode ser armazenado por até 48 horas",
                                    "Programe entregas quando tanques atingirem 80% da capacidade",
                                ].map((dica, i) => (
                                    <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                                        <Text style={{ color: "#4a90e2" }}>•</Text>
                                        <Text style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 }}>{dica}</Text>
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
