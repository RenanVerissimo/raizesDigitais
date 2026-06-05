import React, { useCallback, useState } from "react";
import { Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Compra } from "../../interfaces/interfaces";
import { excluirCompra, listarCompras } from "../../services/api";
import { toBr } from "../../utils/formatters";
import { TIPOS_RACAO } from "./estoque_racao";

const UNIDADES_COMPRA_RACAO: Record<string, string> = {
    kg: "kg",
    saco: "saco",
    saca: "saca",
    fardo: "fardo",
    unidade: "un.",
};

function formatarNumero(valor: number) {
    return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function normalizarTexto(valor?: string | null) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterTipoCompra(compra: Compra) {
    return (
        TIPOS_RACAO.find((t) => t.key === compra.tipoRacao) ||
        TIPOS_RACAO.find((t) => normalizarTexto(t.label) === normalizarTexto(compra.item)) ||
        TIPOS_RACAO[0]
    );
}

function descricaoCompraRacao(compra: Compra) {
    const unidade = compra.unidadeCompra ? UNIDADES_COMPRA_RACAO[compra.unidadeCompra] || compra.unidadeCompra : "un.";
    const quantidadeObtidaKg = Number(compra.quantidadeEstoqueKg ?? compra.quantidade);
    const textoKg = `${formatarNumero(quantidadeObtidaKg)} kg obtidos`;

    if (compra.unidadeCompra === "kg") return textoKg;
    return `${formatarNumero(compra.quantidade)} ${unidade} - ${textoKg}`;
}

export default function TodasComprasRacao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [comprasRacao, setComprasRacao] = useState<Compra[]>([]);
    const [compraParaExcluir, setCompraParaExcluir] = useState<Compra | null>(null);

    async function carregarCompras() {
        try {
            const compras = await listarCompras();
            const concluidas = compras
                .filter((compra) => compra.categoria === "racao" && compra.status === "concluido")
                .sort((a, b) => String(b.data).localeCompare(String(a.data)));
            setComprasRacao(concluidas);
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar",
                text2: err.message || "Não foi possível carregar as compras de ração.",
                position: "top",
            });
        }
    }

    useFocusEffect(useCallback(() => {
        carregarCompras();
    }, []));

    function editarCompra(compra: Compra) {
        navigation.navigate("editar_compras", { compra });
    }

    function confirmarExclusao(compra: Compra) {
        setCompraParaExcluir(compra);
    }

    async function excluirCompraSelecionada() {
        if (!compraParaExcluir) return;

        try {
            await excluirCompra(compraParaExcluir.id);
            setComprasRacao((prev) => prev.filter((item) => item.id !== compraParaExcluir.id));
            setCompraParaExcluir(null);
            Toast.show({
                type: "success",
                text1: "Compra excluída",
                position: "top",
            });
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: err.message || "Não foi possível excluir a compra.",
                position: "top",
            });
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <Modal transparent visible={!!compraParaExcluir} animationType="fade" onRequestClose={() => setCompraParaExcluir(null)}>
                <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#fee2e2" }}>
                        <View style={{ alignItems: "center" }}>
                            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                                <Feather name="trash-2" size={20} color="#dc2626" />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: "900", color: "#0a0a0a", textAlign: "center" }}>Excluir compra?</Text>
                            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8, textAlign: "center", lineHeight: 18 }}>
                                Deseja realmente excluir a compra de {compraParaExcluir ? obterTipoCompra(compraParaExcluir).label : "ração"}?
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => setCompraParaExcluir(null)}
                                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center" }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#374151" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={excluirCompraSelecionada}
                                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#ef4444", alignItems: "center" }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Excluir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Compras de Ração</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {comprasRacao.length} {comprasRacao.length === 1 ? "compra realizada" : "compras realizadas"}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        {comprasRacao.length === 0 ? (
                            <View style={{ paddingVertical: 34, alignItems: "center" }}>
                                <Feather name="shopping-bag" size={44} color="#d1d5db" />
                                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10, textAlign: "center" }}>Nenhuma compra de ração concluída</Text>
                            </View>
                        ) : comprasRacao.map((compra) => {
                            const tipo = obterTipoCompra(compra);

                            return (
                                <View key={compra.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text style={{ fontSize: 13, fontWeight: "800", color: "#0a0a0a" }}>{tipo.label}</Text>
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                {descricaoCompraRacao(compra)}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{toBr(compra.data)}{compra.fornecedor ? ` - ${compra.fornecedor}` : ""}</Text>
                                        </View>
                                        <View style={{ alignItems: "flex-end", gap: 8 }}>
                                            <Text style={{ fontSize: 12, fontWeight: "800", color: "#16a34a" }}>R$ {compra.precoTotal.toFixed(2)}</Text>
                                            <View style={{ flexDirection: "row", gap: 6 }}>
                                                <TouchableOpacity
                                                    activeOpacity={0.75}
                                                    onPress={() => editarCompra(compra)}
                                                    style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Feather name="edit-2" size={15} color="#fff" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    activeOpacity={0.75}
                                                    onPress={() => confirmarExclusao(compra)}
                                                    style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Feather name="trash-2" size={15} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
