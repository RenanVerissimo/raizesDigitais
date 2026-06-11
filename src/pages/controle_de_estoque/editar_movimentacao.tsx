import React, { useCallback, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import DateInput from "../../components/DateInput";
import { toBr, toIso } from "../../utils/formatters";
import { atualizarMovimentacao, listarTanques } from "../../services/api";
import { Movimentacao, Tanque, TipoMovimento } from "./estoque";

export default function EditarMovimentacao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const movimentacao: Movimentacao | undefined = route.params?.movimentacao;

    const [tanques, setTanques] = useState<Tanque[]>([]);
    const [formData, setFormData] = useState({
        tanqueId: movimentacao ? String(movimentacao.tanqueId) : "",
        tipo: (movimentacao?.tipo || "entrada") as TipoMovimento,
        volume: movimentacao ? String(movimentacao.volume || "") : "",
        data: movimentacao ? toBr(movimentacao.data) : "",
        motivo: movimentacao?.motivo || "",
        comprador: movimentacao?.comprador || "",
        temperatura: movimentacao?.temperatura !== null && movimentacao?.temperatura !== undefined ? String(movimentacao.temperatura) : "",
        consumoProprio: Number(movimentacao?.consumoProprio || 0) > 0 ? String(movimentacao?.consumoProprio) : "",
        observacoes: movimentacao?.observacoes || "",
    });
    const [carregandoTanques, setCarregandoTanques] = useState(true);
    const [salvando, setSalvando] = useState(false);

    useFocusEffect(
        useCallback(() => {
            async function carregarTanques() {
                setCarregandoTanques(true);
                try {
                    const dados = await listarTanques({ silentNetworkError: true });
                    setTanques(dados);
                } catch (err: any) {
                    Toast.show({ type: "error", text1: "Erro ao carregar tanques", text2: err.message || "Não foi possível carregar os tanques.", position: "top", visibilityTime: 3000 });
                } finally {
                    setCarregandoTanques(false);
                }
            }

            carregarTanques();
        }, [])
    );

    async function handleSubmit() {
        if (salvando) return;
        if (!movimentacao) {
            Toast.show({ type: "error", text1: "Movimentação não encontrada", position: "top" });
            return;
        }

        const dataIso = toIso(formData.data);
        const volume = parseFloat(formData.volume || "0");
        const consumoProprio = formData.tipo === "saida" ? parseFloat(formData.consumoProprio || "0") : 0;
        const temperatura = formData.temperatura.trim() ? parseFloat(formData.temperatura) : null;

        if (!formData.tanqueId || !formData.motivo.trim() || !dataIso) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Preencha tanque, data e motivo.", position: "top" });
            return;
        }

        if (isNaN(volume) || volume < 0 || isNaN(consumoProprio) || consumoProprio < 0) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Informe volumes válidos.", position: "top" });
            return;
        }

        if ((formData.tipo === "entrada" && volume <= 0) || (formData.tipo === "saida" && volume + consumoProprio <= 0)) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Informe pelo menos um volume maior que 0.", position: "top" });
            return;
        }

        if (temperatura !== null && isNaN(temperatura)) {
            Toast.show({ type: "error", text1: "Atenção", text2: "Informe uma temperatura válida.", position: "top" });
            return;
        }

        try {
            setSalvando(true);
            await atualizarMovimentacao(movimentacao.id, {
                tanqueId: Number(formData.tanqueId),
                tipo: formData.tipo,
                volume,
                data: dataIso,
                motivo: formData.motivo.trim(),
                comprador: formData.tipo === "saida" ? formData.comprador.trim() || null : null,
                temperatura: formData.tipo === "saida" ? temperatura : null,
                consumoProprio: formData.tipo === "saida" ? consumoProprio : 0,
                observacoes: formData.observacoes.trim() || null,
            });

            Toast.show({ type: "success", text1: "Movimentação atualizada", position: "top" });
            setTimeout(() => navigation.goBack(), 400);
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao atualizar",
                text2: err.message || "Não foi possível atualizar.",
                position: "top",
                visibilityTime: 3000,
            });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => !salvando && navigation.goBack()} disabled={salvando} style={{ padding: 4, opacity: salvando ? 0.65 : 1 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Editar Movimentação</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Ajuste entrada ou saída de leite
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 24 }}>
                    <Campo label="Tanque">
                        {carregandoTanques ? (
                            <View style={{ alignItems: "center", paddingVertical: 16 }}>
                                <ActivityIndicator color="#4a90e2" />
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Carregando tanques</Text>
                            </View>
                        ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                                {tanques.map((t) => {
                                    const ativo = String(t.id) === formData.tanqueId;
                                    return (
                                        <TouchableOpacity
                                            key={t.id}
                                            onPress={() => {
                                                if (salvando) return;
                                                setFormData({ ...formData, tanqueId: String(t.id) });
                                            }}
                                            disabled={salvando}
                                            style={{ backgroundColor: ativo ? "#4a90e2" : "#fff", borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, opacity: salvando ? 0.65 : 1 }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: "700", color: ativo ? "#fff" : "#0a0a0a" }}>{t.nome}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        )}
                    </Campo>

                    <Campo label="Tipo">
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {(["entrada", "saida"] as TipoMovimento[]).map((tipo) => {
                                const ativo = formData.tipo === tipo;
                                const cor = tipo === "entrada" ? "#22c55e" : "#ef4444";
                                return (
                                    <TouchableOpacity
                                        key={tipo}
                                        onPress={() => {
                                            if (salvando) return;
                                            setFormData({ ...formData, tipo });
                                        }}
                                        disabled={salvando}
                                        style={{ flex: 1, backgroundColor: ativo ? cor : "#fff", borderWidth: 1, borderColor: ativo ? cor : "#e5e7eb", borderRadius: 10, paddingVertical: 12, alignItems: "center", opacity: salvando ? 0.65 : 1 }}
                                    >
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: ativo ? "#fff" : "#6b7280" }}>
                                            {tipo === "entrada" ? "Entrada" : "Saída"}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Campo>

                    <Campo label="Volume (L)">
                        <Input value={formData.volume} onChangeText={(v) => setFormData({ ...formData, volume: v })} keyboardType="decimal-pad" editable={!salvando} />
                    </Campo>

                    {formData.tipo === "saida" && (
                        <Campo label="Consumo próprio (L)">
                            <Input value={formData.consumoProprio} onChangeText={(v) => setFormData({ ...formData, consumoProprio: v })} keyboardType="decimal-pad" placeholder="0" editable={!salvando} />
                        </Campo>
                    )}

                    <Campo label="Data">
                        <DateInput value={formData.data} onChange={(v) => !salvando && setFormData({ ...formData, data: v })} />
                    </Campo>

                    {formData.tipo === "saida" && (
                        <>
                            <Campo label="Comprador">
                                <Input value={formData.comprador} onChangeText={(v) => setFormData({ ...formData, comprador: v })} placeholder="Opcional" editable={!salvando} />
                            </Campo>
                            <Campo label="Temperatura (°C)">
                                <Input value={formData.temperatura} onChangeText={(v) => setFormData({ ...formData, temperatura: v })} placeholder="Opcional" keyboardType="decimal-pad" editable={!salvando} />
                            </Campo>
                        </>
                    )}

                    <Campo label="Motivo">
                        <Input value={formData.motivo} onChangeText={(v) => setFormData({ ...formData, motivo: v })} editable={!salvando} />
                    </Campo>

                    <Campo label="Observações">
                        <Input value={formData.observacoes} onChangeText={(v) => setFormData({ ...formData, observacoes: v })} placeholder="Opcional" multiline editable={!salvando} />
                    </Campo>

                    <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={salvando || carregandoTanques} style={{ opacity: salvando || carregandoTanques ? 0.78 : 1 }}>
                        <LinearGradient
                            colors={["#4a90e2", "#357abd"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 14, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                        >
                            {salvando ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Feather name="check" size={18} color="#fff" />
                                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>Salvar alterações</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#0a0a0a", marginBottom: 8 }}>{label}</Text>
            {children}
        </View>
    );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
    return (
        <TextInput
            placeholderTextColor="#9ca3af"
            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: props.multiline ? 78 : undefined }}
            {...props}
        />
    );
}
