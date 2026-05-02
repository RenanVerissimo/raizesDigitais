import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StatusBar, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CategoriaCompra, Compra, StatusCompra } from "../../interfaces/interfaces";
import { CATEGORIAS } from "./compras_e_pedidos";
import Toast from "react-native-toast-message";
import { atualizarCompra } from "../../services/api";

export default function EditarCompra() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const compraOriginal: Compra = route.params.compra;

    const [formData, setFormData] = useState({
        categoria: compraOriginal.categoria as CategoriaCompra,
        item: compraOriginal.item,
        quantidade: String(compraOriginal.quantidade),
        precoUnitario: String(compraOriginal.precoUnitario),
        fornecedor: compraOriginal.fornecedor,
        data: compraOriginal.data.split("T")[0],
        status: compraOriginal.status as StatusCompra,
        observacoes: compraOriginal.observacoes || "",
    });

    const total = (parseFloat(formData.quantidade) || 0) * (parseFloat(formData.precoUnitario) || 0);

    const STATUS_OPCOES: { key: StatusCompra; label: string; cor: string }[] = [
        { key: "pendente", label: "Pendente", cor: "#eab308" },
        { key: "concluido", label: "Concluído", cor: "#22c55e" },
        { key: "cancelado", label: "Cancelado", cor: "#ef4444" },
    ];

    function handleCancelar() {
       navigation.goBack();
    }

    async function handleSubmit() {
        if (!formData.item.trim() || !formData.quantidade || !formData.precoUnitario || !formData.fornecedor.trim()) {
            Alert.alert("Atenção", "Preencha os campos obrigatórios marcados com *");
            return;
        }
        const qtd = parseFloat(formData.quantidade);
        const preco = parseFloat(formData.precoUnitario);
        if (isNaN(qtd) || qtd <= 0 || isNaN(preco) || preco <= 0) {
            Alert.alert("Atenção", "Quantidade e preço devem ser maiores que 0.");
            return;
        }

        try {
            await atualizarCompra(compraOriginal.id, {
                categoria: formData.categoria,
                item: formData.item.trim(),
                quantidade: qtd,
                precoUnitario: preco,
                fornecedor: formData.fornecedor.trim(),
                data: formData.data,
                status: formData.status,
                observacoes: formData.observacoes.trim() || null,
            });

            Toast.show({
                type: "success",
                text1: "Compra atualizada!",
                text2: `${formData.item.trim()} foi salvo com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });
            setTimeout(() => navigation.goBack(), 500);
        } catch (err) {
            console.error(err);
            Toast.show({
                type: "error",
                text1: "Erro ao atualizar",
                text2: "Não foi possível salvar as alterações.",
                position: "top",
                visibilityTime: 3000,
            });
            navigation.goBack();
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="edit-2" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Editar Compra</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Atualize as informações
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    {/* CATEGORIA */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="tag" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Categoria *</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                                {(Object.keys(CATEGORIAS) as CategoriaCompra[]).map((key) => {
                                    const c = CATEGORIAS[key];
                                    const ativo = formData.categoria === key;
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            onPress={() => setFormData({ ...formData, categoria: key })}
                                            activeOpacity={0.7}
                                            style={{ backgroundColor: ativo ? c.bg : "#f9fafb", borderWidth: 1, borderColor: ativo ? c.text : "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: "500", color: ativo ? c.text : "#6b7280" }}>{c.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    {/* ITEM */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="package" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Item / Produto *</Text>
                        </View>
                        <TextInput
                            value={formData.item}
                            onChangeText={(v) => setFormData({ ...formData, item: v })}
                            placeholder="Ex: Ração 25kg"
                            placeholderTextColor="#9ca3af"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* QTD + PRECO */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                <Feather name="hash" size={14} color="#f59e0b" />
                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Qtd *</Text>
                            </View>
                            <TextInput
                                value={formData.quantidade}
                                onChangeText={(v) => setFormData({ ...formData, quantidade: v })}
                                placeholder="0" placeholderTextColor="#9ca3af" keyboardType="decimal-pad"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                <Feather name="dollar-sign" size={14} color="#f59e0b" />
                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Preço Un. *</Text>
                            </View>
                            <TextInput
                                value={formData.precoUnitario}
                                onChangeText={(v) => setFormData({ ...formData, precoUnitario: v })}
                                placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                        </View>
                    </View>

                    {total > 0 && (
                        <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
                            <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Valor Total</Text>
                            <Text style={{ fontSize: 26, fontWeight: "700", color: "#f59e0b" }}>R$ {total.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* FORNECEDOR */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="truck" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Fornecedor *</Text>
                        </View>
                        <TextInput
                            value={formData.fornecedor}
                            onChangeText={(v) => setFormData({ ...formData, fornecedor: v })}
                            placeholder="Nome do fornecedor" placeholderTextColor="#9ca3af"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    {/* STATUS */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="activity" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Status *</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {STATUS_OPCOES.map((s) => {
                                const ativo = formData.status === s.key;
                                return (
                                    <TouchableOpacity
                                        key={s.key}
                                        onPress={() => setFormData({ ...formData, status: s.key })}
                                        activeOpacity={0.7}
                                        style={{ flex: 1, backgroundColor: ativo ? s.cor : "#f3f4f6", paddingVertical: 10, borderRadius: 10, alignItems: "center" }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: "600", color: ativo ? "#fff" : "#374151" }}>{s.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* OBSERVAÇÕES */}
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="file-text" size={16} color="#f59e0b" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Observações</Text>
                        </View>
                        <TextInput
                            value={formData.observacoes}
                            onChangeText={(v) => setFormData({ ...formData, observacoes: v })}
                            placeholder="Detalhes adicionais (opcional)" placeholderTextColor="#9ca3af"
                            multiline numberOfLines={3}
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 80, textAlignVertical: "top" }}
                        />
                    </View>

                    {/* BOTÕES */}
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 8, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            onPress={handleCancelar} activeOpacity={0.7}
                            style={{ flex: 1, backgroundColor: "#f3f4f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit} activeOpacity={0.85}
                            style={{ flex: 1, backgroundColor: "#f59e0b", paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                        >
                            <Feather name="check" size={18} color="#fff" />
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}