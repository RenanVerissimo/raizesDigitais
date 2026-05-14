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
import { atualizarProducao } from "../../services/api";
import { Producao } from "../../interfaces/interfaces";
import Toast from "react-native-toast-message";

function normalizarData(data?: string | null) {
    if (!data) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
        const [dia, mes, ano] = data.split("/");
        return `${ano}-${mes}-${dia}`;
    }
    return data.slice(0, 10);
}

function formatarDataBr(data?: string | null) {
    const dataNormalizada = normalizarData(data);
    if (!dataNormalizada) return "";

    const [ano, mes, dia] = dataNormalizada.split("-");
    if (!ano || !mes || !dia) return dataNormalizada;

    return `${dia}/${mes}/${ano}`;
}

export default function ProducaoEdicao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const producao: Producao = route.params.producao;
    const dataProducao = normalizarData(producao.data);
    const totalOriginal = Number(producao.producao_diaria);

    const [formData, setFormData] = useState({
        date: dataProducao,
        dailyProduction: producao.producao_diaria.toString(),
        quality: producao.qualidade as "excellent" | "good" | "regular",
        notes: producao.observacoes ?? "",
    });

    const total = parseFloat(formData.dailyProduction) || 0;
    const diferenca = total - totalOriginal;

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
            await atualizarProducao(producao.id, {
                date: formData.date,
                dailyProduction,
                quality: formData.quality,
                notes: formData.notes.trim() || null,
            });

            Toast.show({
                type: "success",
                text1: "Producao atualizada!",
                text2: "As alteracoes foram salvas.",
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.replace("ProducaoHistorico"), 500);
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Nao foi possivel atualizar a producao. Tente novamente.");
        }
    }

    function handleCancel() {
        navigation.replace("ProducaoHistorico");
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#f59e0b", "#d97706"]}
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
                        <TouchableOpacity onPress={() => navigation.replace("ProducaoHistorico")} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="edit-2" size={18} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Editar Coleta
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {formatarDataBr(producao.data)}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    <View style={{ backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#fde68a", flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Feather name="info" size={18} color="#d97706" />
                        <Text style={{ flex: 1, fontSize: 13, color: "#92400e" }}>
                            Voce esta editando um registro existente. As alteracoes serao salvas no banco de dados.
                        </Text>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#f59e0b" />
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
                            <Feather name="droplet" size={16} color="#f59e0b" />
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
                        <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                            Valor anterior: {totalOriginal.toFixed(1)}L
                        </Text>
                    </View>

                    {total > 0 && (
                        <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
                            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Novo Total</Text>
                            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
                                <Text style={{ fontSize: 28, fontWeight: "700", color: "#d97706" }}>
                                    {total.toFixed(1)} L
                                </Text>
                                {diferenca !== 0 && (
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: "600",
                                        color: diferenca > 0 ? "#15803d" : "#dc2626",
                                        marginBottom: 4,
                                    }}>
                                        {diferenca > 0 ? "+" : ""}{diferenca.toFixed(1)} L
                                    </Text>
                                )}
                            </View>
                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                                Anterior: {totalOriginal.toFixed(1)} L
                            </Text>
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
                            <Feather name="edit-3" size={16} color="#f59e0b" />
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

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            onPress={handleCancel}
                            activeOpacity={0.7}
                            style={{
                                flex: 1,
                                backgroundColor: "#fff",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 14,
                                paddingVertical: 16,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ flex: 2 }}>
                            <LinearGradient
                                colors={["#f59e0b", "#d97706"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                            >
                                <Feather name="save" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Salvar Alteracoes</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
