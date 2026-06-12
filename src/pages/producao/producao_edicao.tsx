import React, { useEffect, useRef, useState } from "react";
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
import { atualizarProducao, listarProducoes, listarTanques } from "../../services/api";
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

type TanqueColeta = {
    id: number;
    nome: string;
    capacidade: number;
    volumeAtual: number;
};

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
        tanqueId: producao.tanqueId ? String(producao.tanqueId) : "",
        notes: producao.observacoes ?? "",
    });
    const [tanques, setTanques] = useState<TanqueColeta[]>([]);
    const [carregandoTanques, setCarregandoTanques] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const enviandoRef = useRef(false);

    const total = parseFloat(formData.dailyProduction) || 0;
    const diferenca = total - totalOriginal;
    const tanqueSelecionado = tanques.find((tanque) => String(tanque.id) === formData.tanqueId);
    const volumeBaseColeta = tanqueSelecionado
        ? Number(producao.tanqueId || 0) === tanqueSelecionado.id
            ? tanqueSelecionado.volumeAtual - Number(producao.producao_diaria || 0)
            : tanqueSelecionado.volumeAtual
        : 0;
    const volumeAposColeta = volumeBaseColeta + total;

    useEffect(() => {
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
    }, []);

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

    function aguardar(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function producaoFoiAtualizada(params: { date: string; dailyProduction: number; tanqueId: number; notes: string | null }) {
        for (let tentativa = 0; tentativa < 3; tentativa++) {
            try {
                const producoes = await listarProducoes({ silentNetworkError: true });
                const encontrada = producoes.some((item: Producao) => {
                    const tanqueConfere = item.tanqueId === null || item.tanqueId === undefined || Number(item.tanqueId) === params.tanqueId;
                    return (
                        Number(item.id) === Number(producao.id) &&
                        normalizarData(item.data) === params.date &&
                        Math.abs(Number(item.producao_diaria) - params.dailyProduction) < 0.001 &&
                        tanqueConfere &&
                        normalizarObservacao(item.observacoes) === normalizarObservacao(params.notes)
                    );
                });

                if (encontrada) return true;
            } catch {
                // Se a verificacao cair junto com a resposta do PUT, tentamos novamente antes do alerta.
            }

            await aguardar(1200);
        }

        return false;
    }

    function mostrarSucesso() {
        Toast.show({
            type: "success",
            text1: "Producao atualizada!",
            text2: "As alteracoes foram salvas.",
            position: "top",
            visibilityTime: 3000,
        });
    }

    async function handleSubmit() {
        if (!iniciarEnvio()) return;

        if (!formData.dailyProduction.trim()) {
            Alert.alert("Atencao", "Preencha a Producao Diaria.");
            finalizarEnvio();
            return;
        }

        if (!formData.tanqueId) {
            Alert.alert("Atencao", "Selecione o tanque da coleta.");
            finalizarEnvio();
            return;
        }

        const dailyProduction = Number(formData.dailyProduction);
        if (isNaN(dailyProduction) || dailyProduction <= 0) {
            Alert.alert("Atencao", "A Producao Diaria deve ser maior que 0.");
            finalizarEnvio();
            return;
        }

        if (tanqueSelecionado && volumeAposColeta > tanqueSelecionado.capacidade) {
            Alert.alert("Atencao", "A quantidade informada excede a capacidade disponível do tanque selecionado.");
            finalizarEnvio();
            return;
        }

        const dados = {
            date: formData.date,
            dailyProduction,
            tanqueId: Number(formData.tanqueId),
            notes: formData.notes.trim() || null,
        };

        try {
            await atualizarProducao(producao.id, dados);

            mostrarSucesso();

            setTimeout(() => {
                finalizarEnvio();
                navigation.replace("ProducaoHistorico");
            }, 500);
        } catch (error: any) {
            if (await producaoFoiAtualizada(dados) || isErroConexaoLenta(error)) {
                mostrarSucesso();

                setTimeout(() => {
                    finalizarEnvio();
                    navigation.replace("ProducaoHistorico");
                }, 500);
                return;
            }

            console.error(error);
            Alert.alert("Erro", "Nao foi possivel atualizar a producao. Tente novamente.");
            finalizarEnvio();
        }
    }

    function handleCancel() {
        if (salvando) return;
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
                        <TouchableOpacity
                            onPress={() => {
                                if (!salvando) navigation.replace("ProducaoHistorico");
                            }}
                            disabled={salvando}
                            style={{ padding: 4, opacity: salvando ? 0.5 : 1 }}
                        >
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
                            <Feather name="database" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Tanque da coleta *</Text>
                        </View>
                        {carregandoTanques ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <ActivityIndicator size="small" color="#f59e0b" />
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>Carregando tanques</Text>
                            </View>
                        ) : tanques.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#9ca3af" }}>
                                Nenhum tanque cadastrado. Cadastre um tanque no estoque de leite antes de editar a coleta.
                            </Text>
                        ) : (
                            <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: "row", gap: 8 }}>
                                        {tanques.map((tanque) => {
                                            const ativo = String(tanque.id) === formData.tanqueId;
                                            return (
                                                <TouchableOpacity
                                                    key={tanque.id}
                                                    activeOpacity={0.75}
                                                    disabled={salvando}
                                                    onPress={() => {
                                                        if (!salvando) setFormData({ ...formData, tanqueId: String(tanque.id) });
                                                    }}
                                                    style={{
                                                        minWidth: 132,
                                                        backgroundColor: ativo ? "#f59e0b" : "#f9fafb",
                                                        borderWidth: 1,
                                                        borderColor: ativo ? "#f59e0b" : "#e5e7eb",
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
                                            Após salvar: {volumeAposColeta.toFixed(1)} L
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
                            <Feather name="droplet" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Producao Diaria (Litros)</Text>
                        </View>
                        <TextInput
                            value={formData.dailyProduction}
                            onChangeText={(v) => {
                                if (!salvando) setFormData({ ...formData, dailyProduction: v });
                            }}
                            placeholder="Ex: 45.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            editable={!salvando}
                            style={{ backgroundColor: salvando ? "#f3f4f6" : "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", opacity: salvando ? 0.8 : 1 }}
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
                            <Feather name="edit-3" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Observacoes</Text>
                        </View>
                        <TextInput
                            value={formData.notes}
                            onChangeText={(v) => {
                                if (!salvando) setFormData({ ...formData, notes: v });
                            }}
                            placeholder="Anotacoes sobre a coleta..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            editable={!salvando}
                            style={{ backgroundColor: salvando ? "#f3f4f6" : "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 80, opacity: salvando ? 0.8 : 1 }}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            onPress={handleCancel}
                            disabled={salvando}
                            activeOpacity={0.7}
                            style={{
                                flex: 1,
                                backgroundColor: "#fff",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 14,
                                paddingVertical: 16,
                                alignItems: "center",
                                opacity: salvando ? 0.55 : 1,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={salvando || carregandoTanques || tanques.length === 0} style={{ flex: 2 }}>
                            <LinearGradient
                                colors={["#f59e0b", "#d97706"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: 14, paddingVertical: 16, minHeight: 54, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: salvando || carregandoTanques || tanques.length === 0 ? 0.78 : 1 }}
                            >
                                {salvando ? (
                                    <>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Salvando...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Feather name="save" size={18} color="#fff" />
                                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Salvar Alteracoes</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
