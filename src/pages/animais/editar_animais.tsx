import React, { useState, useEffect } from "react";
import DateInput from "../../components/DateInput";
import {
    ActivityIndicator,
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StatusBar, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Animal } from "../../interfaces/interfaces";
import { atualizarAnimal } from "../../services/api";
import Toast from "react-native-toast-message";
import { toBr, toIso } from "../../utils/formatters";

export default function EditarAnimais() {


    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const animal: Animal = route.params?.animal;
    const [salvando, setSalvando] = useState(false);

    const [formData, setFormData] = useState({
        nome: animal?.nome ?? "",
        identificador: animal?.identificador ?? "",
        status: animal?.status === "vendido" ? "vendido" : animal?.status === "inativo" ? "inativo" : "ativo",
        producaoMediaDiaria: animal?.producao_media_diaria != null ? String(animal.producao_media_diaria) : "",
        raca: animal?.raca ?? "",
        peso: animal?.peso != null ? String(animal.peso) : "",
        descricao: animal?.descricao ?? "",
        dataNascimento: toBr(animal?.data_nascimento),
        dataUltimoParto: toBr(animal?.data_ultimo_parto),
        diasDescarteLeite: animal?.dias_descarte_leite != null ? String(animal.dias_descarte_leite) : "",

        // 🔥 NOVOS
        prenha: Number(animal?.prenha) === 1,
        emCio: Number(animal?.em_cio) === 1,
        abortou: Number(animal?.abortou) === 1,
        naoEmprenha: Number(animal?.nao_emprenha) === 1,
        mastite: Number(animal?.mastite) === 1,
        tratamentoMastite: animal?.tratamento_mastite ?? "",
        outraDoenca: Number(animal?.doente) === 1 && animal?.doenca === "outra",
        descricaoDoenca: animal?.descricao_doenca ?? "",
        dataReproducao: toBr(animal?.data_reproducao || animal?.data_base_gestacao || animal?.data_cobertura),
        dataInseminacao: toBr(animal?.data_inseminacao || animal?.data_reproducao || animal?.data_base_gestacao || animal?.data_cobertura),
        dataConfirmacaoPrenhez: toBr(animal?.data_confirmacao_prenhez),
    });

    const statusReprodutivo = [
        { key: "prenha", label: "Prenha", cor: "#22c55e", icon: "check-circle" },
        { key: "emCio", label: "Em Cio", cor: "#f59e0b", icon: "alert-circle" },
        { key: "abortou", label: "Abortou", cor: "#ef4444", icon: "x-circle" },
        { key: "naoEmprenha", label: "Não Emprenha", cor: "#6b7280", icon: "slash" },
    ] as const;

    useEffect(() => {
        if (animal) {
            setFormData({
                nome: animal.nome ?? "",
                identificador: animal.identificador ?? "",
                status: animal.status === "vendido" ? "vendido" : animal.status === "inativo" ? "inativo" : "ativo",
                producaoMediaDiaria: animal.producao_media_diaria != null ? String(animal.producao_media_diaria) : "",
                raca: animal.raca ?? "",
                peso: animal.peso != null ? String(animal.peso) : "",
                descricao: animal.descricao ?? "",
                dataNascimento: toBr(animal.data_nascimento),
                dataUltimoParto: toBr(animal.data_ultimo_parto),
                diasDescarteLeite: animal.dias_descarte_leite != null ? String(animal.dias_descarte_leite) : "",

                // 🔥 NOVOS
                prenha: Number(animal.prenha) === 1,
                emCio: Number(animal.em_cio) === 1,
                abortou: Number(animal.abortou) === 1,
                naoEmprenha: Number(animal.nao_emprenha) === 1,
                mastite: Number(animal.mastite) === 1,
                tratamentoMastite: animal.tratamento_mastite ?? "",
                outraDoenca: Number(animal.doente) === 1 && animal.doenca === "outra",
                descricaoDoenca: animal.descricao_doenca ?? "",
                dataReproducao: toBr(animal.data_reproducao || animal.data_base_gestacao || animal.data_cobertura),
                dataInseminacao: toBr(animal.data_inseminacao || animal.data_reproducao || animal.data_base_gestacao || animal.data_cobertura),
                dataConfirmacaoPrenhez: toBr(animal.data_confirmacao_prenhez),
            });
        }
    }, [animal?.id]);

    function handleCancelar() {
        if (salvando) return;
        navigation.goBack();
    }

    async function handleSubmit() {
        if (salvando) return;

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

        if (formData.outraDoenca && !formData.descricaoDoenca.trim()) {
            Alert.alert("Atenção", "Informe qual doença ou condição de saúde foi identificada.");
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

        try {
            setSalvando(true);
            await atualizarAnimal(animal.id, {
                nome: formData.nome.trim(),
                identificador: formData.identificador.trim(),
                status: formData.status as "ativo" | "inativo" | "vendido",
                producao_media_diaria: producao,
                raca: formData.raca.trim() || null,
                peso: pesoNum,
                descricao: formData.descricao.trim() || null,
                data_nascimento: dataNascIso,
                data_ultimo_parto: toIso(formData.dataUltimoParto),
                dias_descarte_leite: diasDescarteLeite,

                // 🔥 NOVOS
                prenha: formData.prenha,
                em_cio: formData.emCio,
                abortou: formData.abortou,
                nao_emprenha: formData.naoEmprenha,
                mastite: formData.mastite,
                tratamento_mastite: formData.mastite ? formData.tratamentoMastite.trim() : null,
                doente: formData.mastite || formData.outraDoenca,
                doenca: formData.mastite ? "mastite" : formData.outraDoenca ? "outra" : null,
                descricao_doenca: formData.outraDoenca ? formData.descricaoDoenca.trim() : null,
                data_reproducao: toIso(formData.dataInseminacao || formData.dataReproducao),
                data_inseminacao: toIso(formData.dataInseminacao),
                data_confirmacao_prenhez: formData.prenha ? toIso(formData.dataConfirmacaoPrenhez) : null,
            });

            Toast.show({
                type: "success", text1: "Animal atualizado!",
                text2: "As alterações foram salvas.", position: "top", visibilityTime: 3000,
            });
            setTimeout(() => {
                setSalvando(false);
                navigation.goBack();
            }, 500);
        } catch (err) {
            console.error(err);
            Toast.show({
                type: "error",
                text1: "Erro ao salvar",
                text2: "A conexão demorou demais ou caiu. Tente novamente em alguns instantes.",
                position: "top",
                visibilityTime: 3000,
            });
            setSalvando(false);
        }
    }

    const inputStyle = {
        backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb",
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a",
    };
    const cardStyle = {
        backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9",
    };
    const labelStyle = { fontSize: 14, fontWeight: "500" as const, color: "#0a0a0a" };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, backgroundColor: "#f5f7fa" }}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24,
                        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={handleCancelar} disabled={salvando} style={{ padding: 4, opacity: salvando ? 0.65 : 1 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="edit-2" size={18} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Editar Animal
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Atualize os dados do animal
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    {/* Nome */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="tag" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>Nome do Animal <Text style={{ color: "#ef4444" }}>*</Text></Text>
                        </View>
                        <TextInput
                            value={formData.nome}
                            onChangeText={(v) => setFormData({ ...formData, nome: v })}
                            editable={!salvando}
                            placeholder="Ex: Mimosa, Estrela"
                            placeholderTextColor="#9ca3af"
                            style={inputStyle}
                        />
                    </View>

                    {/* Identificador */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="hash" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>Número/Identificação <Text style={{ color: "#ef4444" }}>*</Text></Text>
                        </View>
                        <TextInput
                            value={formData.identificador}
                            onChangeText={(v) => setFormData({ ...formData, identificador: v })}
                            editable={!salvando}
                            placeholder="Ex: 001, BR-1234"
                            placeholderTextColor="#9ca3af"
                            style={inputStyle}
                        />
                    </View>

                    {/* Produção Média */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="droplet" size={16} color="#6b7280" />
                            <Text style={labelStyle}>
                                Produção Média Diária (Litros) <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.producaoMediaDiaria}
                            onChangeText={(v) => setFormData({ ...formData, producaoMediaDiaria: v })}
                            editable={!salvando}
                            placeholder="Ex: 25.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={inputStyle}
                        />
                    </View>

                    {/* Raça */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <MaterialCommunityIcons name="cow" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Raça <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <TextInput
                            value={formData.raca}
                            onChangeText={(v) => setFormData({ ...formData, raca: v })}
                            editable={!salvando}
                            placeholder="Ex: Holandesa, Jersey"
                            placeholderTextColor="#9ca3af"
                            style={inputStyle}
                        />
                    </View>

                    {/* Peso */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <MaterialCommunityIcons name="weight-kilogram" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Peso (kg) <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <TextInput
                            value={formData.peso}
                            onChangeText={(v) => setFormData({ ...formData, peso: v })}
                            editable={!salvando}
                            placeholder="Ex: 450.5"
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            style={inputStyle}
                        />
                    </View>

                    {/* Data de Nascimento — OBRIGATÓRIO */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>Data de Nascimento <Text style={{ color: "#ef4444" }}>*</Text></Text>
                        </View>
                        <DateInput
                            value={formData.dataNascimento}
                            onChange={(v) => setFormData({ ...formData, dataNascimento: v })}
                        />
                    </View>

                    {/* Data Último Parto */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <MaterialCommunityIcons name="cow-off" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Data do Último Parto <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <DateInput
                            value={formData.dataUltimoParto}
                            onChange={(v) => setFormData({ ...formData, dataUltimoParto: v })}
                        />
                    </View>

                    <View style={{ backgroundColor: "#fff7ed", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#fed7aa" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="alert-triangle" size={16} color="#ea580c" />
                            <Text style={labelStyle}>
                                Descarte de leite após o parto <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.diasDescarteLeite}
                            onChangeText={(v) => setFormData({ ...formData, diasDescarteLeite: v.replace(/[^0-9]/g, "") })}
                            editable={!salvando}
                            placeholder="Ex: 4"
                            placeholderTextColor="#9ca3af"
                            keyboardType="number-pad"
                            style={{ ...inputStyle, backgroundColor: "#fff", borderColor: "#fed7aa" }}
                        />
                        <Text style={{ fontSize: 11, color: "#9a3412", lineHeight: 16, marginTop: 8 }}>
                            Informe por quantos dias o leite deve ser descartado após o último parto. O aviso ajuda a evitar leite com colostro, antibiótico ou resíduos de terapia de vaca seca no tanque.
                        </Text>
                        {!formData.dataUltimoParto && formData.diasDescarteLeite ? (
                            <Text style={{ fontSize: 11, color: "#dc2626", lineHeight: 16, marginTop: 6 }}>
                                Para calcular a data final do descarte, informe também a data do último parto.
                            </Text>
                        ) : null}
                    </View>

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <MaterialCommunityIcons name="cow" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>Status Reprodutivo</Text>
                        </View>

                        <View style={{ gap: 10 }}>
                            {statusReprodutivo.map((item) => {
                                const ativo = formData[item.key] as boolean;

                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() => {
                                            if (salvando) return;
                                            if (item.key === "prenha" && ativo) {
                                                setFormData({ ...formData, prenha: false, dataConfirmacaoPrenhez: "" });
                                            } else {
                                                setFormData({ ...formData, [item.key]: !ativo });
                                            }
                                        }}
                                        disabled={salvando}
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            padding: 12,
                                            backgroundColor: ativo ? `${item.cor}15` : "#f9fafb",
                                            borderWidth: 1,
                                            borderColor: ativo ? item.cor : "#e5e7eb",
                                            borderRadius: 10,
                                            opacity: salvando ? 0.65 : 1,
                                        }}
                                    >
                                        <Text style={{ color: ativo ? item.cor : "#6b7280" }}>
                                            {item.label}
                                        </Text>
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
                                    Parto previsto e secagem continuam usando a data de inseminação.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Saúde */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <Feather name="heart" size={16} color="#dc2626" />
                            <Text style={labelStyle}>Saúde</Text>
                        </View>

                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (salvando) return;
                                    setFormData({
                                        ...formData,
                                        mastite: !formData.mastite,
                                        tratamentoMastite: formData.mastite ? "" : formData.tratamentoMastite,
                                    });
                                }}
                                disabled={salvando}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: 12,
                                    backgroundColor: formData.mastite ? "#fee2e2" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: formData.mastite ? "#dc2626" : "#e5e7eb",
                                    borderRadius: 10,
                                    opacity: salvando ? 0.65 : 1,
                                }}
                            >
                                <Text style={{ color: formData.mastite ? "#dc2626" : "#6b7280", fontWeight: "500" }}>
                                    Controle de mastite
                                </Text>
                                {formData.mastite ? <Feather name="check" size={16} color="#dc2626" /> : null}
                            </TouchableOpacity>

                            {formData.mastite && (
                                <View style={{ gap: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#374151" }}>
                                        Qual tratamento foi realizado?
                                    </Text>
                                    <TextInput
                                        value={formData.tratamentoMastite}
                                        onChangeText={(v) => setFormData({ ...formData, tratamentoMastite: v })}
                                        editable={!salvando}
                                        placeholder="Ex: antibiótico, ordenha separada, acompanhamento veterinário..."
                                        placeholderTextColor="#9ca3af"
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        style={{ ...inputStyle, minHeight: 82 }}
                                    />
                                </View>
                            )}

                            <TouchableOpacity
                                onPress={() => {
                                    if (salvando) return;
                                    setFormData({
                                        ...formData,
                                        outraDoenca: !formData.outraDoenca,
                                        descricaoDoenca: formData.outraDoenca ? "" : formData.descricaoDoenca,
                                    });
                                }}
                                disabled={salvando}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: 12,
                                    backgroundColor: formData.outraDoenca ? "#dbeafe" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: formData.outraDoenca ? "#2563eb" : "#e5e7eb",
                                    borderRadius: 10,
                                    opacity: salvando ? 0.65 : 1,
                                }}
                            >
                                <Text style={{ color: formData.outraDoenca ? "#2563eb" : "#6b7280", fontWeight: "500" }}>
                                    Outra doença ou condição
                                </Text>
                                {formData.outraDoenca ? <Feather name="check" size={16} color="#2563eb" /> : null}
                            </TouchableOpacity>

                            {formData.outraDoenca && (
                                <View style={{ gap: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#374151" }}>
                                        Qual doença ou condição foi identificada?
                                    </Text>
                                    <TextInput
                                        value={formData.descricaoDoenca}
                                        onChangeText={(v) => setFormData({ ...formData, descricaoDoenca: v })}
                                        editable={!salvando}
                                        placeholder="Ex: casco inflamado, febre, ferimento, tristeza..."
                                        placeholderTextColor="#9ca3af"
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        style={{ ...inputStyle, minHeight: 82 }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Descrição */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Descrição do Animal <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <TextInput
                            value={formData.descricao}
                            onChangeText={(v) => setFormData({ ...formData, descricao: v })}
                            editable={!salvando}
                            placeholder="Ex: Animal dócil, vacinada em janeiro..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ ...inputStyle, minHeight: 90 }}
                        />
                    </View>

                    {/* Botões */}
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                        <TouchableOpacity
                            onPress={handleCancelar}
                            activeOpacity={0.85}
                            disabled={salvando}
                            style={{
                                flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
                                borderRadius: 12, paddingVertical: 14, alignItems: "center",
                                opacity: salvando ? 0.65 : 1,
                            }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            activeOpacity={0.85}
                            disabled={salvando}
                            style={{
                                flex: 1, backgroundColor: "#f59e0b", borderRadius: 12,
                                paddingVertical: 14, alignItems: "center", minHeight: 49,
                                flexDirection: "row", justifyContent: "center", gap: 8,
                                opacity: salvando ? 0.78 : 1,
                            }}
                        >
                            {salvando ? (
                                <>
                                    <ActivityIndicator color="#fff" />
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Salvando...</Text>
                                </>
                            ) : (
                                <>
                                    <Feather name="check" size={18} color="#fff" />
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Salvar Alterações</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
