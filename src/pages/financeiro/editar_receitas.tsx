import React, { useEffect, useState } from "react";
import DateInput from "../../components/DateInput";
import {
    ActivityIndicator,
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StatusBar, KeyboardAvoidingView, Platform,
    KeyboardTypeOptions, StyleProp, TextStyle, ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { atualizarReceita } from "../../services/api";
import Toast from "react-native-toast-message";
import { toBr, toIso } from "../../utils/formatters";
import { Receita } from "./financeiro";

function parseDecimal(valor: string) {
    return Number(valor.replace(/\./g, "").replace(",", "."));
}

function CampoReceita({
    icone,
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    cardStyle,
    labelStyle,
    inputStyle,
}: {
    icone: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    keyboardType?: KeyboardTypeOptions;
    cardStyle: StyleProp<ViewStyle>;
    labelStyle: StyleProp<TextStyle>;
    inputStyle: StyleProp<TextStyle>;
}) {
    return (
        <View style={cardStyle}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Feather name={icone} size={16} color="#f59e0b" />
                <Text style={labelStyle}>{label}</Text>
            </View>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboardType}
                style={inputStyle}
            />
        </View>
    );
}

export default function EditarReceita() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const receita: Receita = route.params?.receita;
    const vendaAnimal = receita?.tipoReceita === "animal";
    const animalCadastrado = vendaAnimal && receita?.animalId != null;
    const [salvando, setSalvando] = useState(false);

    const [formData, setFormData] = useState({
        comprador: receita?.comprador ?? "",
        litros: receita?.litros != null ? String(receita.litros) : "",
        precoPorLitro: receita?.precoPorLitro != null ? String(receita.precoPorLitro) : "",
        data: toBr(receita?.data),
        observacoes: receita?.observacoes ?? "",
        animalNome: receita?.animalNome ?? "",
        animalIdentificador: receita?.animalIdentificador ?? "",
        animalPeso: receita?.animalPeso != null ? String(receita.animalPeso) : "",
        valorAnimal: receita?.valorAnimal != null ? String(receita.valorAnimal) : "",
    });

    const valorTotal =
        parseDecimal(formData.litros || "0") * parseDecimal(formData.precoPorLitro || "0");

    useEffect(() => {
        if (receita) {
            setFormData({
                comprador: receita.comprador ?? "",
                litros: receita.litros != null ? String(receita.litros) : "",
                precoPorLitro: receita.precoPorLitro != null ? String(receita.precoPorLitro) : "",
                data: toBr(receita.data),
                observacoes: receita.observacoes ?? "",
                animalNome: receita.animalNome ?? "",
                animalIdentificador: receita.animalIdentificador ?? "",
                animalPeso: receita.animalPeso != null ? String(receita.animalPeso) : "",
                valorAnimal: receita.valorAnimal != null ? String(receita.valorAnimal) : "",
            });
        }
    }, [receita?.id]);

    function handleCancelar() {
        navigation.goBack();
    }

    async function handleSubmit() {
        if (salvando) return;

        const dataIso = toIso(formData.data);
        if (!dataIso) {
            Toast.show({ type: "info", text1: "Atenção", text2: "Informe uma data válida (DD/MM/AAAA).", position: "top", visibilityTime: 3000 });
            return;
        }

        try {
            setSalvando(true);
            if (vendaAnimal) {
                const valorAnimal = parseDecimal(formData.valorAnimal);
                const animalPeso = !animalCadastrado && formData.animalPeso.trim() ? parseDecimal(formData.animalPeso) : null;

                if (!valorAnimal || valorAnimal <= 0) {
                    Toast.show({ type: "info", text1: "Atenção", text2: "Informe o valor da venda do animal.", position: "top", visibilityTime: 3000 });
                    return;
                }

                if (!animalCadastrado && !formData.animalNome.trim()) {
                    Toast.show({ type: "info", text1: "Atenção", text2: "Informe o nome ou descrição do animal vendido.", position: "top", visibilityTime: 3000 });
                    return;
                }

                await atualizarReceita(receita.id, {
                    tipoReceita: "animal",
                    data: dataIso,
                    animalId: animalCadastrado ? Number(receita.animalId) : null,
                    animalNome: formData.animalNome.trim() || receita.animalNome || null,
                    animalIdentificador: formData.animalIdentificador.trim() || receita.animalIdentificador || null,
                    animalPeso,
                    valorAnimal,
                    comprador: formData.comprador.trim(),
                    observacoes: formData.observacoes.trim() || null,
                });
            } else {
                if (!formData.comprador.trim()) {
                    Toast.show({ type: "info", text1: "Atenção", text2: "Informe o nome do comprador.", position: "top", visibilityTime: 3000 });
                    return;
                }

                const litrosNum = parseDecimal(formData.litros);
                if (!formData.litros.trim() || isNaN(litrosNum) || litrosNum <= 0) {
                    Toast.show({ type: "info", text1: "Atenção", text2: "Informe a quantidade de litros corretamente.", position: "top", visibilityTime: 3000 });
                    return;
                }

                const precoNum = parseDecimal(formData.precoPorLitro);
                if (!formData.precoPorLitro.trim() || isNaN(precoNum) || precoNum <= 0) {
                    Toast.show({ type: "info", text1: "Atenção", text2: "Informe o preço por litro corretamente.", position: "top", visibilityTime: 3000 });
                    return;
                }

                await atualizarReceita(receita.id, {
                    tipoReceita: "leite",
                    comprador: formData.comprador.trim(),
                    litros: litrosNum,
                    precoPorLitro: precoNum,
                    valorTotal: litrosNum * precoNum,
                    data: dataIso,
                    observacoes: formData.observacoes.trim() || null,
                });
            }

            Toast.show({
                type: "success",
                text1: "Receita atualizada!",
                text2: "As alterações foram salvas com sucesso.",
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);
        } catch (err) {
            console.error(err);
            Toast.show({
                type: "error",
                text1: "Erro",
                text2: "Não foi possível salvar as alterações.",
                position: "top",
                visibilityTime: 3000,
            });
        } finally {
            setSalvando(false);
        }
    }

    const inputStyle = {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#0a0a0a",
    };

    const cardStyle = {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    };

    const labelStyle = {
        fontSize: 14,
        fontWeight: "500" as const,
        color: "#0a0a0a",
    };

    const estilosCampo = { cardStyle, labelStyle, inputStyle };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, backgroundColor: "#f5f7fa" }}
        >
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
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="edit-2" size={18} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Editar Receita
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {vendaAnimal ? "Atualize os dados da venda do animal" : "Atualize os dados da venda"}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    {vendaAnimal && (
                        <View style={cardStyle}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="tag" size={16} color="#f59e0b" />
                                <Text style={labelStyle}>Animal vendido</Text>
                            </View>
                            {animalCadastrado ? (
                                <View style={{ backgroundColor: "#f9fafb", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" }}>
                                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#111827" }}>
                                        {receita.animalNome || "Animal cadastrado"}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                                        ID: {receita.animalIdentificador || "-"} {receita.animalPeso != null ? `- ${Number(receita.animalPeso).toFixed(1)} kg` : ""}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ gap: 12 }}>
                                    <TextInput
                                        value={formData.animalNome}
                                        onChangeText={(v) => setFormData({ ...formData, animalNome: v })}
                                        placeholder="Ex: Novilha Jersey"
                                        placeholderTextColor="#9ca3af"
                                        style={inputStyle}
                                    />
                                    <TextInput
                                        value={formData.animalIdentificador}
                                        onChangeText={(v) => setFormData({ ...formData, animalIdentificador: v })}
                                        placeholder="Identificação, lote ou observação"
                                        placeholderTextColor="#9ca3af"
                                        style={inputStyle}
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {vendaAnimal ? (
                        <>
                            {!animalCadastrado && (
                                <CampoReceita
                                    {...estilosCampo}
                                    icone="bar-chart-2"
                                    label="Peso do animal (kg)"
                                    value={formData.animalPeso}
                                    onChangeText={(v) => setFormData({ ...formData, animalPeso: v })}
                                    placeholder="Ex: 450"
                                    keyboardType="decimal-pad"
                                />
                            )}

                            <CampoReceita
                                {...estilosCampo}
                                icone="dollar-sign"
                                label="Valor da venda *"
                                value={formData.valorAnimal}
                                onChangeText={(v) => setFormData({ ...formData, valorAnimal: v })}
                                placeholder="Ex: 4500,00"
                                keyboardType="decimal-pad"
                            />
                        </>
                    ) : (
                        <>
                            <CampoReceita
                                {...estilosCampo}
                                icone="droplet"
                                label="Quantidade (Litros) *"
                                value={formData.litros}
                                onChangeText={(v) => setFormData({ ...formData, litros: v })}
                                placeholder="Ex: 100"
                                keyboardType="decimal-pad"
                            />

                            <CampoReceita
                                {...estilosCampo}
                                icone="dollar-sign"
                                label="Preço por Litro (R$) *"
                                value={formData.precoPorLitro}
                                onChangeText={(v) => setFormData({ ...formData, precoPorLitro: v })}
                                placeholder="Ex: 2,50"
                                keyboardType="decimal-pad"
                            />

                            {valorTotal > 0 && (
                                <View style={{
                                    backgroundColor: "#f0fdf4",
                                    borderWidth: 1,
                                    borderColor: "#bbf7d0",
                                    borderRadius: 14,
                                    padding: 16,
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Feather name="trending-up" size={16} color="#16a34a" />
                                        <Text style={{ fontSize: 13, color: "#15803d" }}>Valor Total</Text>
                                    </View>
                                    <Text style={{ fontSize: 20, fontWeight: "700", color: "#15803d" }}>
                                        R$ {valorTotal.toFixed(2)}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#f59e0b" />
                            <Text style={labelStyle}>
                                Data da Venda <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                        </View>
                        <DateInput
                            value={formData.data}
                            onChange={(v) => setFormData({ ...formData, data: v })}
                        />
                    </View>

                    <CampoReceita
                        {...estilosCampo}
                        icone="user"
                        label={vendaAnimal ? "Comprador" : "Comprador *"}
                        value={formData.comprador}
                        onChangeText={(v) => setFormData({ ...formData, comprador: v })}
                        placeholder={vendaAnimal ? "Nome do comprador" : "Nome do comprador / laticínio"}
                    />

                    <View style={cardStyle}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#6b7280" />
                            <Text style={labelStyle}>
                                Observações{" "}
                                <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.observacoes}
                            onChangeText={(v) => setFormData({ ...formData, observacoes: v })}
                            placeholder="Ex: Pagamento via pix, entrega na fazenda..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ ...inputStyle, minHeight: 90 }}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 4, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            onPress={handleCancelar}
                            activeOpacity={0.85}
                            disabled={salvando}
                            style={{
                                flex: 1,
                                backgroundColor: "#fff",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 12,
                                paddingVertical: 14,
                                alignItems: "center",
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
                                flex: 2,
                                backgroundColor: "#f59e0b",
                                borderRadius: 12,
                                paddingVertical: 14,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: 8,
                                opacity: salvando ? 0.78 : 1,
                            }}
                        >
                            {salvando ? (
                                <ActivityIndicator color="#fff" />
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
