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
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { criarAnimal, listarAnimais } from "../../services/api";
import Toast from "react-native-toast-message";
import DateInput from "../../components/DateInput";
import { toIso } from "../../utils/formatters";
import { normalizarId } from "../../utils/normalizarId";

export default function CadastrarAnimais() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [formData, setFormData] = useState({
        nome: "",
        identificador: "",
        producaoMediaDiaria: "",
        raca: "",
        peso: "",
        descricao: "",
        dataNascimento: "",
        dataUltimoParto: "",
        diasDescarteLeite: "",
        // Reprodutivo
        prenha: false,
        emCio: false,
        abortou: false,
        naoEmprenha: false,
        mastite: false,
        tratamentoMastite: "",
        dataReproducao: "",
        dataInseminacao: "",
        dataConfirmacaoPrenhez: "",
    });

    function handleCancelar() {
        const temDados = formData.nome || formData.identificador || formData.producaoMediaDiaria;
        if (temDados) {
            Alert.alert("Cancelar cadastro", "Deseja descartar as informações?", [
                { text: "Continuar editando", style: "cancel" },
                { text: "Descartar", style: "destructive", onPress: () => navigation.goBack() },
            ]);
        } else {
            navigation.goBack();
        }
    }

    async function handleSubmit() {
        if (!formData.nome.trim() || !formData.identificador.trim()) {
            Alert.alert("Atenção", "Preencha os campos obrigatórios marcados com *");
            return;
        }

        const dataNascIso = toIso(formData.dataNascimento);
        if (!dataNascIso) {
            Alert.alert("Atenção", "Informe uma data de nascimento válida (DD/MM/AAAA)");
            return;
        }

        let producao: number | null = null;
        if (formData.producaoMediaDiaria.trim()) {
            producao = parseFloat(formData.producaoMediaDiaria);
            if (isNaN(producao) || producao <= 0) {
                Alert.alert("Atenção", "Se preenchida, a produção deve ser maior que 0.");
                return;
            }
        }

        let pesoNum: number | null = null;
        if (formData.peso.trim()) {
            pesoNum = parseFloat(formData.peso);
            if (isNaN(pesoNum) || pesoNum <= 0) {
                Alert.alert("Atenção", "Se preenchido, o peso deve ser maior que 0.");
                return;
            }
        }

        if (formData.mastite && !formData.tratamentoMastite.trim()) {
            Alert.alert("Atenção", "Informe qual tratamento foi realizado para mastite.");
            return;
        }

        let diasDescarteLeite: number | null = null;
        if (formData.diasDescarteLeite.trim()) {
            diasDescarteLeite = parseInt(formData.diasDescarteLeite, 10);
            if (isNaN(diasDescarteLeite) || diasDescarteLeite <= 0) {
                Alert.alert("AtenÃ§Ã£o", "Se preenchido, o descarte de leite deve ser maior que 0 dias.");
                return;
            }
        }

        const todosAnimais = await listarAnimais();
        const novoId = normalizarId(formData.identificador);
        const jaExiste = todosAnimais.some((a) => normalizarId(a.identificador) === novoId);
        if (jaExiste) {
            Toast.show({
                type: "error",
                text1: "Identificador já cadastrado.",
                text2: `Já existe um animal com o ID "${formData.identificador}".`,
                position: "top",
                visibilityTime: 4000,
            });
            return;
        }

        try {
            await criarAnimal({
                nome: formData.nome.trim(),
                identificador: formData.identificador.trim(),
                producao_media_diaria: producao,
                raca: formData.raca.trim() || null,
                peso: pesoNum,
                descricao: formData.descricao.trim() || null,
                data_nascimento: dataNascIso,
                data_ultimo_parto: toIso(formData.dataUltimoParto),
                dias_descarte_leite: diasDescarteLeite,
                prenha: formData.prenha,
                em_cio: formData.emCio,
                abortou: formData.abortou,
                nao_emprenha: formData.naoEmprenha,
                mastite: formData.mastite,
                tratamento_mastite: formData.mastite ? formData.tratamentoMastite.trim() : null,
                doente: formData.mastite,
                doenca: formData.mastite ? "mastite" : null,
                descricao_doenca: null,
                data_reproducao: toIso(formData.dataInseminacao || formData.dataReproducao),
                data_inseminacao: toIso(formData.dataInseminacao),
                data_confirmacao_prenhez: formData.prenha ? toIso(formData.dataConfirmacaoPrenhez) : null,
            });

            Toast.show({
                type: "success",
                text1: "Animal cadastrado!",
                text2: "O animal foi salvo com sucesso.",
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);
        } catch (err) {
            console.error(err);
            Toast.show({ type: "error", text1: "Erro", text2: "Não foi possível salvar." });
        }
    }

    const statusReprodutivo = [
        { key: "prenha", label: "Prenha", cor: "#22c55e", icon: "check-circle" },
        { key: "emCio", label: "Em Cio", cor: "#f59e0b", icon: "alert-circle" },
        { key: "abortou", label: "Abortou", cor: "#ef4444", icon: "x-circle" },
        { key: "naoEmprenha", label: "Não Emprenha", cor: "#6b7280", icon: "slash" },
    ] as const;

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
                                <MaterialCommunityIcons name="cow" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Cadastrar Animal
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Preencha os dados do animal
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    {/* Nome */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="tag" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Nome do Animal <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.nome}
                            onChangeText={(v) => setFormData({ ...formData, nome: v })}
                            placeholder="Ex: Mimosa, Estrela"
                            placeholderTextColor="#9ca3af"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* Identificador */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="hash" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Número/Identificação <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.identificador}
                            onChangeText={(v) => setFormData({ ...formData, identificador: v })}
                            placeholder="Ex: 001, BR-1234"
                            placeholderTextColor="#9ca3af"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* Produção */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="droplet" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Produção Média Diária (L) <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.producaoMediaDiaria}
                            onChangeText={(v) => setFormData({ ...formData, producaoMediaDiaria: v })}
                            placeholder="Ex: 25.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* Raça */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <MaterialCommunityIcons name="cow" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Raça <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.raca}
                            onChangeText={(v) => setFormData({ ...formData, raca: v })}
                            placeholder="Ex: Holandesa, Jersey"
                            placeholderTextColor="#9ca3af"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* Peso */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <MaterialCommunityIcons name="weight-kilogram" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Peso (kg) <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.peso}
                            onChangeText={(v) => setFormData({ ...formData, peso: v })}
                            placeholder="Ex: 450.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* Data de Nascimento */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Data de Nascimento <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                        </View>
                        <DateInput
                            value={formData.dataNascimento}
                            onChange={(v) => setFormData({ ...formData, dataNascimento: v })}
                        />
                    </View>

                    {/* Data do Último Parto */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <MaterialCommunityIcons name="cow-off" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Data do Último Parto <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <DateInput
                            value={formData.dataUltimoParto}
                            onChange={(v) => setFormData({ ...formData, dataUltimoParto: v })}
                        />
                    </View>

                    <View style={{ backgroundColor: "#fff7ed", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#fed7aa" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="alert-triangle" size={16} color="#ea580c" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Descarte de leite apos o parto <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.diasDescarteLeite}
                            onChangeText={(v) => setFormData({ ...formData, diasDescarteLeite: v.replace(/[^0-9]/g, "") })}
                            placeholder="Ex: 4"
                            placeholderTextColor="#9ca3af"
                            keyboardType="number-pad"
                            style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                        <Text style={{ fontSize: 11, color: "#9a3412", lineHeight: 16, marginTop: 8 }}>
                            Informe por quantos dias o leite deve ser descartado apos o ultimo parto. O aviso ajuda a evitar leite com colostro, antibiotico ou terapia de vaca seca no tanque.
                        </Text>
                        {!formData.dataUltimoParto && formData.diasDescarteLeite ? (
                            <Text style={{ fontSize: 11, color: "#dc2626", lineHeight: 16, marginTop: 6 }}>
                                Para calcular a data final do descarte, informe tambem a data do ultimo parto.
                            </Text>
                        ) : null}
                    </View>

                    {/* Descrição */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Descrição <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.descricao}
                            onChangeText={(v) => setFormData({ ...formData, descricao: v })}
                            placeholder="Ex: Animal dócil, vacinada em janeiro..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 90 }}
                        />
                    </View>

                    {/* Status Reprodutivo */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <MaterialCommunityIcons name="cow" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Status Reprodutivo <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <View style={{ gap: 10 }}>
                            {statusReprodutivo.map((item) => {
                                const ativo = formData[item.key] as boolean;
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() => {
                                            // Se desativar prenha, limpa a data de confirmação.
                                            if (item.key === "prenha" && ativo) {
                                                setFormData({ ...formData, prenha: false, dataConfirmacaoPrenhez: "" });
                                            } else {
                                                setFormData({ ...formData, [item.key]: !ativo });
                                            }
                                        }}
                                        activeOpacity={0.7}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: 12,
                                            backgroundColor: ativo ? `${item.cor}15` : "#f9fafb",
                                            borderWidth: 1,
                                            borderColor: ativo ? item.cor : "#e5e7eb",
                                            borderRadius: 10,
                                        }}
                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                            <Feather name={item.icon} size={16} color={ativo ? item.cor : "#9ca3af"} />
                                            <Text style={{ fontSize: 14, fontWeight: "500", color: ativo ? item.cor : "#6b7280" }}>
                                                {item.label}
                                            </Text>
                                        </View>
                                        <View style={{
                                            width: 22, height: 22, borderRadius: 11,
                                            backgroundColor: ativo ? item.cor : "#e5e7eb",
                                            alignItems: "center", justifyContent: "center",
                                        }}>
                                            {ativo ? <Feather name="check" size={13} color="#fff" /> : null}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Data de Inseminação */}
                    <View style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#bfdbfe" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#1d4ed8" }}>
                                Data de Inseminação <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <DateInput
                            value={formData.dataInseminacao}
                            onChange={(v) => setFormData({ ...formData, dataInseminacao: v, dataReproducao: v })}
                        />
                    </View>

                    {/* Data de confirmação — só aparece se prenha */}
                    {formData.prenha && (
                        <View style={{ backgroundColor: "#f0fdf4", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#bbf7d0" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="calendar" size={16} color="#22c55e" />
                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#15803d" }}>
                                    Data da Confirmação da Prenhez <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                                </Text>
                            </View>
                            <DateInput
                                value={formData.dataConfirmacaoPrenhez}
                                onChange={(v) => setFormData({ ...formData, dataConfirmacaoPrenhez: v })}
                            />
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                                <Feather name="info" size={12} color="#16a34a" />
                                <Text style={{ fontSize: 11, color: "#16a34a", flex: 1 }}>
                                    Parto previsto e secagem serão calculados automaticamente (283 dias)
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Saúde */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <Feather name="heart" size={16} color="#dc2626" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Saúde <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setFormData({
                                    ...formData,
                                    mastite: !formData.mastite,
                                    tratamentoMastite: formData.mastite ? "" : formData.tratamentoMastite,
                                })}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: 12,
                                    backgroundColor: formData.mastite ? "#fee2e2" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: formData.mastite ? "#dc2626" : "#e5e7eb",
                                    borderRadius: 10,
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Feather name="alert-triangle" size={16} color={formData.mastite ? "#dc2626" : "#9ca3af"} />
                                    <Text style={{ fontSize: 14, fontWeight: "500", color: formData.mastite ? "#dc2626" : "#6b7280" }}>
                                        Controle de mastite
                                    </Text>
                                </View>
                                <View style={{
                                    width: 22, height: 22, borderRadius: 11,
                                    backgroundColor: formData.mastite ? "#dc2626" : "#e5e7eb",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    {formData.mastite ? <Feather name="check" size={13} color="#fff" /> : null}
                                </View>
                            </TouchableOpacity>

                            {formData.mastite && (
                                <View style={{ gap: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#374151" }}>
                                        Qual tratamento foi realizado?
                                    </Text>
                                    <TextInput
                                        value={formData.tratamentoMastite}
                                        onChangeText={(v) => setFormData({ ...formData, tratamentoMastite: v })}
                                        placeholder="Ex: antibiótico, ordenha separada, acompanhamento veterinário..."
                                        placeholderTextColor="#9ca3af"
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 82 }}
                                    />
                                </View>
                            )}
                        </View>
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
                                style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                            >
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Cadastrar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
