import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Tanque, TipoMovimento } from "./estoque";
import { criarMovimentacao } from "../../services/api";
import Toast from "react-native-toast-message";
import DateInput from "../../components/DateInput";
import { toIso, toBr } from "../../utils/formatters";

export default function RegistrarMovimentacao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const tanques: Tanque[] = route.params?.tanques || [];
    const agora = new Date();
    const dd = String(agora.getDate()).padStart(2, "0");
    const mm = String(agora.getMonth() + 1).padStart(2, "0");
    const yyyy = agora.getFullYear();

    const [formData, setFormData] = useState({
        tanqueId: tanques[0]?.id ? String(tanques[0].id) : "",
        tipo: "saida" as TipoMovimento,
        volume: "",
        data: `${dd}/${mm}/${yyyy}`,
        motivo: "",
        comprador: "",
        temperatura: "",
        consumoProprio: "",
        destinoSaida: "entrega" as "entrega" | "consumo_proprio",
        observacoes: "",
    });

    const tanqueSelecionado = tanques.find((t) => String(t.id) === formData.tanqueId);
    const ehConsumoProprio = formData.destinoSaida === "consumo_proprio";
    const ehEntrega = formData.destinoSaida === "entrega";
    const volumePreview = parseFloat(formData.volume || "0");
    const consumoPreview = parseFloat(formData.consumoProprio || "0");
    const mostrarPreviewEntrega = !!tanqueSelecionado && (!!formData.volume || !!formData.consumoProprio) && !isNaN(volumePreview) && !isNaN(consumoPreview);
    const mostrarPreviewConsumo = !!tanqueSelecionado && !!formData.consumoProprio && !isNaN(consumoPreview);

    function handleCancelar() {
        navigation.goBack();
    }

    async function handleSubmit() {
        const motivo = formData.motivo.trim() || (ehConsumoProprio ? "Consumo próprio" : "");
        if (!formData.tanqueId || !motivo) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Preencha os campos obrigatórios.", position: "top", visibilityTime: 3000 });
            return;
        }

        const vol = parseFloat(formData.volume || "0");
        const consumoProprio = parseFloat(formData.consumoProprio || "0");
        if (isNaN(vol) || vol < 0) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Volume inválido.", position: "top", visibilityTime: 3000 });
            return;
        }
        if (isNaN(consumoProprio) || consumoProprio < 0) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Consumo próprio inválido.", position: "top", visibilityTime: 3000 });
            return;
        }
        if (vol + consumoProprio <= 0) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Informe pelo menos um volume maior que 0.", position: "top", visibilityTime: 3000 });
            return;
        }

        const dataIso = toIso(formData.data);
        if (!dataIso) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Informe uma data válida (DD/MM/AAAA).", position: "top", visibilityTime: 3000 });
            return;
        }

        const temperatura = formData.temperatura.trim() ? parseFloat(formData.temperatura) : null;
        if (temperatura !== null && (isNaN(temperatura) || temperatura < 0)) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Informe uma temperatura válida.", position: "top", visibilityTime: 3000 });
            return;
        }

        try {
            await criarMovimentacao({
                tanqueId: Number(formData.tanqueId),
                tipo: formData.tipo,
                volume: vol,
                data: dataIso,
                motivo,
                comprador: ehEntrega ? formData.comprador.trim() || null : null,
                temperatura: ehEntrega ? temperatura : null,
                consumoProprio,
                observacoes: formData.observacoes.trim() || null,
            });

            Toast.show({
                type: "success",
                text1: "Movimentação registrada!",
                text2: `Saída de ${vol + consumoProprio}L registrada com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro",
                text2: err.message || "Não foi possível registrar a movimentação.",
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
                                <Feather name="trending-up" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Movimentação</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Saída de leite do estoque</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    {/* Selecionar Tanque */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="database" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Tanque *</Text>
                        </View>
                        {tanques.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#9ca3af" }}>Nenhum tanque cadastrado.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    {tanques.map((t) => {
                                        const ativo = String(t.id) === formData.tanqueId;
                                        return (
                                            <TouchableOpacity
                                                key={t.id}
                                                onPress={() => setFormData({ ...formData, tanqueId: String(t.id) })}
                                                activeOpacity={0.7}
                                                style={{ backgroundColor: ativo ? "#4a90e2" : "#f9fafb", borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
                                            >
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#0a0a0a" }}>{t.nome}</Text>
                                                <Text style={{ fontSize: 10, color: ativo ? "rgba(255,255,255,0.85)" : "#6b7280", marginTop: 2 }}>
                                                    {t.volumeAtual.toFixed(1)} / {t.capacidade.toFixed(1)} L
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    {/* Destino da saída */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="map-pin" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Destino da saída *</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {[
                                { key: "entrega" as const, label: "Entrega/Venda", icon: "truck" as const },
                                { key: "consumo_proprio" as const, label: "Consumo próprio", icon: "home" as const },
                            ].map((destino) => {
                                const ativo = formData.destinoSaida === destino.key;
                                return (
                                    <TouchableOpacity
                                        key={destino.key}
                                        activeOpacity={0.75}
                                        onPress={() => setFormData({
                                            ...formData,
                                            destinoSaida: destino.key,
                                            volume: destino.key === "consumo_proprio" ? "" : formData.volume,
                                            consumoProprio: destino.key === "entrega" ? "" : formData.consumoProprio,
                                            temperatura: destino.key === "consumo_proprio" ? "" : formData.temperatura,
                                            comprador: destino.key === "consumo_proprio" ? "" : formData.comprador,
                                            motivo: destino.key === "consumo_proprio" && !formData.motivo.trim() ? "Consumo próprio" : formData.motivo,
                                        })}
                                        style={{ flex: 1, backgroundColor: ativo ? "#4a90e2" : "#f9fafb", borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", borderRadius: 10, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                                    >
                                        <Feather name={destino.icon} size={16} color={ativo ? "#fff" : "#6b7280"} />
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#6b7280" }}>{destino.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Volume */}
                    {!ehConsumoProprio ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="droplet" size={16} color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Volume (L) *</Text>
                            </View>
                            <TextInput
                                value={formData.volume}
                                onChangeText={(v) => setFormData({ ...formData, volume: v })}
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                                keyboardType="decimal-pad"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                            {mostrarPreviewEntrega ? (
                                <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                                    Após movimentação: {(tanqueSelecionado!.volumeAtual - volumePreview - consumoPreview).toFixed(1)} L
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    {/* Consumo próprio */}
                    {ehConsumoProprio && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="home" size={16} color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                    Consumo próprio (L)
                                </Text>
                            </View>
                            <TextInput
                                value={formData.consumoProprio}
                                onChangeText={(v) => setFormData({ ...formData, consumoProprio: v })}
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                                keyboardType="decimal-pad"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                            {mostrarPreviewConsumo ? (
                                <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                                    Após movimentação: {(tanqueSelecionado!.volumeAtual - consumoPreview).toFixed(1)} L
                                </Text>
                            ) : null}
                        </View>
                    )}

                    {/* Data */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Data *</Text>
                        </View>
                        <DateInput
                            value={formData.data}
                            onChange={(v) => setFormData({ ...formData, data: v })}
                        />
                    </View>

                    {/* Temperatura (só em entrega/saída) */}
                    {ehEntrega && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="thermometer" size={16} color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                    Temperatura na entrega (°C) <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                                </Text>
                            </View>
                            <TextInput
                                value={formData.temperatura}
                                onChangeText={(v) => setFormData({ ...formData, temperatura: v })}
                                placeholder={tanqueSelecionado ? tanqueSelecionado.temperatura.toFixed(1) : "3.5"}
                                placeholderTextColor="#9ca3af"
                                keyboardType="decimal-pad"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                        </View>
                    )}

                    {/* Motivo */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Motivo {ehConsumoProprio ? <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text> : null}
                            </Text>
                        </View>
                        <TextInput
                            value={formData.motivo}
                            onChangeText={(v) => setFormData({ ...formData, motivo: v })}
                            placeholder={ehConsumoProprio ? "Consumo próprio" : "Ex: Coleta da manhã, Entrega, Transferência"}
                            placeholderTextColor="#9ca3af"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* Comprador (só em saída) */}
                    {ehEntrega && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="user" size={16} color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                    Comprador <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                                </Text>
                            </View>
                            <TextInput
                                value={formData.comprador}
                                onChangeText={(v) => setFormData({ ...formData, comprador: v })}
                                placeholder="Ex: Laticínio Bom Leite"
                                placeholderTextColor="#9ca3af"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                        </View>
                    )}

                    {/* Observações */}
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

                    {/* Botões */}
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity onPress={handleCancelar} activeOpacity={0.7} style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ flex: 2 }}>
                            <LinearGradient
                                colors={["#4a90e2", "#357abd"]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                            >
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Registrar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
