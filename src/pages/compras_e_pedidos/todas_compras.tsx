import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { excluirCompra, listarCompras } from "../../services/api";
import { CategoriaCompra, Compra, StatusCompra } from "../../interfaces/interfaces";
import { toBr } from "../../utils/formatters";
import ConfirmDeleteModal from "../animais/ConfirmationModal";
import { CATEGORIAS } from "./compras_e_pedidos";

const STATUS_CONFIG: Record<StatusCompra, { label: string; bg: string; text: string; iconColor: string; icon: any }> = {
    pendente: { label: "Pendente", bg: "#fef9c3", text: "#a16207", iconColor: "#ca8a04", icon: "clock" },
    concluido: { label: "Concluído", bg: "#dcfce7", text: "#15803d", iconColor: "#16a34a", icon: "check-circle" },
    cancelado: { label: "Cancelado", bg: "#fee2e2", text: "#b91c1c", iconColor: "#dc2626", icon: "x-circle" },
};

const FINALIDADE_LABEL: Record<string, { label: string; bg: string; text: string }> = {
    mastite: { label: "Mastite", bg: "#fee2e2", text: "#b91c1c" },
    outro_tratamento: { label: "Tratamento", bg: "#dbeafe", text: "#1d4ed8" },
    uso_geral: { label: "Uso geral", bg: "#f3f4f6", text: "#374151" },
};

const UNIDADE_COMPRA_LABEL: Record<string, { singular: string; plural: string }> = {
    kg: { singular: "kg", plural: "kg" },
    saco: { singular: "saco", plural: "sacos" },
    saca: { singular: "saca", plural: "sacas" },
    fardo: { singular: "fardo", plural: "fardos" },
    unidade: { singular: "un.", plural: "un." },
};

function formatarQuantidadeCompra(compra: Compra) {
    const quantidade = Number(compra.quantidade || 0);
    const unidadeBase = compra.categoria === "racao" ? compra.unidadeCompra : "unidade";
    const unidade = unidadeBase ? UNIDADE_COMPRA_LABEL[unidadeBase] : UNIDADE_COMPRA_LABEL.unidade;
    const labelUnidade = quantidade === 1 ? unidade.singular : unidade.plural;
    return `${quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${labelUnidade}`;
}

