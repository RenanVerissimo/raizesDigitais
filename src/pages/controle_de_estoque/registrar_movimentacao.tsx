import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Movimentacao, Tanque, TipoMovimento } from "./estoque";


export default function registrar_movimentacao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const tanques: Tanque[] = route.params?.tanques || [];
    const agora = new Date();

    const [formData, setFormData] = useState({
        tanqueId: tanques[0]?.id || "",
        tipo: "entrada" as TipoMovimento,
        volume: "",
        data: agora.toISOString().split("T")[0],
        hora: agora.toTimeString().slice(0, 5),
        motivo: "",
        comprador: "",
        observacoes: "",
    });

    const tanqueSelecionado = tanques.find((t) => t.id === formData.tanqueId);

    function handleCancelar() {
        const temDados = formData.volume || formData.motivo;
        if (temDados) {
            Alert.alert("Cancelar", "Descartar informações?", [
                { text: "Continuar editando", style: "cancel" },
                { text: "Descartar", style: "destructive", onPress: () => navigation.goBack() },
            ]);
        } else {
            navigation.goBack();
        }
    }

    function handleSubmit() {
        if (!formData.tanqueId || !formData.volume || !formData.motivo.trim()) {
            Alert.alert("Atenção", "Preencha os campos obrigatórios marcados com *");
            return;
        }

        const vol = parseFloat(formData.volume);
        if (isNaN(vol) || vol <= 0) {
            Alert.alert("Atenção", "Volume inválido.");
            return;
        }

        if (!tanqueSelecionado) {
            Alert.alert("Erro", "Tanque não encontrado.");
            return;
        }

        const novoVolume = formData.tipo === "entrada"
            ? tanqueSelecionado.volumeAtual + vol
            : tanqueSelecionado.volumeAtual - vol;

        if (novoVolume < 0) {
            Alert.alert("Atenção", "Volume insuficiente no tanque!");
            return;
        }

        if (novoVolume > tanqueSelecionado.capacidade) {
            Alert.alert("Atenção", "Volume excede a capacidade do tanque!");
            return;
        }

        const mov: Movimentacao = {
            id: Date.now().toString(),
            tanqueId: tanqueSelecionado.id,
            tanqueNome: tanqueSelecionado.nome,
            tipo: formData.tipo,
            volume: vol,
            data: formData.data,
            hora: formData.hora,
            motivo: formData.motivo.trim(),
            comprador: formData.comprador.trim() || undefined,
            observacoes: formData.observacoes.trim() || undefined,
        };

        if (route.params?.onRegistrar) {
            route.params.onRegistrar(mov);
        }
        navigation.goBack();
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, backgroundColor: "#f5f7fa" }}
        >
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
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="trending-up" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Movimentação
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Entrada ou saída de leite
                            </Text>
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
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                                {tanques.map((t) => {
                                    const ativo = formData.tanqueId === t.id;
                                    return (
                                        <TouchableOpacity
                                            key={t.id}
                                            onPress={() => setFormData({ ...formData, tanqueId: t.id })}
                                            activeOpacity={0.7}
                                            style={{
                                                backgroundColor: ativo ? "#4a90e2" : "#f9fafb",
                                                borderWidth: 1,
                                                borderColor: ativo ? "#4a90e2" : "#e5e7eb",
                                                borderRadius: 10,
                                                paddingHorizontal: 14,
                                                paddingVertical: 10,
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#0a0a0a" }}>
                                                {t.nome}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: ativo ? "rgba(255,255,255,0.85)" : "#6b7280", marginTop: 2 }}>
                                                {t.volumeAtual.toFixed(1)} / {t.capacidade.toFixed(1)} L
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Tipo de Movimentação */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="repeat" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Tipo *</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setFormData({ ...formData, tipo: "entrada" })}
                                activeOpacity={0.7}
                                style={{
                                    flex: 1,
                                    backgroundColor: formData.tipo === "entrada" ? "#22c55e" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: formData.tipo === "entrada" ? "#22c55e" : "#e5e7eb",
                                    borderRadius: 10,
                                    paddingVertical: 12,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                <Feather name="trending-up" size={16} color={formData.tipo === "entrada" ? "#fff" : "#6b7280"} />
                                <Text style={{ fontSize: 14, fontWeight: "600", color: formData.tipo === "entrada" ? "#fff" : "#6b7280" }}>
                                    Entrada
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setFormData({ ...formData, tipo: "saida" })}
                                activeOpacity={0.7}
                                style={{
                                    flex: 1,
                                    backgroundColor: formData.tipo === "saida" ? "#ef4444" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: formData.tipo === "saida" ? "#ef4444" : "#e5e7eb",
                                    borderRadius: 10,
                                    paddingVertical: 12,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                <Feather name="trending-down" size={16} color={formData.tipo === "saida" ? "#fff" : "#6b7280"} />
                                <Text style={{ fontSize: 14, fontWeight: "600", color: formData.tipo === "saida" ? "#fff" : "#6b7280" }}>
                                    Saída
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Volume */}
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
                            style={{
                                backgroundColor: "#f9fafb",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 10,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                fontSize: 15,
                                color: "#0a0a0a",
                            }}
                        />
                        {tanqueSelecionado && formData.volume && !isNaN(parseFloat(formData.volume)) && (
                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                                Após movimentação: {(formData.tipo === "entrada"
                                    ? tanqueSelecionado.volumeAtual + parseFloat(formData.volume)
                                    : tanqueSelecionado.volumeAtual - parseFloat(formData.volume)
                                ).toFixed(1)} L
                            </Text>
                        )}
                    </View>

                    {/* Data e Hora */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                <Feather name="calendar" size={14} color="#4a90e2" />
                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Data *</Text>
                            </View>
                            <TextInput
                                value={formData.data}
                                onChangeText={(v) => setFormData({ ...formData, data: v })}
                                placeholder="AAAA-MM-DD"
                                placeholderTextColor="#9ca3af"
                                style={{
                                    backgroundColor: "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 12,
                                    fontSize: 14,
                                    color: "#0a0a0a",
                                }}
                            />
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                <Feather name="clock" size={14} color="#4a90e2" />
                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Hora *</Text>
                            </View>
                            <TextInput
                                value={formData.hora}
                                onChangeText={(v) => setFormData({ ...formData, hora: v })}
                                placeholder="HH:MM"
                                placeholderTextColor="#9ca3af"
                                style={{
                                    backgroundColor: "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 12,
                                    fontSize: 14,
                                    color: "#0a0a0a",
                                }}
                            />
                        </View>
                    </View>

                    {/* Motivo */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Motivo *</Text>
                        </View>
                        <TextInput
                            value={formData.motivo}
                            onChangeText={(v) => setFormData({ ...formData, motivo: v })}
                            placeholder="Ex: Coleta da manhã, Entrega, Transferência"
                            placeholderTextColor="#9ca3af"
                            style={{
                                backgroundColor: "#f9fafb",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 10,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                fontSize: 15,
                                color: "#0a0a0a",
                            }}
                        />
                    </View>

                    {/* Comprador (só aparece em saída) */}
                    {formData.tipo === "saida" && (
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
                                style={{
                                    backgroundColor: "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    borderRadius: 10,
                                    paddingHorizontal: 14,
                                    paddingVertical: 12,
                                    fontSize: 15,
                                    color: "#0a0a0a",
                                }}
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
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{
                                backgroundColor: "#f9fafb",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 10,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                fontSize: 15,
                                color: "#0a0a0a",
                                minHeight: 80,
                            }}
                        />
                    </View>

                    {/* Botões */}
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            onPress={handleCancelar}
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
                                colors={["#4a90e2", "#357abd"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    borderRadius: 14,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    gap: 8,
                                }}
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