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
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CategoriaCompra, FinalidadeTratamento, StatusCompra, TipoRacaoCompra, UnidadeCompraRacao } from "../../interfaces/interfaces";
import { CATEGORIAS } from "./compras_e_pedidos";
import Toast from "react-native-toast-message";
import { criarCompra } from "../../services/api";
import DateInput from "../../components/DateInput";
import { toBr, toIso } from "../../utils/formatters";

type ItemProdutoOpcao = "vacina" | "antibiotico" | "remedio" | "outro";

const ITENS_PRODUTO: { key: ItemProdutoOpcao; label: string; cor: string }[] = [
    { key: "vacina", label: "Vacina", cor: "#2563eb" },
    { key: "antibiotico", label: "Antibiótico", cor: "#7c3aed" },
    { key: "remedio", label: "Remédio", cor: "#dc2626" },
    { key: "outro", label: "Outro", cor: "#6b7280" },
];

const TIPOS_RACAO_COMPRA: { key: TipoRacaoCompra; label: string; cor: string }[] = [
    { key: "milho", label: "Milho", cor: "#ca8a04" },
    { key: "farelo_soja", label: "Farelo de soja", cor: "#16a34a" },
    { key: "nucleo_mineral", label: "Núcleo mineral", cor: "#7c3aed" },
];

const UNIDADES_RACAO_COMPRA: { key: UnidadeCompraRacao; label: string }[] = [
    { key: "kg", label: "Kg" },
    { key: "saco", label: "Saco" },
    { key: "saca", label: "Saca" },
    { key: "fardo", label: "Fardo" },
    { key: "unidade", label: "Unidade" },
];

const PESO_SUGERIDO_RACAO: Partial<Record<TipoRacaoCompra, Partial<Record<UnidadeCompraRacao, number>>>> = {
    milho: { saca: 60 },
    farelo_soja: { saca: 50, saco: 25 },
    nucleo_mineral: { saco: 25 },
};

const CATEGORIAS_CADASTRO = (Object.keys(CATEGORIAS) as CategoriaCompra[]).filter(
    (key) => key !== "manutencao"
);

