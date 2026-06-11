import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Tanque } from "./estoque";
import { criarTanque, atualizarTanque } from "../../services/api";
import Toast from "react-native-toast-message";

export default function CadastrarTanque() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const tanqueEdicao: Tanque | undefined = route.params?.tanque;

    const [formData, setFormData] = useState({
        nome: "",
        capacidade: "",
        volumeAtual: "",
        localizacao: "",
        observacoes: "",
    });
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (tanqueEdicao) {
            setFormData({
                nome: tanqueEdicao.nome,
                capacidade: String(tanqueEdicao.capacidade),
                volumeAtual: String(tanqueEdicao.volumeAtual),
                localizacao: tanqueEdicao.localizacao || "",
                observacoes: tanqueEdicao.observacoes || "",
            });
        }
    }, [tanqueEdicao?.id]);

    const modoEdicao = !!tanqueEdicao;

    function handleCancelar() {
        if (salvando) return;
        navigation.goBack();
    }

    async function handleSubmit() {
        if (salvando) return;
        if (!formData.nome.trim() || !formData.capacidade || !formData.volumeAtual) {
            Toast.show({ type: "info", text1: "Atenção", text2: "Preencha os campos obrigatórios marcados com *.", position: "top", visibilityTime: 3000 });
            return;
        }

        const cap = parseFloat(formData.capacidade);
        const vol = parseFloat(formData.volumeAtual);

        if (isNaN(cap) || cap <= 0) {
            Toast.show({ type: "info", text1: "Atenção", text2: "Capacidade inválida.", position: "top", visibilityTime: 3000 });
            return;
        }
        if (isNaN(vol) || vol < 0) {
            Toast.show({ type: "info", text1: "Atenção", text2: "Volume atual inválido.", position: "top", visibilityTime: 3000 });
            return;
        }
        if (vol > cap) {
            Toast.show({ type: "info", text1: "Atenção", text2: "Volume atual não pode exceder a capacidade.", position: "top", visibilityTime: 3000 });
            return;
        }

        try {
            setSalvando(true);
            const dados = {
                nome: formData.nome.trim(),
                capacidade: cap,
                volumeAtual: vol,
                temperatura: tanqueEdicao?.temperatura ?? 0,
                localizacao: formData.localizacao.trim() || null,
                observacoes: formData.observacoes.trim() || null,
            };

            if (modoEdicao) {
                await atualizarTanque(tanqueEdicao.id, dados);
            } else {
                await criarTanque(dados);
            }

            Toast.show({
                type: "success",
                text1: modoEdicao ? "Tanque atualizado!" : "Tanque cadastrado!",
                text2: `${formData.nome} foi salvo com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro",
                text2: err.message || "Nao foi possivel salvar o tanque.",
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
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={modoEdicao ? ["#f59e0b", "#d97706"] : ["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={handleCancelar} disabled={salvando} style={{ padding: 4, opacity: salvando ? 0.65 : 1 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name={modoEdicao ? "edit-2" : "droplet"} size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    {modoEdicao ? "Editar Tanque" : "Novo Tanque"}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {modoEdicao ? "Atualize os dados do tanque" : "Cadastre um tanque de armazenamento"}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    <Campo icone="tag" label="Nome do Tanque *" valor={formData.nome} onChange={(v: string) => setFormData({ ...formData, nome: v })} placeholder="Ex: Tanque 1, Resfriador Principal" disabled={salvando} />

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Campo icone="layers" label="Capacidade (L) *" valor={formData.capacidade} onChange={(v: string) => setFormData({ ...formData, capacidade: v })} placeholder="1000" keyboard="decimal-pad" disabled={salvando} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Campo icone="droplet" label="Volume Atual (L) *" valor={formData.volumeAtual} onChange={(v: string) => setFormData({ ...formData, volumeAtual: v })} placeholder="0" keyboard="decimal-pad" disabled={salvando} />
                        </View>
                    </View>

                    <Campo icone="map-pin" label="Localizacao (Opcional)" valor={formData.localizacao} onChange={(v: string) => setFormData({ ...formData, localizacao: v })} placeholder="Ex: Sala de Ordenha, Deposito" disabled={salvando} />
                    <Campo icone="file-text" label="Observacoes (Opcional)" valor={formData.observacoes} onChange={(v: string) => setFormData({ ...formData, observacoes: v })} placeholder="Observacoes adicionais..." disabled={salvando} />

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity onPress={handleCancelar} activeOpacity={0.7} disabled={salvando} style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: salvando ? 0.65 : 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={salvando} style={{ flex: 2, opacity: salvando ? 0.78 : 1 }}>
                            <LinearGradient
                                colors={modoEdicao ? ["#f59e0b", "#d97706"] : ["#4a90e2", "#357abd"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                            >
                                {salvando ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Feather name="check" size={18} color="#fff" />
                                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                                            {modoEdicao ? "Salvar Alteracoes" : "Cadastrar"}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Campo({ icone, label, valor, onChange, placeholder, keyboard, disabled }: any) {
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
                editable={!disabled}
                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", opacity: disabled ? 0.65 : 1 }}
            />
        </View>
    );
}
