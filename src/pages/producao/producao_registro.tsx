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
import { useNavigation } from "@react-navigation/native";

export default function ProducaoRegistro() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        morningProduction: "",
        afternoonProduction: "",
        quality: "good" as "excellent" | "good" | "regular",
        notes: "",
    });

    const total =
        (parseFloat(formData.morningProduction) || 0) +
        (parseFloat(formData.afternoonProduction) || 0);

    function getQualityStyle(q: string, selected: boolean) {
        if (q === "excellent") return selected
            ? { bg: "#22c55e", text: "#fff", border: "#22c55e" }
            : { bg: "#fff", text: "#6b7280", border: "#e5e7eb" };
        if (q === "good") return selected
            ? { bg: "#facc15", text: "#fff", border: "#facc15" }
            : { bg: "#fff", text: "#6b7280", border: "#e5e7eb" };
        return selected
            ? { bg: "#fb923c", text: "#fff", border: "#fb923c" }
            : { bg: "#fff", text: "#6b7280", border: "#e5e7eb" };
    }

    async function handleSubmit() {
        if (!formData.morningProduction || !formData.afternoonProduction) {
            Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
            return;
        }

        Alert.alert("Sucesso", "Produção registrada com sucesso!", [
            {
                text: "OK",
                onPress: () => {
                    setFormData({
                        date: new Date().toISOString().split("T")[0],
                        morningProduction: "",
                        afternoonProduction: "",
                        quality: "good",
                        notes: "",
                    });
                },
            },
        ]);
    }

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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Nova Coleta</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>Registre a produção do dia</Text>
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
                            <Feather name="sunrise" size={16} color="#f97316" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Produção da Manhã (Litros)</Text>
                        </View>
                        <TextInput
                            value={formData.morningProduction}
                            onChangeText={(v) => setFormData({ ...formData, morningProduction: v })}
                            placeholder="Ex: 25.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="sunset" size={16} color="#6366f1" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Produção da Tarde (Litros)</Text>
                        </View>
                        <TextInput
                            value={formData.afternoonProduction}
                            onChangeText={(v) => setFormData({ ...formData, afternoonProduction: v })}
                            placeholder="Ex: 20.0"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {total > 0 && (
                        <View style={{ backgroundColor: "rgba(74,144,226,0.1)", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "rgba(74,144,226,0.2)" }}>
                            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Produção Total</Text>
                            <Text style={{ fontSize: 28, fontWeight: "700", color: "#4a90e2" }}>{total.toFixed(1)} L</Text>
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="star" size={16} color="#eab308" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Qualidade do Leite</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {(["excellent", "good", "regular"] as const).map((q) => {
                                const selected = formData.quality === q;
                                const s = getQualityStyle(q, selected);
                                const label = q === "excellent" ? "Excelente" : q === "good" ? "Boa" : "Regular";
                                return (
                                    <TouchableOpacity
                                        key={q}
                                        onPress={() => setFormData({ ...formData, quality: q })}
                                        style={{
                                            flex: 1,
                                            backgroundColor: s.bg,
                                            borderWidth: 1,
                                            borderColor: s.border,
                                            borderRadius: 12,
                                            paddingVertical: 10,
                                            alignItems: "center",
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: s.text }}>{label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="edit-3" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Observações</Text>
                        </View>
                        <TextInput
                            value={formData.notes}
                            onChangeText={(v) => setFormData({ ...formData, notes: v })}
                            placeholder="Anotações sobre a coleta..."
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
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Salvar Registro</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}