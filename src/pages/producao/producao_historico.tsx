import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
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
    const [filterQuality, setFilterQuality] = useState<"all" | "excellent" | "good" | "regular">("all");
    const [allProducoes, setAllProducoes] = useState<Producao[]>([]);

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
        const matchesQuality = filterQuality === "all" || prod.qualidade === filterQuality;
        return matchesSearch && matchesQuality;
    });

    const totalLiters = filteredProductions.reduce((sum, p) => sum + Number(p.producao_total), 0);

    const totalPaginas = Math.ceil(filteredProductions.length / ITENS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const producoesPaginadas = filteredProductions.slice(inicio, inicio + ITENS_POR_PAGINA);

    function getQualidadeStyle(qualidade: string) {
        if (qualidade === "excellent") return { bg: "#dcfce7", text: "#15803d", label: "Excelente" };
        if (qualidade === "good") return { bg: "#dbeafe", text: "#1d4ed8", label: "Boa" };
        return { bg: "#fef9c3", text: "#a16207", label: "Regular" };
    }

    function handleDelete(id: number) {
        Alert.alert("Confirmar", "Deseja excluir este registro?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        await excluirProducao(id);
                        setAllProducoes((prev) => prev.filter((p) => p.id !== id));
                        Toast.show({
                            type: "success",
                            text1: "Excluído!",
                            text2: "Registro removido com sucesso.",
                            position: "top",
                        });
                    } catch (err) {
                        Alert.alert("Erro", "Não foi possível excluir.");
                    }
                },
            },
        ]);
    }

    function handleEdit(prod: Producao) {
        navigation.navigate("ProducaoEdicao", { producao: prod });
    }

    const filterButtons: { key: "all" | "excellent" | "good" | "regular"; label: string; activeColor: string }[] = [
        { key: "all", label: "Todas", activeColor: "#4a90e2" },
        { key: "excellent", label: "Excelente", activeColor: "#22c55e" },
        { key: "good", label: "Boa", activeColor: "#3b82f6" },
        { key: "regular", label: "Regular", activeColor: "#eab308" },
    ];

    useEffect(() => {
        setPaginaAtual(1);
    }, [searchTerm, filterQuality]);

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
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
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
                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <Feather name="filter" size={14} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Filtrar por Qualidade</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                            {filterButtons.map((f) => (
                                <TouchableOpacity
                                    key={f.key}
                                    onPress={() => setFilterQuality(f.key)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 7,
                                        borderRadius: 8,
                                        backgroundColor: filterQuality === f.key ? f.activeColor : "#f3f4f6",
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: "500", color: filterQuality === f.key ? "#fff" : "#374151" }}>{f.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

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
                            const q = getQualidadeStyle(prod.qualidade);
                            return (
                                <View key={prod.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a", marginBottom: 6 }}>
                                                {formatarData(prod.data)}
                                            </Text>
                                            <View style={{ backgroundColor: q.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: "flex-start" }}>
                                                <Text style={{ fontSize: 11, color: q.text, fontWeight: "500" }}>{q.label}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: "row", gap: 4 }}>
                                            <TouchableOpacity onPress={() => handleEdit(prod)} style={{ padding: 8 }}>
                                                <Feather name="edit-2" size={18} color="#4a90e2" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(prod.id)} style={{ padding: 8 }}>
                                                <Feather name="trash-2" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: "row", gap: 8, marginBottom: prod.observacoes ? 12 : 0 }}>
                                        <View style={{ flex: 1, backgroundColor: "#fff7ed", borderRadius: 10, padding: 12 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                                <Feather name="sunrise" size={12} color="#ea580c" />
                                                <Text style={{ fontSize: 11, color: "#ea580c" }}>Manhã</Text>
                                            </View>
                                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>{prod.producao_manha}L</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: "#eef2ff", borderRadius: 10, padding: 12 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                                <Feather name="sunset" size={12} color="#4f46e5" />
                                                <Text style={{ fontSize: 11, color: "#4f46e5" }}>Tarde</Text>
                                            </View>
                                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>{prod.producao_tarde}L</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: "rgba(74,144,226,0.1)", borderRadius: 10, padding: 12 }}>
                                            <Text style={{ fontSize: 11, color: "#4a90e2", marginBottom: 4 }}>Total</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>{prod.producao_total}L</Text>
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
        </View>
    );
}