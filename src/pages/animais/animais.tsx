import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Animal } from "../../interfaces/interfaces";
import { criarAnimal, listarAnimais, excluirAnimal } from "../../services/api";



export default function Animais() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();


    const [animais, setAnimais] = useState<Animal[]>([]);
    const [carregando, setCarregando] = useState(true);



    const totalAnimais = animais.length;
    const producaoDiariaEstimada = animais.reduce((s, a) => s + Number(a.producao_media_diaria), 0);
    const producaoMensalEstimada = producaoDiariaEstimada * 30;
    const mediaPorAnimal = totalAnimais > 0 ? producaoDiariaEstimada / totalAnimais : 0;

    const producaoRealMedia = 0;
    const eficiencia = producaoDiariaEstimada > 0
        ? Math.round((producaoRealMedia / producaoDiariaEstimada) * 100)
        : 0;

    function handleExcluir(animal: Animal) {
        Alert.alert("Excluir animal", `Deseja excluir ${animal.nome}?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        await excluirAnimal(animal.id);
                        setAnimais((prev) => prev.filter((a) => a.id !== animal.id));
                    } catch (err) {
                        Alert.alert("Erro", "Não foi possível excluir");
                    }
                },
            },
        ]);
    }


    useFocusEffect(
        useCallback(() => {
            carregarAnimais();
        }, [])
    );
    async function carregarAnimais() {
        try {
            setCarregando(true);
            const dados = await listarAnimais();
            setAnimais(dados);
        } catch (err) {
            Alert.alert("Erro", "Não foi possível carregar os animais");
        } finally {
            setCarregando(false);
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
                    style={{
                        paddingTop: insets.top + 16,
                        paddingHorizontal: 20,
                        paddingBottom: 24,
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Gestão de Animais
                            </Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {totalAnimais} {totalAnimais === 1 ? "animal cadastrado" : "animais cadastrados"}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("CadastrarAnimais")}
                        style={{
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.3)",
                            borderRadius: 12,
                            paddingVertical: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                            Cadastrar Novo Animal
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <Feather name="trending-up" size={18} color="#4a90e2" />
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a" }}>
                                Estimativa de Produção
                            </Text>
                        </View>

                        <View style={{ gap: 10 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#eff6ff", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Produção Diária Estimada</Text>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#4a90e2" }}>
                                    {producaoDiariaEstimada.toFixed(1)} L
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#eef2ff", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Produção Mensal Estimada</Text>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#4f46e5" }}>
                                    {producaoMensalEstimada.toLocaleString("pt-BR")} L
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#f0fdf4", borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Média por Animal</Text>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#15803d" }}>
                                    {mediaPorAnimal.toFixed(1)} L/dia
                                </Text>
                            </View>
                        </View>
                    </View>

                    {producaoRealMedia > 0 && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                <Feather name="calendar" size={18} color="#4a90e2" />
                                <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a" }}>
                                    Desempenho Real vs Estimado
                                </Text>
                            </View>

                            <View style={{ gap: 10 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ fontSize: 13, color: "#6b7280" }}>Real (últimos 7 dias)</Text>
                                    <Text style={{ fontSize: 14, color: "#0a0a0a" }}>{producaoRealMedia.toFixed(1)} L/dia</Text>
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ fontSize: 13, color: "#6b7280" }}>Estimada</Text>
                                    <Text style={{ fontSize: 14, color: "#0a0a0a" }}>{producaoDiariaEstimada.toFixed(1)} L/dia</Text>
                                </View>
                                <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                                        <Text style={{ fontSize: 13, color: "#6b7280" }}>Eficiência</Text>
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: "600",
                                            color: eficiencia >= 90 ? "#15803d" : eficiencia >= 70 ? "#a16207" : "#dc2626"
                                        }}>
                                            {eficiencia}%
                                        </Text>
                                    </View>
                                    <View style={{ height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                                        <View style={{
                                            height: 8,
                                            width: `${Math.min(eficiencia, 100)}%`,
                                            backgroundColor: eficiencia >= 90 ? "#22c55e" : eficiencia >= 70 ? "#facc15" : "#ef4444",
                                            borderRadius: 4,
                                        }} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a", marginBottom: 14 }}>
                            Animais Cadastrados
                        </Text>

                        {animais.length === 0 ? (
                            <View style={{ alignItems: "center", paddingVertical: 24 }}>
                                <MaterialCommunityIcons name="cow" size={48} color="#d1d5db" />
                                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>
                                    Nenhum animal cadastrado ainda
                                </Text>
                                <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                                    Cadastre animais para estimar a produção
                                </Text>
                            </View>
                        ) : (
                            <View style={{ gap: 10 }}>
                                {animais.map((animal) => (
                                    <View key={animal.id} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14 }}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
                                                <View style={{ backgroundColor: "rgba(74,144,226,0.1)", padding: 8, borderRadius: 10 }}>
                                                    <MaterialCommunityIcons name="cow" size={20} color="#4a90e2" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>{animal.nome}</Text>
                                                    <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>ID: {animal.identificador}</Text>
                                                    {animal.raca && (
                                                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Raça: {animal.raca}</Text>
                                                    )}
                                                    {animal.idade && (
                                                        <Text style={{ fontSize: 11, color: "#9ca3af" }}>Idade: {animal.idade}</Text>
                                                    )}
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => handleExcluir(animal)} style={{ padding: 6 }} activeOpacity={0.7}>
                                                <Feather name="trash-2" size={16} color="#9ca3af" />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ backgroundColor: "#eff6ff", borderRadius: 8, padding: 10, marginTop: 10 }}>
                                            <Text style={{ fontSize: 11, color: "#6b7280" }}>Produção Média Diária</Text>
                                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#4a90e2", marginTop: 2 }}>
                                                <Text>{Number(animal.producao_media_diaria).toFixed(1)} L/dia</Text>
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ backgroundColor: "rgba(74,144,226,0.08)", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "rgba(74,144,226,0.2)", marginBottom: insets.bottom + 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a", marginBottom: 10 }}>
                            💡 Dicas
                        </Text>
                        <View style={{ gap: 8 }}>
                            {[
                                "Mantenha o cadastro atualizado para estimativas mais precisas",
                                "A produção média varia conforme raça, alimentação e saúde",
                                "Compare a produção real com a estimada para identificar melhorias",
                            ].map((dica, i) => (
                                <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                                    <Text style={{ color: "#4a90e2", fontSize: 13 }}>•</Text>
                                    <Text style={{ flex: 1, fontSize: 13, color: "#374151" }}>{dica}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}