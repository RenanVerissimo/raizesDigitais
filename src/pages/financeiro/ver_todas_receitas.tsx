import React, { useCallback, useState } from "react";
import { Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { excluirReceita, listarReceitas } from "../../services/api";
import type { Receita } from "./financeiro";
import Toast from "react-native-toast-message";


export default function VerTodasReceitas() {
    const PERIODOS = ["Hoje", "7D", "Mês", "Mês ant.", "Ano", "Tudo"] as const;
    type PeriodoReceita = typeof PERIODOS[number];


    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [periodo, setPeriodo] = useState<PeriodoReceita>("Mês"); const [modalExcluirVisible, setModalExcluirVisible] = useState(false);
    const [receitaSelecionada, setReceitaSelecionada] = useState<Receita | null>(null);

    async function carregarReceitas() {
        try {
            const dados = await listarReceitas();
            setReceitas(dados);
        } catch (error: any) {
            Toast.show({ type: "error", text1: "Erro", text2: error.message || "Não foi possível carregar as receitas.", position: "top", visibilityTime: 3000 });
        }
    }

    useFocusEffect(
        useCallback(() => {
            carregarReceitas();
        }, [])
    );

    function dataDentroDoPeriodo(dataTexto: string) {
        if (periodo === "Tudo") return true;

        const hoje = new Date();
        const data = new Date(dataTexto + "T12:00:00");

        if (periodo === "Hoje") {
            return data.toDateString() === hoje.toDateString();
        }

        if (periodo === "7D") {
            const inicio = new Date(hoje);
            inicio.setDate(hoje.getDate() - 6);
            inicio.setHours(0, 0, 0, 0);
            return data >= inicio;
        }

        if (periodo === "Mês") {
            return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
        }

        if (periodo === "Mês ant.") {
            const mesAnterior = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
            const anoMesAnterior = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
            return data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior;
        }

        if (periodo === "Ano") {
            return data.getFullYear() === hoje.getFullYear();
        }

        return true;
    }
    const receitasFiltradas = receitas.filter((receita) => dataDentroDoPeriodo(receita.data));
    const totalFiltrado = receitasFiltradas.reduce((s, receita) => s + receita.valorTotal, 0);

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
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Todas as Receitas</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {receitasFiltradas.length} {receitasFiltradas.length === 1 ? "registro" : "registros"}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 20 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Receitas no período</Text>
                        <Text style={{ fontSize: 28, fontWeight: "700", color: "#16a34a" }}>
                            R$ {totalFiltrado.toFixed(2)}
                        </Text>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a", marginBottom: 10 }}>
                            Filtrar por período
                        </Text>
                        <View style={{
                            flexDirection: "row",
                            backgroundColor: "#f3f4f6",
                            borderRadius: 10,
                            padding: 3,
                        }}>
                            {PERIODOS.map((p) => {
                                const ativo = periodo === p;
                                return (
                                    <TouchableOpacity
                                        key={p}
                                        onPress={() => setPeriodo(p)}
                                        activeOpacity={0.75}
                                        style={{
                                            flex: 1,
                                            backgroundColor: ativo ? "#fff" : "transparent",
                                            paddingVertical: 7,
                                            borderRadius: 8,
                                            alignItems: "center",
                                            shadowColor: ativo ? "#000" : "transparent",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: ativo ? 0.08 : 0,
                                            shadowRadius: 2,
                                            elevation: ativo ? 2 : 0,
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: ativo ? "700" : "500",
                                            color: ativo ? "#4a90e2" : "#9ca3af",
                                        }}>
                                            {p}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {receitasFiltradas.length === 0 ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Feather name="dollar-sign" size={48} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>
                                Nenhuma receita encontrada
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {receitasFiltradas.map((receita) => (
                                <View key={receita.id} style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }} numberOfLines={1}>
                                                {receita.comprador}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                {new Date(receita.data + "T12:00:00").toLocaleDateString("pt-BR")}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: "row", gap: 6 }}>
                                            <TouchableOpacity
                                                onPress={() => navigation.navigate("editar_receita", { receita })}
                                                activeOpacity={0.7}
                                                style={{ width: 32, height: 32, backgroundColor: "#f59e0b", borderRadius: 8, alignItems: "center", justifyContent: "center" }}
                                            >
                                                <Feather name="edit-2" size={16} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleExcluir(receita)}
                                                activeOpacity={0.7}
                                                style={{ width: 32, height: 32, backgroundColor: "#ef4444", borderRadius: 8, alignItems: "center", justifyContent: "center" }}
                                            >
                                                <Feather name="trash-2" size={16} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                            {receita.tipoReceita === "animal"
                                                ? `Venda de animal${receita.animalNome ? `: ${receita.animalNome}` : ""}`
                                                : `${receita.litros}L x R$ ${receita.precoPorLitro.toFixed(2)}`}
                                        </Text>
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
                                            R$ {receita.valorTotal.toFixed(2)}
                                        </Text>
                                    </View>
                                    {receita.observacoes && (
                                        <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6, fontStyle: "italic" }}>
                                            {receita.observacoes}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={modalExcluirVisible} transparent animationType="fade" onRequestClose={() => setModalExcluirVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
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
