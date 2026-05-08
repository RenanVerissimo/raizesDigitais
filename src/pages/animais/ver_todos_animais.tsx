import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Modal } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Animal } from "../../interfaces/interfaces";
import { listarAnimais, excluirAnimal } from "../../services/api";
import ConfirmDeleteModal from "./ConfirmationModal";
import { formatarData2 } from "../../utils/formatters";
import { calcularIdade } from "../../utils/idade";
import Toast from "react-native-toast-message";



export default function VerTodosAnimais() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [animais, setAnimais] = useState<Animal[]>([]);

    useFocusEffect(
        useCallback(() => {
            listarAnimais()
                .then(setAnimais)
                .catch(() => Alert.alert("Erro", "Não foi possível carregar"));
        }, [])
    );
    const [modalVisible, setModalVisible] = useState(false);
    const [animalSelecionado, setAnimalSelecionado] = useState<Animal | null>(null);
    function handleExcluir(animal: Animal) {
        setAnimalSelecionado(animal);
        setModalVisible(true);
    }

    async function confirmarExclusao() {
        if (!animalSelecionado) return;

        const nomeExcluido = animalSelecionado.nome;

        try {
            await excluirAnimal(animalSelecionado.id);
            setAnimais((prev) => prev.filter((a) => a.id !== animalSelecionado.id));

            Toast.show({
                type: "success",
                text1: "Animal excluído",
                text2: `${nomeExcluido} foi removido com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });
        } catch {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: "Não foi possível excluir o animal.",
                position: "top",
                visibilityTime: 3000,
            });
        } finally {
            setModalVisible(false);
            setAnimalSelecionado(null);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24,
                        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Todos os Animais
                            </Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {animais.length} {animais.length === 1 ? "animal" : "animais"} no total
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 10, paddingBottom: insets.bottom + 20 }}>
                    {animais.length === 0 ? (
                        <View style={{ alignItems: "center", paddingVertical: 60 }}>
                            <MaterialCommunityIcons name="cow" size={56} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>
                                Nenhum animal cadastrado
                            </Text>
                        </View>
                    ) : (
                        animais.map((animal) => (
                            <CardAnimal
                                key={animal.id}
                                animal={animal}
                                onEditar={() => navigation.navigate("editar_animais", { animal })}
                                onExcluir={() => handleExcluir(animal)}
                            />
                        ))
                    )}
                    <ConfirmDeleteModal
                        visible={modalVisible}
                        title="Excluir animal"
                        nomeAnimal={animalSelecionado?.nome || ""}
                        onCancel={() => setModalVisible(false)}
                        onConfirm={confirmarExclusao}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

function CardAnimal({ animal, onEditar, onExcluir }: { animal: Animal; onEditar: () => void; onExcluir: () => void }) {


    return (
        <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            backgroundColor: "rgba(74,144,226,0.1)",
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <MaterialCommunityIcons name="cow" size={22} color="#4a90e2" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }} numberOfLines={1}>
                            {animal.nome}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }} numberOfLines={1}>
                            ID: {animal.identificador}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }} numberOfLines={1}>
                            Raça: {animal.raca || "—"}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Idade: {calcularIdade(animal.data_nascimento)}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Nascimento: {formatarData2(animal.data_nascimento)}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Último parto: {animal.data_ultimo_parto ? formatarData2(animal.data_ultimo_parto) : "—"}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Peso: {animal.peso != null ? `${Number(animal.peso).toFixed(1)} kg` : "—"}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }} numberOfLines={2}>
                            Descrição: {animal.descricao || "—"}
                        </Text>
                        {Number(animal.mastite) === 1 && (
                            <View style={{ alignSelf: "flex-start", backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 }}>
                                <Text style={{ fontSize: 11, color: "#dc2626", fontWeight: "600" }}>Mastite</Text>
                            </View>
                        )}
                        {Number(animal.doente) === 1 && animal.doenca === "outra" && (
                            <View style={{ alignSelf: "flex-start", backgroundColor: "#dbeafe", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 }}>
                                <Text style={{ fontSize: 11, color: "#1d4ed8", fontWeight: "600" }}>
                                    {animal.descricao_doenca || "Outra doença"}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                        onPress={onEditar}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#f59e0b",
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#f59e0b",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                    >
                        <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onExcluir}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#ef4444",
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#ef4444",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                    >
                        <MaterialCommunityIcons name="trash-can" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ marginTop: 10, padding: 10, backgroundColor: "#eff6ff", borderRadius: 8 }}>
                <Text style={{ fontSize: 11, color: "#6b7280" }}>Produção Média Diária</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#4a90e2" }}>
                    {animal.producao_media_diaria != null
                        ? `${Number(animal.producao_media_diaria).toFixed(1)} L/dia`
                        : "—"}
                </Text>
            </View>
        </View>
    );
}
