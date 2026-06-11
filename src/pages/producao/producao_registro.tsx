import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
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
import { criarProducao, atualizarProducao, listarProducoes } from "../../services/api";
import { Producao } from "../../interfaces/interfaces";
import Toast from "react-native-toast-message";
import DateInput from "../../components/DateInput";
import { toBr, toIso } from "../../utils/formatters";

function dataLocalTexto(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

export default function ProducaoRegistro() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const producaoEditando: Producao | undefined = route.params?.producao;
    const isEditando = !!producaoEditando;
    const [formData, setFormData] = useState({
        date: toBr(producaoEditando?.data ?? dataLocalTexto()),
        dailyProduction: producaoEditando?.producao_diaria?.toString() ?? "",
        notes: producaoEditando?.observacoes ?? "",
    });
    const [salvando, setSalvando] = useState(false);
    const enviandoRef = useRef(false);

    const total = parseFloat(formData.dailyProduction) || 0;

    function iniciarEnvio() {
        if (enviandoRef.current) return false;
        enviandoRef.current = true;
        setSalvando(true);
        return true;
    }

    function finalizarEnvio() {
        enviandoRef.current = false;
        setSalvando(false);
    }

    function aguardar(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function normalizarData(data: string | Date | null | undefined) {
        if (!data) return "";
        return String(data).slice(0, 10);
    }

    function normalizarObservacao(observacao: string | null | undefined) {
        const texto = String(observacao ?? "").trim();
        return texto || null;
    }

    function isErroConexaoLenta(error: any) {
        return String(error?.message || error || "").includes("conexão demorou demais ou caiu");
    }

    function producaoConfere(producao: Producao, params: { date: string; dailyProduction: number; notes: string | null }) {
        return (
            normalizarData(producao.data) === params.date &&
            Math.abs(Number(producao.producao_diaria) - params.dailyProduction) < 0.001 &&
            normalizarObservacao(producao.observacoes) === normalizarObservacao(params.notes)
        );
    }

    async function coletaFoiSalva(params: { date: string; dailyProduction: number; notes: string | null }, producaoId?: number) {
        for (let tentativa = 0; tentativa < 3; tentativa++) {
            try {
                const producoes = await listarProducoes({ silentNetworkError: true });
                const encontrada = producoes.some((producao: Producao) => {
                    if (producaoId && Number(producao.id) !== producaoId) return false;
                    return producaoConfere(producao, params);
                });

                if (encontrada) return true;
            } catch {
                // Se a listagem tambem falhar, tentamos de novo antes de mostrar erro ao usuario.
            }

            await aguardar(1200);
        }

        return false;
    }

    function mostrarSucesso() {
        Toast.show({
            type: "success",
            text1: isEditando ? "Produção atualizada!" : "Produção registrada!",
            text2: isEditando
                ? "As alteracoes foram salvas."
                : "Sua coleta foi salva com sucesso.",
            position: "top",
            visibilityTime: 3500,
        });
    }

    async function handleSubmit() {
        if (!iniciarEnvio()) return;

        if (!formData.dailyProduction.trim()) {
            Alert.alert("Atenção", "Preencha a produção diária.");
            finalizarEnvio();
            return;
        }

        const dailyProduction = Number(formData.dailyProduction);
        if (isNaN(dailyProduction) || dailyProduction <= 0) {
            Alert.alert("Atenção", "A produção diária deve ser maior que 0.");
            finalizarEnvio();
            return;
        }

        const dataIso = toIso(formData.date);
        if (!dataIso) {
            Alert.alert("Atenção", "Informe uma data válida (DD/MM/AAAA).");
            finalizarEnvio();
            return;
        }

        const dados = {
            date: dataIso,
            dailyProduction,
            notes: formData.notes.trim() || null,
        };

        try {
            if (isEditando) {
                await atualizarProducao(producaoEditando!.id, dados);
            } else {
                await criarProducao(dados);
            }

            mostrarSucesso();

            if (!isEditando) {
                setFormData({
                    date: toBr(dataLocalTexto()),
                    dailyProduction: "",
                    notes: "",
                });
            }

            setTimeout(() => {
                finalizarEnvio();
                navigation.goBack();
            }, 500);
        } catch (error: any) {
            if (await coletaFoiSalva(dados, producaoEditando?.id)) {
                mostrarSucesso();

                setTimeout(() => {
                    finalizarEnvio();
                    navigation.goBack();
                }, 500);
                return;
            }

            if (isEditando && isErroConexaoLenta(error)) {
                mostrarSucesso();

                setTimeout(() => {
                    finalizarEnvio();
                    navigation.goBack();
                }, 500);
                return;
            }

            console.error(error);
            Toast.show({
                type: "error",
                text1: isEditando ? "Erro ao atualizar" : "Erro ao registrar",
                text2: error.message || "A conexão demorou demais ou caiu. Tente novamente em alguns instantes.",
                position: "top",
                visibilityTime: 3000,
            });
            finalizarEnvio();
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
                        <TouchableOpacity onPress={() => {
                            if (salvando || enviandoRef.current) return;
                            navigation.goBack();
                        }} disabled={salvando} style={{ padding: 4, opacity: salvando ? 0.65 : 1 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                {isEditando ? "Editar Coleta" : "Nova Coleta"}
                            </Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {isEditando ? "Atualize os dados da produção" : "Registre a produção diária"}
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
                        <DateInput
                            value={formData.date}
                            onChange={(v) => {
                                if (salvando || enviandoRef.current) return;
                                setFormData({ ...formData, date: v });
                            }}
                        />
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="droplet" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Produção diária (litros)</Text>
                        </View>
                        <TextInput
                            value={formData.dailyProduction}
                            onChangeText={(v) => setFormData({ ...formData, dailyProduction: v })}
                            editable={!salvando}
                            placeholder="Ex: 45.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {total > 0 && (
                        <View style={{ backgroundColor: "rgba(74,144,226,0.1)", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "rgba(74,144,226,0.2)" }}>
                            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Produção diária</Text>
                            <Text style={{ fontSize: 28, fontWeight: "700", color: "#4a90e2" }}>{total.toFixed(1)} L</Text>
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="edit-3" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Observações</Text>
                        </View>
                        <TextInput
                            value={formData.notes}
                            onChangeText={(v) => setFormData({ ...formData, notes: v })}
                            editable={!salvando}
                            placeholder="Anotações sobre a coleta..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 80 }}
                        />
                    </View>

                    <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={salvando} style={{ marginBottom: insets.bottom + 20 }}>
                        <LinearGradient
                            colors={["#4a90e2", "#357abd"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 14, paddingVertical: 16, minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: salvando ? 0.78 : 1 }}
                        >
                            {salvando ? (
                                <>
                                    <ActivityIndicator color="#fff" />
                                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Salvando...</Text>
                                </>
                            ) : (
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                                    {isEditando ? "Atualizar Registro" : "Salvar Registro"}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
