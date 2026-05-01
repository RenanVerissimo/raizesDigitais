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
import { Animal } from "../../interfaces/interfaces";
import { criarAnimal } from "../../services/api";
import Toast from "react-native-toast-message";
import DateInput from "../../components/DateInput";
import { toIso } from "../../utils/formatters";


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

        // ✅ NOVA VALIDAÇÃO: data de nascimento obrigatória
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
            await criarAnimal({
                nome: formData.nome.trim(),
                identificador: formData.identificador.trim(),
                producao_media_diaria: producao,
                raca: formData.raca.trim() || null,
                peso: pesoNum,
                descricao: formData.descricao.trim() || null,
                data_nascimento: dataNascIso,
                data_ultimo_parto: toIso(formData.dataUltimoParto),
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

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="tag" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Nome do Animal *
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

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="hash" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Número/Identificação *
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

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="droplet" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Produção Média Diária (Litros) <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
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

                    {/* Peso (kg) */}
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

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Descrição do Animal <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.descricao}
                            onChangeText={(v) => setFormData({ ...formData, descricao: v })}
                            placeholder="Ex: Animal dócil, vacinada em janeiro, prenhe..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
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
                                minHeight: 90,
                            }}
                        />
                    </View>

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