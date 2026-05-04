import React, { useState, useEffect } from "react";
import DateInput from "../../components/DateInput";
import {
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

    const [formData, setFormData] = useState({
        nome: animal?.nome ?? "",
        identificador: animal?.identificador ?? "",
        producaoMediaDiaria: animal?.producao_media_diaria != null ? String(animal.producao_media_diaria) : "",
        raca: animal?.raca ?? "",
        peso: animal?.peso != null ? String(animal.peso) : "",
        descricao: animal?.descricao ?? "",
        dataNascimento: toBr(animal?.data_nascimento),
        dataUltimoParto: toBr(animal?.data_ultimo_parto),

        // 🔥 NOVOS
        prenha: animal?.prenha ?? false,
        emCio: animal?.em_cio ?? false,
        abortou: animal?.abortou ?? false,
        naoEmprenha: animal?.nao_emprenha ?? false,
        dataCobertura: toBr(animal?.data_cobertura),
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
                producaoMediaDiaria: animal.producao_media_diaria != null ? String(animal.producao_media_diaria) : "",
                raca: animal.raca ?? "",
                peso: animal.peso != null ? String(animal.peso) : "",
                descricao: animal.descricao ?? "",
                dataNascimento: toBr(animal.data_nascimento),
                dataUltimoParto: toBr(animal.data_ultimo_parto),

                // 🔥 NOVOS
                prenha: animal.prenha ?? false,
                emCio: animal.em_cio ?? false,
                abortou: animal.abortou ?? false,
                naoEmprenha: animal.nao_emprenha ?? false,
                dataCobertura: toBr(animal.data_cobertura),
            });
        }
    }, [animal?.id]);

    function handleCancelar() {
        navigation.goBack();
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

        try {
            await atualizarAnimal(animal.id, {
                nome: formData.nome.trim(),
                identificador: formData.identificador.trim(),
                producao_media_diaria: producao,
                raca: formData.raca.trim() || null,
                peso: pesoNum,
                descricao: formData.descricao.trim() || null,
                data_nascimento: dataNascIso,
                data_ultimo_parto: toIso(formData.dataUltimoParto),

                // 🔥 NOVOS
                prenha: formData.prenha,
                em_cio: formData.emCio,
                abortou: formData.abortou,
                nao_emprenha: formData.naoEmprenha,
                data_cobertura: toIso(formData.dataCobertura),
            });

            Toast.show({
                type: "success", text1: "Animal atualizado!",
                text2: "As alterações foram salvas.", position: "top", visibilityTime: 3000,
            });
            setTimeout(() => navigation.goBack(), 500);
        } catch (err) {
            console.error(err);
            Toast.show({ type: "error", text1: "Erro", text2: "Não foi possível salvar." });
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
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
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
                                            if (item.key === "prenha" && ativo) {
                                                setFormData({ ...formData, prenha: false, dataCobertura: "" });
                                            } else {
                                                setFormData({ ...formData, [item.key]: !ativo });
                                            }
                                        }}
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            padding: 12,
                                            backgroundColor: ativo ? `${item.cor}15` : "#f9fafb",
                                            borderWidth: 1,
                                            borderColor: ativo ? item.cor : "#e5e7eb",
                                            borderRadius: 10,
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

                    {/* Descrição */}
                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#6b7280" />
                            <Text style={labelStyle}>Descrição do Animal <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text></Text>
                        </View>
                        <TextInput
                            value={formData.descricao}
                            onChangeText={(v) => setFormData({ ...formData, descricao: v })}
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
                            style={{
                                flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
                                borderRadius: 12, paddingVertical: 14, alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            activeOpacity={0.85}
                            style={{
                                flex: 1, backgroundColor: "#f59e0b", borderRadius: 12,
                                paddingVertical: 14, alignItems: "center",
                                flexDirection: "row", justifyContent: "center", gap: 8,
                            }}
                        >
                            <Feather name="check" size={18} color="#fff" />
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Salvar Alterações</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}