import React, { useState } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import { criarProducao, atualizarProducao } from "../../services/api";
import { Producao } from "../../interfaces/interfaces";
import Toast from "react-native-toast-message";

export default function ProducaoRegistro() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const producaoEditando: Producao | undefined = route.params?.producao;
    const isEditando = !!producaoEditando;
    const [formData, setFormData] = useState({
        date: producaoEditando?.data?.split("T")[0] ?? new Date().toISOString().split("T")[0],
        dailyProduction: producaoEditando?.producao_diaria?.toString() ?? "",
        notes: producaoEditando?.observacoes ?? "",
    });

    const total = parseFloat(formData.dailyProduction) || 0;

    async function handleSubmit() {
        if (!formData.dailyProduction.trim()) {
            Alert.alert("Atencao", "Preencha a Producao Diaria.");
            return;
        }

        const dailyProduction = Number(formData.dailyProduction);
        if (isNaN(dailyProduction) || dailyProduction <= 0) {
            Alert.alert("Atencao", "A Producao Diaria deve ser maior que 0.");
            return;
        }

        try {
            const dados = {
                date: formData.date,
                dailyProduction,
                notes: formData.notes.trim() || null,
            };

            if (isEditando) {
                await atualizarProducao(producaoEditando!.id, dados);
            } else {
                await criarProducao(dados);
            }

            Toast.show({
                type: "success",
                text1: isEditando ? "Producao atualizada!" : "Producao registrada!",
                text2: isEditando
                    ? "As alteracoes foram salvas."
                    : "Sua coleta foi salva com sucesso.",
                position: "top",
                visibilityTime: 3500,
            });

            if (!isEditando) {
                setFormData({
                    date: new Date().toISOString().split("T")[0],
                    dailyProduction: "",
                    notes: "",
                });
            }

            setTimeout(() => navigation.goBack(), 500);
        } catch (error: any) {
            console.error(error);
            Alert.alert("Erro", error.message || "Nao foi possivel salvar a producao. Tente novamente.");
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16, paddingHorizontal: 20,
                        paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                {isEditando ? "Editar Coleta" : "Nova Coleta"}
                            </Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {isEditando ? "Atualize os dados da producao" : "Registre a producao diaria"}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Data da Coleta</Text>
                        </View>
                        <View style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
                            <Text style={{ fontSize: 15, color: "#0a0a0a" }}>
                                {new Date(formData.date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </Text>
                        </View>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="droplet" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Producao Diaria (Litros)</Text>
                        </View>
                        <TextInput
                            value={formData.dailyProduction}
                            onChangeText={(v) => setFormData({ ...formData, dailyProduction: v })}
                            placeholder="Ex: 45.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {total > 0 && (
                        <View style={{ backgroundColor: "rgba(74,144,226,0.1)", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "rgba(74,144,226,0.2)" }}>
                            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Producao Diaria</Text>
                            <Text style={{ fontSize: 28, fontWeight: "700", color: "#4a90e2" }}>{total.toFixed(1)} L</Text>
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="edit-3" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Observacoes</Text>
                        </View>
                        <TextInput
                            value={formData.notes}
                            onChangeText={(v) => setFormData({ ...formData, notes: v })}
                            placeholder="Anotacoes sobre a coleta..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 80 }}
                        />
                    </View>

                    <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ marginBottom: insets.bottom + 20 }}>
                        <LinearGradient
                            colors={["#4a90e2", "#357abd"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                                {isEditando ? "Atualizar Registro" : "Salvar Registro"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
