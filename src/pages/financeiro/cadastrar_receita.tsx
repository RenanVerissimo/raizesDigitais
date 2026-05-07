import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StatusBar, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateInput from "../../components/DateInput";
import { toBr, toIso } from "../../utils/formatters";
import { criarReceita } from "../../services/api";
import Toast from "react-native-toast-message";

export default function CadastrarReceita() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, "0");
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const yyyy = hoje.getFullYear();

    const [formData, setFormData] = useState({
        data: `${dd}/${mm}/${yyyy}`,  // já inicia em DD/MM/AAAA
        litros: "",
        precoPorLitro: "",
        comprador: "",
        observacoes: "",
    });

    const total = (parseFloat(formData.litros) || 0) * (parseFloat(formData.precoPorLitro) || 0);

    function handleCancelar() {
        navigation.goBack();

    }

    async function handleSubmit() {
        if (!formData.litros || !formData.precoPorLitro || !formData.comprador.trim()) {
            Alert.alert("Atenção", "Preencha os campos obrigatórios marcados com *");
            return;
        }

        const litros = parseFloat(formData.litros);
        const preco = parseFloat(formData.precoPorLitro);

        if (isNaN(litros) || litros <= 0) {
            Alert.alert("Atenção", "Litros inválidos.");
            return;
        }

        if (isNaN(preco) || preco <= 0) {
            Alert.alert("Atenção", "Preço inválido.");
            return;
        }

        const dataIso = toIso(formData.data);
        if (!dataIso) {
            Alert.alert("Atenção", "Informe uma data válida (DD/MM/AAAA).");
            return;
        }

        try {
            const dadosReceita = {
                data: dataIso,
                litros,
                precoPorLitro: preco,
                comprador: formData.comprador.trim(),
                observacoes: formData.observacoes.trim() || null,
            };

            const nova = await criarReceita(dadosReceita);

            if (route.params?.onCadastrar) {
                route.params.onCadastrar(nova);
            }

            Toast.show({
                type: "success",
                text1: "Receita cadastrada!",
                text2: "A venda foi registrada com sucesso.",
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao cadastrar",
                text2: error.message || "Não foi possível cadastrar a receita.",
                position: "top",
                visibilityTime: 3000,
            });
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="dollar-sign" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Nova Receita</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Registre uma venda de leite
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Data da Venda <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                        </View>
                        <DateInput
                            value={formData.data}
                            onChange={(v) => setFormData({ ...formData, data: v })}
                        />
                    </View>

                    <Campo icone="droplet" label="Litros Vendidos *" valor={formData.litros}
                        onChange={(v: string) => setFormData({ ...formData, litros: v })}
                        placeholder="Ex: 500" keyboard="decimal-pad" />

                    <Campo icone="dollar-sign" label="Preço por Litro *" valor={formData.precoPorLitro}
                        onChange={(v: string) => setFormData({ ...formData, precoPorLitro: v })}
                        placeholder="Ex: 2.50" keyboard="decimal-pad" />

                    {total > 0 && (
                        <View style={{ backgroundColor: "#f0fdf4", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#bbf7d0" }}>
                            <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Valor Total</Text>
                            <Text style={{ fontSize: 28, fontWeight: "700", color: "#16a34a" }}>
                                R$ {total.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <Campo icone="user" label="Comprador *" valor={formData.comprador}
                        onChange={(v: string) => setFormData({ ...formData, comprador: v })}
                        placeholder="Nome do comprador / laticínio" />

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="edit-3" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Observações <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.observacoes}
                            onChangeText={(v) => setFormData({ ...formData, observacoes: v })}
                            placeholder="Observações adicionais..."
                            placeholderTextColor="#9ca3af"
                            multiline numberOfLines={3} textAlignVertical="top"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 80 }}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity onPress={handleCancelar} activeOpacity={0.7} style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ flex: 2 }}>
                            <LinearGradient colors={["#4a90e2", "#357abd"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Cadastrar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Campo({ icone, label, valor, onChange, placeholder, keyboard, hint }: any) {
    return (
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Feather name={icone} size={16} color="#4a90e2" />
                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>{label}</Text>
            </View>
            <TextInput
                value={valor}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboard || "default"}
                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
            />
            {hint && <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{hint}</Text>}
        </View>
    );
}
