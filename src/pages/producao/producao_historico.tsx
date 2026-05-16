import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Producao } from "../../interfaces/interfaces";
import { listarProducoes, excluirProducao } from "../../services/api";
import { formatarData } from "../../utils/formatters";

import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import Toast from "react-native-toast-message";

export default function ProducaoHistorico() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [searchTerm, setSearchTerm] = useState("");
    const [allProducoes, setAllProducoes] = useState<Producao[]>([]);
    const [modalExcluirVisible, setModalExcluirVisible] = useState(false);
    const [producaoSelecionada, setProducaoSelecionada] = useState<Producao | null>(null);

    const [paginaAtual, setPaginaAtual] = useState(1);
    const ITENS_POR_PAGINA = 5;

    async function carregarProducoes() {
        try {
            const data = await listarProducoes();
            setAllProducoes(data);
        } catch (err) {
            console.error("Erro:", err);
        }
    }
    useFocusEffect(
        useCallback(() => {
            carregarProducoes();
        }, [])
    );

    const filteredProductions = allProducoes.filter((prod) => {
        const matchesSearch = prod.data.includes(searchTerm) || prod.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const totalLiters = filteredProductions.reduce((sum, p) => sum + Number(p.producao_diaria), 0);

    const totalPaginas = Math.ceil(filteredProductions.length / ITENS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const producoesPaginadas = filteredProductions.slice(inicio, inicio + ITENS_POR_PAGINA);

    function abrirModalExclusao(producao: Producao) {
        setProducaoSelecionada(producao);
        setModalExcluirVisible(true);
    }

    async function confirmarExclusao() {
        if (!producaoSelecionada) return;

        try {
            await excluirProducao(producaoSelecionada.id);
            setAllProducoes((prev) => prev.filter((p) => p.id !== producaoSelecionada.id));
            setModalExcluirVisible(false);
            setProducaoSelecionada(null);
            setPaginaAtual((pagina) => Math.max(1, Math.min(pagina, Math.ceil((allProducoes.length - 1) / ITENS_POR_PAGINA) || 1)));
            Toast.show({
                type: "success",
                text1: "Excluído!",
                text2: "Registro removido com sucesso.",
                position: "top",
            });
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: err.message || "Não foi possível excluir.",
                position: "top",
            });
        }
    }

    function handleEdit(prod: Producao) {
        navigation.navigate("ProducaoEdicao", { producao: prod });
    }

    useEffect(() => {
        setPaginaAtual(1);
    }, [searchTerm]);

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16,
                        paddingHorizontal: 20,
                        paddingBottom: 24,
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => navigation.replace("Dashboard")} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Histórico</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>{filteredProductions.length} registros</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 12 }}>
                        <Feather name="search" size={18} color="rgba(255,255,255,0.6)" />
                        <TextInput
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholder="Buscar por data ou observação..."
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            style={{ flex: 1, paddingVertical: 10, paddingLeft: 10, fontSize: 14, color: "#fff" }}
                        />
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 14 }}>
                    <View style={{ backgroundColor: "rgba(74,144,226,0.1)", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(74,144,226,0.2)" }}>
                        <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Total do Período Filtrado</Text>
                        <Text style={{ fontSize: 22, fontWeight: "700", color: "#4a90e2" }}>{totalLiters.toLocaleString("pt-BR")} litros</Text>
                    </View>

                    {filteredProductions.length === 0 ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Text style={{ fontSize: 14, color: "#6b7280" }}>Nenhum registro encontrado</Text>
                        </View>
                    ) : (
                        producoesPaginadas.map((prod) => {
                            return (
                                <View key={prod.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a", marginBottom: 6 }}>
                                                {formatarData(prod.data)}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: "row", gap: 4 }}>
                                            <TouchableOpacity onPress={() => handleEdit(prod)} style={{ padding: 8 }}>
                                                <Feather name="edit-2" size={18} color="#4a90e2" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => abrirModalExclusao(prod)} style={{ padding: 8 }}>
                                                <Feather name="trash-2" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{ marginBottom: prod.observacoes ? 12 : 0 }}>
                                        <View style={{ backgroundColor: "rgba(74,144,226,0.1)", borderRadius: 10, padding: 12 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                                <Feather name="droplet" size={12} color="#4a90e2" />
                                                <Text style={{ fontSize: 11, color: "#4a90e2" }}>Produção diária</Text>
                                            </View>
                                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>{prod.producao_diaria}L</Text>
                                        </View>
                                    </View>

                                    {prod.observacoes ? (
                                        <View style={{ backgroundColor: "#f9fafb", borderRadius: 10, padding: 12 }}>
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Observações</Text>
                                            <Text style={{ fontSize: 13, color: "#374151" }}>{prod.observacoes}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })
                    )}

                    {totalPaginas > 1 && (
                        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, paddingVertical: 8 }}>
                            <TouchableOpacity
                                onPress={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                                disabled={paginaAtual === 1}
                                style={{
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: paginaAtual === 1 ? "#e5e7eb" : "#4a90e2",
                                }}
                            >
                                <Feather name="chevron-left" size={18} color="#fff" />
                            </TouchableOpacity>

                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>
                                Página {paginaAtual} de {totalPaginas}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                                disabled={paginaAtual === totalPaginas}
                                style={{
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: paginaAtual === totalPaginas ? "#e5e7eb" : "#4a90e2",
                                }}
                            >
                                <Feather name="chevron-right" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={{ height: insets.bottom + 20 }} />
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
                        <Text style={{ fontSize: 19, fontWeight: "800", color: "#0a0a0a", textAlign: "center" }}>Excluir coleta?</Text>
                        <Text style={{ fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19, marginTop: 8, marginBottom: 18 }}>
                            Deseja realmente excluir a coleta de {producaoSelecionada ? formatarData(producaoSelecionada.data) : "produção"}?
                        </Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalExcluirVisible(false);
                                    setProducaoSelecionada(null);
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