export default function CadastrarCompra() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, "0");
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const yyyy = hoje.getFullYear();

    const [formData, setFormData] = useState({
        categoria: "racao" as CategoriaCompra,
        tipoRacao: "milho" as TipoRacaoCompra,
        unidadeCompra: "saca" as UnidadeCompraRacao,
        pesoPorUnidadeKg: "60",
        itemOpcao: "vacina" as ItemProdutoOpcao,
        itemOutro: "",
        itemDescricao: "",
        quantidade: "",
        precoUnitario: "",
        fornecedor: "",
        data: `${dd}/${mm}/${yyyy}`,
        status: "pendente" as StatusCompra,
        finalidadeTratamento: "outro_tratamento" as FinalidadeTratamento,
        finalidadeDescricao: "",
        observacoes: "",
    });

    const total = (parseFloat(formData.quantidade) || 0) * (parseFloat(formData.precoUnitario) || 0);
    const quantidade = parseFloat(formData.quantidade) || 0;
    const pesoPorUnidade = parseFloat(formData.pesoPorUnidadeKg) || 0;
    const quantidadeEstoqueKg = formData.categoria === "racao"
        ? formData.unidadeCompra === "kg"
            ? quantidade
            : quantidade * pesoPorUnidade
        : null;
    const itemSelecionado = formData.categoria === "racao"
        ? TIPOS_RACAO_COMPRA.find((item) => item.key === formData.tipoRacao)?.label || ""
        : formData.categoria === "medicamento"
        ? formData.itemOpcao === "outro"
        ? formData.itemOutro.trim()
        : ITENS_PRODUTO.find((item) => item.key === formData.itemOpcao)?.label || ""
        : formData.itemDescricao.trim();

    function handleCancelar() {
        const temDados = formData.itemDescricao || formData.itemOutro || formData.quantidade || formData.precoUnitario || formData.fornecedor;
        if (temDados) {
            Alert.alert("Cancelar cadastro", "Deseja descartar as informações?", [
                { text: "Continuar editando", style: "cancel" },
                { text: "Descartar", style: "destructive", onPress: () => navigation.goBack() },
            ]);
        } else {
            navigation.goBack();
        }
    }

    function atualizarTipoRacao(tipoRacao: TipoRacaoCompra) {
        const pesoSugerido = PESO_SUGERIDO_RACAO[tipoRacao]?.[formData.unidadeCompra];
        setFormData({
            ...formData,
            tipoRacao,
            pesoPorUnidadeKg: formData.unidadeCompra === "kg" ? "" : pesoSugerido ? String(pesoSugerido) : formData.pesoPorUnidadeKg,
        });
    }

    function atualizarUnidadeCompra(unidadeCompra: UnidadeCompraRacao) {
        const pesoSugerido = PESO_SUGERIDO_RACAO[formData.tipoRacao]?.[unidadeCompra];
        setFormData({
            ...formData,
            unidadeCompra,
            pesoPorUnidadeKg: unidadeCompra === "kg" ? "" : pesoSugerido ? String(pesoSugerido) : formData.pesoPorUnidadeKg,
        });
    }

    async function handleSubmit() {
        if (!itemSelecionado || !formData.quantidade || !formData.precoUnitario || !formData.fornecedor.trim()) {
            Alert.alert("Atenção", "Preencha os campos obrigatórios marcados com *");
            return;
        }

        const qtd = parseFloat(formData.quantidade);
        const preco = parseFloat(formData.precoUnitario);

        if (isNaN(qtd) || qtd <= 0 || isNaN(preco) || preco <= 0) {
            Alert.alert("Atenção", "Quantidade e preço devem ser maiores que 0.");
            return;
        }
        if (formData.categoria === "medicamento" && formData.finalidadeTratamento !== "mastite" && !formData.finalidadeDescricao.trim()) {
            Alert.alert("Atenção", "Informe a finalidade do tratamento.");
            return;
        }
        if (formData.categoria === "racao" && formData.unidadeCompra !== "kg" && (isNaN(pesoPorUnidade) || pesoPorUnidade <= 0)) {
            Alert.alert("Atencao", "Informe o peso por unidade para calcular o estoque em kg.");
            return;
        }
        const dataIso = toIso(formData.data);
        if (!dataIso) {
            Alert.alert("Atenção", "Informe uma data válida (DD/MM/AAAA).");
            return;
        }
        try {
            await criarCompra({
                categoria: formData.categoria,
                item: itemSelecionado,
                quantidade: qtd,
                precoUnitario: preco,
                fornecedor: formData.fornecedor.trim(),
                data: dataIso,
                status: formData.status,
                tipoRacao: formData.categoria === "racao" ? formData.tipoRacao : null,
                unidadeCompra: formData.categoria === "racao" ? formData.unidadeCompra : null,
                pesoPorUnidadeKg: formData.categoria === "racao" && formData.unidadeCompra !== "kg" ? pesoPorUnidade : null,
                quantidadeEstoqueKg: formData.categoria === "racao" ? quantidadeEstoqueKg : null,
                finalidadeTratamento: formData.categoria === "medicamento" ? formData.finalidadeTratamento : null,
                finalidadeDescricao: formData.categoria === "medicamento" && formData.finalidadeTratamento === "outro_tratamento" ? formData.finalidadeDescricao.trim() : null,
                observacoes: formData.observacoes.trim() || null,
            });

            Toast.show({
                type: "success",
                text1: "Compra cadastrada!",
                text2: `${itemSelecionado} foi salvo com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);
        } catch (err) {
            console.error(err);
            Toast.show({
                type: "error",
                text1: "Erro ao cadastrar",
                text2: "Não foi possível salvar a compra.",
                position: "top",
                visibilityTime: 3000,
            });
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
                                <Feather name="shopping-cart" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Nova Compra
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Registre uma compra ou pedido
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="tag" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Categoria *</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                                {CATEGORIAS_CADASTRO.map((key) => {
                                    const c = CATEGORIAS[key];
                                    const ativo = formData.categoria === key;
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            onPress={() => setFormData({ ...formData, categoria: key })}
                                            activeOpacity={0.7}
                                            style={{
                                                backgroundColor: ativo ? c.bg : "#f9fafb",
                                                borderWidth: 1,
                                                borderColor: ativo ? c.text : "#e5e7eb",
                                                borderRadius: 10,
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: "500", color: ativo ? c.text : "#6b7280" }}>
                                                {c.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="package" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Item / Produto *</Text>
                        </View>
                        {formData.categoria === "racao" ? (
                            <View style={{ gap: 8 }}>
                                {TIPOS_RACAO_COMPRA.map((tipo) => {
                                    const ativo = formData.tipoRacao === tipo.key;
                                    return (
                                        <TouchableOpacity
                                            key={tipo.key}
                                            activeOpacity={0.75}
                                            onPress={() => atualizarTipoRacao(tipo.key)}
                                            style={{
                                                backgroundColor: ativo ? tipo.cor : "#f9fafb",
                                                borderWidth: 1,
                                                borderColor: ativo ? tipo.cor : "#e5e7eb",
                                                borderRadius: 10,
                                                paddingVertical: 11,
                                                paddingHorizontal: 12,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#374151" }}>
                                                {tipo.label}
                                            </Text>
                                            {ativo && <Feather name="check" size={16} color="#fff" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : formData.categoria === "medicamento" ? (
                            <View style={{ gap: 8 }}>
                                {ITENS_PRODUTO.map((item) => {
                                    const ativo = formData.itemOpcao === item.key;
                                    return (
                                        <TouchableOpacity
                                            key={item.key}
                                            activeOpacity={0.75}
                                            onPress={() => setFormData({ ...formData, itemOpcao: item.key, itemOutro: item.key === "outro" ? formData.itemOutro : "" })}
                                            style={{
                                                backgroundColor: ativo ? item.cor : "#f9fafb",
                                                borderWidth: 1,
                                                borderColor: ativo ? item.cor : "#e5e7eb",
                                                borderRadius: 10,
                                                paddingVertical: 11,
                                                paddingHorizontal: 12,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#374151" }}>
                                                {item.label}
                                            </Text>
                                            {ativo && <Feather name="check" size={16} color="#fff" />}
                                        </TouchableOpacity>
                                    );
                                })}
                                {formData.itemOpcao === "outro" && (
                                    <TextInput
                                        value={formData.itemOutro}
                                        onChangeText={(v) => setFormData({ ...formData, itemOutro: v })}
                                        placeholder="Descreva o produto/item"
                                        placeholderTextColor="#9ca3af"
                                        style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                                    />
                                )}
                            </View>
                        ) : (
                            <TextInput
                                value={formData.itemDescricao}
                                onChangeText={(v) => setFormData({ ...formData, itemDescricao: v })}
                                placeholder="Ex: Ração 25kg, Sal mineral"
                                placeholderTextColor="#9ca3af"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                        )}
                    </View>

                    {formData.categoria === "racao" && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="archive" size={16} color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Forma de compra *</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    {UNIDADES_RACAO_COMPRA.map((unidade) => {
                                        const ativo = formData.unidadeCompra === unidade.key;
                                        return (
                                            <TouchableOpacity
                                                key={unidade.key}
                                                onPress={() => atualizarUnidadeCompra(unidade.key)}
                                                activeOpacity={0.75}
                                                style={{ backgroundColor: ativo ? "#4a90e2" : "#f9fafb", borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}
                                            >
                                                <Text style={{ fontSize: 13, fontWeight: "700", color: ativo ? "#fff" : "#6b7280" }}>{unidade.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                            {formData.unidadeCompra !== "kg" && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Peso por {UNIDADES_RACAO_COMPRA.find((u) => u.key === formData.unidadeCompra)?.label.toLowerCase()} (kg)</Text>
                                    <TextInput
                                        value={formData.pesoPorUnidadeKg}
                                        onChangeText={(v) => setFormData({ ...formData, pesoPorUnidadeKg: v })}
                                        placeholder="Ex: 60"
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="decimal-pad"
                                        style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                                    />
                                </View>
                            )}
                            {quantidadeEstoqueKg !== null && quantidadeEstoqueKg > 0 && (
                                <View style={{ marginTop: 12, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#bbf7d0" }}>
                                    <Text style={{ fontSize: 12, color: "#6b7280" }}>Entrada prevista no estoque</Text>
                                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#15803d", marginTop: 2 }}>{quantidadeEstoqueKg.toFixed(2)} kg</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {formData.categoria === "medicamento" && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#fee2e2" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Feather name="heart" size={16} color="#dc2626" />
                                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Finalidade do tratamento</Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => setFormData({ ...formData, finalidadeTratamento: "mastite", finalidadeDescricao: "" })}
                                style={{
                                    backgroundColor: formData.finalidadeTratamento === "mastite" ? "#dc2626" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: formData.finalidadeTratamento === "mastite" ? "#dc2626" : "#e5e7eb",
                                    borderRadius: 10,
                                    paddingVertical: 11,
                                    paddingHorizontal: 12,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: "600", color: formData.finalidadeTratamento === "mastite" ? "#fff" : "#374151" }}>
                                    Mastite
                                </Text>
                                {formData.finalidadeTratamento === "mastite" && <Feather name="check" size={16} color="#fff" />}
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => setFormData({ ...formData, finalidadeTratamento: "outro_tratamento" })}
                                style={{
                                    backgroundColor: formData.finalidadeTratamento === "outro_tratamento" ? "#4a90e2" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: formData.finalidadeTratamento === "outro_tratamento" ? "#4a90e2" : "#e5e7eb",
                                    borderRadius: 10,
                                    paddingVertical: 11,
                                    paddingHorizontal: 12,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: "600", color: formData.finalidadeTratamento === "outro_tratamento" ? "#fff" : "#374151" }}>
                                    Outro tratamento
                                </Text>
                                {formData.finalidadeTratamento === "outro_tratamento" && <Feather name="check" size={16} color="#fff" />}
                            </TouchableOpacity>
                            {formData.finalidadeTratamento === "outro_tratamento" && (
                                <TextInput
                                    value={formData.finalidadeDescricao}
                                    onChangeText={(v) => setFormData({ ...formData, finalidadeDescricao: v })}
                                    placeholder="Digite a finalidade do tratamento"
                                    placeholderTextColor="#9ca3af"
                                    style={{ marginTop: 8, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                                />
                            )}
                        </View>
                    )}

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                <Feather name="hash" size={14} color="#4a90e2" />
                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Qtd *</Text>
                            </View>
                            <TextInput
                                value={formData.quantidade}
                                onChangeText={(v) => setFormData({ ...formData, quantidade: v })}
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                                keyboardType="decimal-pad"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                <Feather name="dollar-sign" size={14} color="#4a90e2" />
                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Preço Un. *</Text>
                            </View>
                            <TextInput
                                value={formData.precoUnitario}
                                onChangeText={(v) => setFormData({ ...formData, precoUnitario: v })}
                                placeholder="0.00"
                                placeholderTextColor="#9ca3af"
                                keyboardType="decimal-pad"
                                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                            />
                        </View>
                    </View>

                    {total > 0 && (
                        <View style={{ backgroundColor: "rgba(74,144,226,0.1)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(74,144,226,0.2)" }}>
                            <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Valor Total</Text>
                            <Text style={{ fontSize: 26, fontWeight: "700", color: "#4a90e2" }}>
                                R$ {total.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="truck" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Fornecedor *</Text>
                        </View>
                        <TextInput
                            value={formData.fornecedor}
                            onChangeText={(v) => setFormData({ ...formData, fornecedor: v })}
                            placeholder="Nome do fornecedor"
                            placeholderTextColor="#9ca3af"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                        />
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Data <Text style={{ color: "#ef4444" }}>*</Text></Text>
                        </View>
                        <DateInput
                            value={formData.data}
                            onChange={(v) => setFormData({ ...formData, data: v })}
                        />
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="activity" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Status Inicial</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {([
                                { key: "pendente" as StatusCompra, label: "Pendente", cor: "#eab308" },
                                { key: "concluido" as StatusCompra, label: "Concluído", cor: "#22c55e" },
                            ]).map((s) => {
                                const ativo = formData.status === s.key;
                                return (
                                    <TouchableOpacity
                                        key={s.key}
                                        onPress={() => setFormData({ ...formData, status: s.key })}
                                        activeOpacity={0.7}
                                        style={{
                                            flex: 1,
                                            backgroundColor: ativo ? s.cor : "#f9fafb",
                                            borderWidth: 1,
                                            borderColor: ativo ? s.cor : "#e5e7eb",
                                            borderRadius: 10,
                                            paddingVertical: 10,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#6b7280" }}>
                                            {s.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="edit-3" size={16} color="#6b7280" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Observações <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.observacoes}
                            onChangeText={(v) => setFormData({ ...formData, observacoes: v })}
                            placeholder="Observações adicionais..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 80 }}
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
