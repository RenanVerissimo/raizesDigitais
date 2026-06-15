import React, { useCallback, useRef, useState } from "react";
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
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { criarProducao, atualizarProducao, listarProducoes, listarTanques } from "../../services/api";
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

type TanqueColeta = {
    id: number;
    nome: string;
    capacidade: number;
    volumeAtual: number;
};

export default function ProducaoRegistro() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const producaoEditando: Producao | undefined = route.params?.producao;
    const isEditando = !!producaoEditando;
    const [formData, setFormData] = useState({
        date: toBr(producaoEditando?.data ?? dataLocalTexto()),
        dailyProduction: producaoEditando?.producao_diaria?.toString() ?? "",
        tanqueId: producaoEditando?.tanqueId ? String(producaoEditando.tanqueId) : "",
        notes: producaoEditando?.observacoes ?? "",
    });
    const [tanques, setTanques] = useState<TanqueColeta[]>([]);
    const [carregandoTanques, setCarregandoTanques] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const enviandoRef = useRef(false);

    const total = parseFloat(formData.dailyProduction) || 0;
    const tanqueSelecionado = tanques.find((tanque) => String(tanque.id) === formData.tanqueId);
    const volumeBaseColeta = tanqueSelecionado
        ? isEditando && Number(producaoEditando?.tanqueId || 0) === tanqueSelecionado.id
            ? tanqueSelecionado.volumeAtual - Number(producaoEditando?.producao_diaria || 0)
            : tanqueSelecionado.volumeAtual
        : 0;
    const volumeAposColeta = volumeBaseColeta + total;

    useFocusEffect(useCallback(() => {
        let ativo = true;

        async function carregarTanques() {
            try {
                setCarregandoTanques(true);
                const dados = await listarTanques({ silentNetworkError: true });
                if (!ativo) return;
                setTanques(dados);
                setFormData((atual) => ({
                    ...atual,
                    tanqueId: atual.tanqueId || (dados[0]?.id ? String(dados[0].id) : ""),
                }));
            } catch (err: any) {
                if (!ativo) return;
                Toast.show({
                    type: "error",
                    text1: "Erro ao carregar tanques",
                    text2: err.message || "Não foi possível carregar os tanques.",
                    position: "top",
                    visibilityTime: 3000,
                });
            } finally {
                if (ativo) setCarregandoTanques(false);
            }
        }

        carregarTanques();

        return () => {
            ativo = false;
        };
    }, []));

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
        const mensagem = String(error?.message || error || "").toLowerCase();
        return (
            mensagem.includes("conexão instável") ||
            mensagem.includes("conexao instavel") ||
            mensagem.includes("network request failed") ||
            mensagem.includes("conexão demorou demais") ||
            mensagem.includes("conexao demorou demais")
        );
    }

    function producaoConfere(producao: Producao, params: { date: string; dailyProduction: number; tanqueId: number; notes: string | null }) {
        const tanqueConfere = producao.tanqueId === null || producao.tanqueId === undefined || Number(producao.tanqueId) === params.tanqueId;
        return (
            normalizarData(producao.data) === params.date &&
            Math.abs(Number(producao.producao_diaria) - params.dailyProduction) < 0.001 &&
            tanqueConfere &&
            normalizarObservacao(producao.observacoes) === normalizarObservacao(params.notes)
        );
    }

    async function coletaFoiSalva(params: { date: string; dailyProduction: number; tanqueId: number; notes: string | null }, producaoId?: number) {
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

        if (!formData.tanqueId) {
            Alert.alert("Atenção", "Selecione o tanque que recebeu a coleta.");
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

        if (tanqueSelecionado && volumeAposColeta > tanqueSelecionado.capacidade) {
            const excedente = volumeAposColeta - tanqueSelecionado.capacidade;
            Toast.show({
                type: "info",
                text1: "Capacidade do tanque excedida",
                text2: `A coleta ultrapassa o tanque em ${excedente.toFixed(1)} L. Após a coleta: ${volumeAposColeta.toFixed(1)} L de ${tanqueSelecionado.capacidade.toFixed(1)} L.`,
                position: "top",
                visibilityTime: 4500,
            });
            finalizarEnvio();
            return;
        }

        const dados = {
            date: dataIso,
            dailyProduction,
            tanqueId: Number(formData.tanqueId),
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
                    tanqueId: formData.tanqueId,
                    notes: "",
                });
            }

            setTimeout(() => {
                finalizarEnvio();
                navigation.goBack();
            }, 500);
        } catch (error: any) {
            if (await coletaFoiSalva(dados, producaoEditando?.id) || isErroConexaoLenta(error)) {
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
                            <Feather name="database" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Tanque da coleta *</Text>
                        </View>
                        {carregandoTanques ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <ActivityIndicator size="small" color="#4a90e2" />
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Carregando tanques</Text>
                            </View>
                        ) : tanques.length === 0 ? (
                            <View style={{ gap: 10 }}>
                                <Text style={{ fontSize: 13, color: "#9ca3af", lineHeight: 19 }}>
                                    Nenhum tanque cadastrado. Cadastre um tanque no estoque de leite antes de registrar a coleta.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("cadastar_tanque")}
                                    activeOpacity={0.8}
                                    style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 }}
                                >
                                    <Feather name="plus-circle" size={15} color="#4a90e2" />
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#4a90e2" }}>
                                        Cadastrar novo tanque
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: "row", gap: 8 }}>
                                        {tanques.map((tanque) => {
                                            const ativo = String(tanque.id) === formData.tanqueId;
                                            const ocupacao = tanque.capacidade > 0 ? (tanque.volumeAtual / tanque.capacidade) * 100 : 0;
                                            return (
                                                <TouchableOpacity
                                                    key={tanque.id}
                                                    onPress={() => {
                                                        if (salvando || enviandoRef.current) return;
                                                        setFormData({ ...formData, tanqueId: String(tanque.id) });
                                                    }}
                                                    activeOpacity={0.75}
                                                    disabled={salvando}
                                                    style={{
                                                        minWidth: 132,
                                                        backgroundColor: ativo ? "#4a90e2" : "#f9fafb",
                                                        borderWidth: 1,
                                                        borderColor: ativo ? "#4a90e2" : "#e5e7eb",
                                                        borderRadius: 10,
                                                        paddingHorizontal: 14,
                                                        paddingVertical: 10,
                                                        opacity: salvando ? 0.65 : 1,
                                                    }}
                                                >
                                                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: ativo ? "#fff" : "#0a0a0a" }}>
                                                        {tanque.nome}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: ativo ? "rgba(255,255,255,0.85)" : "#6b7280", marginTop: 2 }}>
                                                        {tanque.volumeAtual.toFixed(1)} / {tanque.capacidade.toFixed(1)} L
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: ativo ? "rgba(255,255,255,0.85)" : "#9ca3af", marginTop: 2 }}>
                                                        {ocupacao.toFixed(0)}% ocupado
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                                {tanqueSelecionado && total > 0 ? (
                                    <View style={{
                                        marginTop: 12,
                                        backgroundColor: volumeAposColeta > tanqueSelecionado.capacidade ? "#fef2f2" : "#f0fdf4",
                                        borderWidth: 1,
                                        borderColor: volumeAposColeta > tanqueSelecionado.capacidade ? "#fecaca" : "#bbf7d0",
                                        borderRadius: 10,
                                        padding: 10,
                                    }}>
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: volumeAposColeta > tanqueSelecionado.capacidade ? "#b91c1c" : "#15803d" }}>
                                            Após a coleta: {volumeAposColeta.toFixed(1)} L
                                        </Text>
                                        <Text style={{ fontSize: 11, color: volumeAposColeta > tanqueSelecionado.capacidade ? "#b91c1c" : "#166534", marginTop: 2 }}>
                                            Capacidade do tanque: {tanqueSelecionado.capacidade.toFixed(1)} L
                                        </Text>
                                    </View>
                                ) : null}
                            </>
                        )}
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

                    <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={salvando || carregandoTanques || tanques.length === 0} style={{ marginBottom: insets.bottom + 20 }}>
                        <LinearGradient
                            colors={["#4a90e2", "#357abd"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 14, paddingVertical: 16, minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: salvando || carregandoTanques || tanques.length === 0 ? 0.78 : 1 }}
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