export default function TodasCompras() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [compras, setCompras] = useState<Compra[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [compraSelecionada, setCompraSelecionada] = useState<Compra | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [excluindoId, setExcluindoId] = useState<number | null>(null);

    useFocusEffect(useCallback(() => {
        setCarregando(true);
        listarCompras()
            .then(setCompras)
            .catch(() => Alert.alert("Erro", "Não foi possível carregar as compras"))
            .finally(() => setCarregando(false));
    }, []));

    function handleEditar(compra: Compra) {
        if (excluindoId !== null) return;
        navigation.navigate("editar_compras", { compra });
    }

    function handleExcluir(compra: Compra) {
        if (excluindoId !== null) return;
        setCompraSelecionada(compra);
        setModalVisible(true);
    }

    async function confirmarExclusao() {
        if (!compraSelecionada) return;
        const itemExcluido = compraSelecionada.item;

        try {
            setExcluindoId(compraSelecionada.id);
            await excluirCompra(compraSelecionada.id);
            setCompras((prev) => prev.filter((c) => c.id !== compraSelecionada.id));
            Toast.show({
                type: "success",
                text1: "Compra excluída",
                text2: `${itemExcluido} foi removido com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });
        } catch {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: "A conexão demorou demais ou caiu. Tente novamente em alguns instantes.",
                position: "top",
                visibilityTime: 3000,
            });
        } finally {
            setExcluindoId(null);
            setModalVisible(false);
            setCompraSelecionada(null);
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
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Todas as Compras</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {compras.length} {compras.length === 1 ? "compra" : "compras"}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9", gap: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" }}>
                                <Feather name="shopping-bag" size={18} color="#4a90e2" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#0a0a0a" }}>Todas as compras recentes</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                                    Histórico completo em ordem recente
                                </Text>
                            </View>
                        </View>

                        {carregando ? (
                            <View style={{ padding: 32, alignItems: "center" }}>
                                <ActivityIndicator size="large" color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 14 }}>
                                    Carregando compras
                                </Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4, textAlign: "center" }}>
                                    A API pode levar alguns segundos para responder.
                                </Text>
                            </View>
                        ) : compras.length === 0 ? (
                            <View style={{ padding: 32, alignItems: "center" }}>
                                <Feather name="shopping-cart" size={48} color="#d1d5db" />
                                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>Nenhuma compra encontrada</Text>
                            </View>
                        ) : (
                            <View style={{ gap: 12 }}>
                                {compras.map((compra) => {
                                    const cat = CATEGORIAS[compra.categoria as CategoriaCompra];
                                    const status = STATUS_CONFIG[compra.status];
                                    const finalidade = compra.finalidadeTratamento ? FINALIDADE_LABEL[compra.finalidadeTratamento] : null;

                                    return (
                                        <View key={compra.id} style={{ backgroundColor: "#f9fafb", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                                <View style={{ flex: 1, marginRight: 10 }}>
                                                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a", marginBottom: 6 }}>{compra.item}</Text>
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                        <View style={{ backgroundColor: cat.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                            <Text style={{ fontSize: 11, color: cat.text, fontWeight: "500" }}>{cat.label}</Text>
                                                        </View>
                                                        <View style={{ backgroundColor: status.bg, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                            <Feather name={status.icon} size={11} color={status.iconColor} />
                                                            <Text style={{ fontSize: 11, color: status.text, fontWeight: "500" }}>{status.label}</Text>
                                                        </View>
                                                        {compra.categoria === "medicamento" && finalidade && (
                                                            <View style={{ backgroundColor: finalidade.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                                <Text style={{ fontSize: 11, color: finalidade.text, fontWeight: "500" }}>{finalidade.label}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>

                                                <View style={{ flexDirection: "row", gap: 6 }}>
                                                    <TouchableOpacity onPress={() => handleEditar(compra)} activeOpacity={0.7} disabled={excluindoId !== null} style={{ width: 32, height: 32, backgroundColor: "#f59e0b", borderRadius: 8, alignItems: "center", justifyContent: "center", opacity: excluindoId !== null ? 0.55 : 1 }}>
                                                        <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleExcluir(compra)} activeOpacity={0.7} disabled={excluindoId !== null} style={{ width: 32, height: 32, backgroundColor: "#ef4444", borderRadius: 8, alignItems: "center", justifyContent: "center", opacity: excluindoId !== null && excluindoId !== compra.id ? 0.55 : 1 }}>
                                                        {excluindoId === compra.id ? (
                                                            <ActivityIndicator color="#fff" />
                                                        ) : (
                                                            <MaterialCommunityIcons name="trash-can" size={16} color="#fff" />
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                    <Feather name="truck" size={12} color="#6b7280" />
                                                    <Text style={{ fontSize: 12, color: "#6b7280" }}>{compra.fornecedor}</Text>
                                                </View>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                    <Feather name="calendar" size={12} color="#6b7280" />
                                                    <Text style={{ fontSize: 12, color: "#6b7280" }}>{toBr(compra.data)}</Text>
                                                </View>
                                            </View>

                                            <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#fff", padding: 10, borderRadius: 10 }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Quantidade</Text>
                                                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>{formatarQuantidadeCompra(compra)}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Preço Un.</Text>
                                                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>R$ {compra.precoUnitario.toFixed(2)}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Total</Text>
                                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#4a90e2" }}>R$ {compra.precoTotal.toFixed(2)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                <ConfirmDeleteModal
                    visible={modalVisible}
                    title="Excluir compra"
                    nomeAnimal={compraSelecionada?.item || ""}
                    loading={excluindoId === compraSelecionada?.id}
                    onCancel={() => {
                        if (excluindoId !== null) return;
                        setModalVisible(false);
                    }}
                    onConfirm={confirmarExclusao}
                />
            </ScrollView>
        </View>
    );
}
