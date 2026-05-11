import React, { useCallback, useState } from "react";
import { Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { excluirMovimentacao, listarMovimentacoes } from "../../services/api";
import { Movimentacao } from "./estoque";

export default function TodasMovimentacoes() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [modalExcluirVisible, setModalExcluirVisible] = useState(false);
    const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState<Movimentacao | null>(null);

    async function carregarDados() {
        try {
            const movsDados = await listarMovimentacoes();
            setMovimentacoes(movsDados);
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar",
                text2: err.message || "Não foi possível carregar as movimentações.",
                position: "top",
            });
        }
    }

    useFocusEffect(
        useCallback(() => {
            carregarDados();
        }, [])
    );

    function abrirModalExclusao(mov: Movimentacao) {
        setMovimentacaoSelecionada(mov);
        setModalExcluirVisible(true);
    }

    async function confirmarExclusao() {
        if (!movimentacaoSelecionada) return;

        try {
            await excluirMovimentacao(movimentacaoSelecionada.id);
            setMovimentacoes((prev) => prev.filter((item) => item.id !== movimentacaoSelecionada.id));
            setModalExcluirVisible(false);
            setMovimentacaoSelecionada(null);
            await carregarDados();
            Toast.show({ type: "success", text1: "Movimentação excluída", position: "top" });
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: err.message || "Não foi possível excluir.",
                position: "top",
            });
        }
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Todas Movimentações</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Histórico completo do estoque de leite
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 10, paddingBottom: insets.bottom + 24 }}>
                    {movimentacoes.length === 0 ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Feather name="repeat" size={42} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>Nenhuma movimentação registrada</Text>
                        </View>
                    ) : (
                        movimentacoes.map((m) => {
                            const consumo = Number(m.consumoProprio || 0);
                            const totalSaida = m.volume + consumo;

                            return (
                                <View key={m.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                                        <View style={{ padding: 9, borderRadius: 10, backgroundColor: m.tipo === "entrada" ? "#dcfce7" : "#fee2e2" }}>
                                            <Feather
                                                name={m.tipo === "entrada" ? "trending-up" : "trending-down"}
                                                size={16}
                                                color={m.tipo === "entrada" ? "#16a34a" : "#dc2626"}
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a0a0a" }}>{m.tanqueNome}</Text>
                                                <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: m.tipo === "entrada" ? "#dcfce7" : "#fee2e2" }}>
                                                    <Text style={{ fontSize: 10, fontWeight: "700", color: m.tipo === "entrada" ? "#15803d" : "#b91c1c" }}>
                                                        {m.tipo === "entrada" ? "Entrada" : "Saída"}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{m.motivo}</Text>
                                            {m.comprador && <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Comprador: {m.comprador}</Text>}
                                            {consumo > 0 && (
                                                <View style={{ alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                    <Feather name="home" size={12} color="#ea580c" />
                                                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#9a3412" }}>Consumo próprio</Text>
                                                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#ea580c" }}>{consumo.toFixed(1)} L</Text>
                                                </View>
                                            )}
                                            <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
                                                {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")} às {m.hora}
                                            </Text>
                                        </View>

                                        <View style={{ alignItems: "flex-end", gap: 8 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "800", color: m.tipo === "entrada" ? "#16a34a" : "#dc2626" }}>
                                                {m.tipo === "entrada" ? "+" : "-"}{m.tipo === "entrada" ? m.volume.toFixed(1) : totalSaida.toFixed(1)} L
                                            </Text>
                                            <View style={{ flexDirection: "row", gap: 6 }}>
                                                <TouchableOpacity
                                                    onPress={() => navigation.navigate("editar_movimentacao", { movimentacao: m })}
                                                    style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Feather name="edit-2" size={15} color="#fff" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => abrirModalExclusao(m)}
                                                    style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Feather name="trash-2" size={15} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
            <Modal
                visible={modalExcluirVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalExcluirVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <View style={{ width: "100%", maxWidth: 360, backgroundColor: "#fff", borderRadius: 18, padding: 20 }}>
                        <View style={{ alignItems: "center", marginBottom: 14 }}>
                            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fecaca" }}>
                                <Feather name="trash-2" size={25} color="#ef4444" />
                            </View>
                        </View>
                        <Text style={{ fontSize: 19, fontWeight: "800", color: "#0a0a0a", textAlign: "center" }}>Excluir movimentação?</Text>
                        <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19, marginTop: 8, marginBottom: 18 }}>
                            Esta ação remove a movimentação de {movimentacaoSelecionada?.tanqueNome || "estoque"} e ajusta o volume do tanque.
                        </Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalExcluirVisible(false);
                                    setMovimentacaoSelecionada(null);
                                }}
                                activeOpacity={0.75}
                                style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmarExclusao}
                                activeOpacity={0.8}
                                style={{ flex: 1, backgroundColor: "#ef4444", borderRadius: 12, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                            >
                                <Feather name="trash-2" size={16} color="#fff" />
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Excluir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
