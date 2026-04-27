import React, { useState, useEffect } from "react";

import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StatusBar, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Animal } from "../../interfaces/interfaces";
import { atualizarAnimal } from "../../services/api";
import Toast from "react-native-toast-message";

export default function editar_animais() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const animal: Animal = route.params?.animal;
    

    const [formData, setFormData] = useState({
        nome: animal?.nome ?? "",
        identificador: animal?.identificador ?? "",
        producaoMediaDiaria: animal ? String(animal.producao_media_diaria) : "",
        raca: animal?.raca ?? "",
        idade: animal?.idade ?? "",
        descricao: animal?.descricao ?? "",
    });

    function handleCancelar() {
        navigation.goBack();
    }


    async function handleSubmit() {
        if (!formData.nome.trim() || !formData.identificador.trim() || !formData.producaoMediaDiaria) {
            Alert.alert("Atenção", "Preencha os campos obrigatórios marcados com *");
            return;
        }

        const producao = parseFloat(formData.producaoMediaDiaria);
        if (isNaN(producao) || producao <= 0) {
            Alert.alert("Atenção", "Informe uma produção média válida (maior que 0).");
            return;
        }

        try {
            await atualizarAnimal(animal.id, {
                nome: formData.nome.trim(),
                identificador: formData.identificador.trim(),
                producao_media_diaria: producao,
                raca: formData.raca.trim() || null,
                idade: formData.idade.trim() || null,
                descricao: formData.descricao.trim() || null,
            });

            Toast.show({
                type: "success",
                text1: "Animal atualizado!",
                text2: "As alterações foram salvas com sucesso.",
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);

        } catch (err) {
            console.error(err);
            Toast.show({
                type: "error",
                text1: "Erro",
                text2: "Não foi possível salvar.",
            });
        }
    }

    const inputStyle = {
        backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb",
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a",
    };
    const cardStyle = {
        backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9",
    };
    const labelStyle = { fontSize: 14, fontWeight: "500" as const, color: "#0a0a0a" };

    useEffect(() => {
        if (animal) {
            setFormData({
                nome: animal.nome ?? "",
                identificador: animal.identificador ?? "",
                producaoMediaDiaria: String(animal.producao_media_diaria ?? ""),
                raca: animal.raca ?? "",
                idade: animal.idade ?? "",
                descricao: animal.descricao ?? "",
            });
        }
    }, [animal?.id]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, backgroundColor: "#f5f7fa" }}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24,
                        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="edit-2" size={18} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Editar Animal
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Atualize os dados do animal
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="tag" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>Nome do Animal *</Text>
                        </View>
                        <TextInput
                            value={formData.nome}
                            onChangeText={(v) => setFormData({ ...formData, nome: v })}
                            placeholder="Ex: Mimosa, Estrela"
                            placeholderTextColor="#9ca3af"
                            style={inputStyle}
                        />
                    </View>

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="hash" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>Número/Identificação *</Text>
                        </View>
                        <TextInput
                            value={formData.identificador}
                            onChangeText={(v) => setFormData({ ...formData, identificador: v })}
                            placeholder="Ex: 001, BR-1234"
                            placeholderTextColor="#9ca3af"
                            style={inputStyle}
                        />
                    </View>

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="droplet" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>Produção Média Diária (Litros) *</Text>
                        </View>
                        <TextInput
                            value={formData.producaoMediaDiaria}
                            onChangeText={(v) => setFormData({ ...formData, producaoMediaDiaria: v })}
                            placeholder="Ex: 25.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={inputStyle}
                        />
                    </View>

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <MaterialCommunityIcons name="cow" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Raça <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <TextInput
                            value={formData.raca}
                            onChangeText={(v) => setFormData({ ...formData, raca: v })}
                            placeholder="Ex: Holandesa, Jersey"
                            placeholderTextColor="#9ca3af"
                            style={inputStyle}
                        />
                    </View>

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="clock" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Idade <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <TextInput
                            value={formData.idade}
                            onChangeText={(v) => setFormData({ ...formData, idade: v })}
                            placeholder="Ex: 3 anos, 5 anos"
                            placeholderTextColor="#9ca3af"
                            style={inputStyle}
                        />
                    </View>

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Descrição do Animal <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <TextInput
                            value={formData.descricao}
                            onChangeText={(v) => setFormData({ ...formData, descricao: v })}
                            placeholder="Ex: Animal dócil, vacinada em janeiro..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ ...inputStyle, minHeight: 90 }}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            onPress={handleCancelar}
                            activeOpacity={0.7}
                            style={{
                                flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
                                borderRadius: 14, paddingVertical: 16, alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ flex: 2 }}>
                            <LinearGradient
                                colors={["#f59e0b", "#d97706"]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                            >
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Salvar Alterações</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}