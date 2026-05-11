import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StatusBar, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CategoriaCompra, Compra, FinalidadeTratamento, StatusCompra, TipoRacaoCompra, UnidadeCompraRacao } from "../../interfaces/interfaces";
import { CATEGORIAS } from "./compras_e_pedidos";
import Toast from "react-native-toast-message";
import { atualizarCompra, atualizarStatusCompra, listarAnimais } from "../../services/api";

const FINALIDADES_TRATAMENTO: { key: FinalidadeTratamento; label: string; cor: string }[] = [
    { key: "mastite", label: "Mastite", cor: "#dc2626" },
    { key: "outro_tratamento", label: "Outro tratamento", cor: "#f59e0b" },
    { key: "uso_geral", label: "Uso geral", cor: "#6b7280" },
];

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
    { key: "vitaminas", label: "Vitaminas", cor: "#2563eb" },
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

function obterOpcaoItem(item: string): ItemProdutoOpcao {
    const normalizado = item.trim().toLowerCase();
    const encontrado = ITENS_PRODUTO.find((opcao) => opcao.label.toLowerCase() === normalizado);
    return encontrado?.key || "outro";
}

function obterTipoRacao(compra: Compra): TipoRacaoCompra {
    if (compra.tipoRacao) return compra.tipoRacao;
    const normalizado = compra.item.trim().toLowerCase();
    return TIPOS_RACAO_COMPRA.find((tipo) => tipo.label.toLowerCase() === normalizado)?.key || "milho";
}

export default function EditarCompra() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const compraOriginal: Compra = route.params.compra;

    const [formData, setFormData] = useState({
        categoria: compraOriginal.categoria as CategoriaCompra,
        tipoRacao: obterTipoRacao(compraOriginal),
        unidadeCompra: (compraOriginal.unidadeCompra || "kg") as UnidadeCompraRacao,
        pesoPorUnidadeKg: compraOriginal.pesoPorUnidadeKg == null ? "" : String(compraOriginal.pesoPorUnidadeKg),
        itemOpcao: obterOpcaoItem(compraOriginal.item),
        itemOutro: obterOpcaoItem(compraOriginal.item) === "outro" ? compraOriginal.item : "",
        itemDescricao: compraOriginal.categoria === "medicamento" ? "" : compraOriginal.item,
        quantidade: String(compraOriginal.quantidade),
        precoUnitario: String(compraOriginal.precoUnitario),
        fornecedor: compraOriginal.fornecedor,
        data: compraOriginal.data.split("T")[0],
        status: compraOriginal.status as StatusCompra,
        finalidadeTratamento: (compraOriginal.finalidadeTratamento || "uso_geral") as FinalidadeTratamento,
        finalidadeDescricao: compraOriginal.finalidadeDescricao || "",
        observacoes: compraOriginal.observacoes || "",
    });
    const [opcoesDoencas, setOpcoesDoencas] = useState<string[]>([]);

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

    useEffect(() => {
        listarAnimais()
            .then((animais) => {
                const doencas = Array.from(new Set(
                    animais
                        .map((animal) => animal.descricao_doenca?.trim())
                        .filter((doenca): doenca is string => !!doenca)
                ));
                setOpcoesDoencas(doencas);
            })
            .catch(() => setOpcoesDoencas([]));
    }, []);

    const STATUS_OPCOES: { key: StatusCompra; label: string; cor: string }[] = [
        { key: "pendente", label: "Pendente", cor: "#eab308" },
        { key: "concluido", label: "Concluído", cor: "#22c55e" },
        { key: "cancelado", label: "Cancelado", cor: "#ef4444" },
    ];

    function handleCancelar() {
       navigation.goBack();
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
        const apenasStatusMudou =
            formData.status !== compraOriginal.status &&
            formData.categoria === compraOriginal.categoria &&
            formData.tipoRacao === (compraOriginal.tipoRacao || obterTipoRacao(compraOriginal)) &&
            formData.unidadeCompra === (compraOriginal.unidadeCompra || "kg") &&
            formData.pesoPorUnidadeKg === (compraOriginal.pesoPorUnidadeKg == null ? "" : String(compraOriginal.pesoPorUnidadeKg)) &&
            itemSelecionado === compraOriginal.item &&
            formData.quantidade === String(compraOriginal.quantidade) &&
            formData.precoUnitario === String(compraOriginal.precoUnitario) &&
            formData.fornecedor.trim() === compraOriginal.fornecedor &&
            formData.finalidadeTratamento === (compraOriginal.finalidadeTratamento || "uso_geral") &&
            formData.finalidadeDescricao.trim() === (compraOriginal.finalidadeDescricao || "") &&
            formData.observacoes.trim() === (compraOriginal.observacoes || "");

        if (apenasStatusMudou) {
            try {
                await atualizarStatusCompra(compraOriginal.id, formData.status);
                Toast.show({
                    type: "success",
                    text1: "Status atualizado!",
                    text2: `Compra marcada como ${formData.status === "concluido" ? "concluída" : formData.status}.`,
                    position: "top",
                    visibilityTime: 3000,
                });
                setTimeout(() => navigation.goBack(), 500);
            } catch (err) {
                console.error(err);
                Toast.show({
                    type: "error",
                    text1: "Erro ao atualizar status",
                    text2: "Não foi possível alterar o status da compra.",
                    position: "top",
                    visibilityTime: 3000,
                });
            }
            return;
        }

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
        if (formData.categoria === "medicamento" && formData.finalidadeTratamento === "outro_tratamento" && !formData.finalidadeDescricao.trim()) {
            Alert.alert("Atenção", "Selecione ou informe a doença relacionada ao tratamento.");
            return;
        }

        if (formData.categoria === "racao" && formData.unidadeCompra !== "kg" && (isNaN(pesoPorUnidade) || pesoPorUnidade <= 0)) {
            Alert.alert("AtenÃ§Ã£o", "Informe o peso por unidade para calcular o estoque em kg.");
            return;
        }

        try {
            await atualizarCompra(compraOriginal.id, {
                categoria: formData.categoria,
                item: itemSelecionado,
                quantidade: qtd,
                precoUnitario: preco,
                fornecedor: formData.fornecedor.trim(),
                data: formData.data,
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
                text1: "Compra atualizada!",
                text2: `${itemSelecionado} foi salvo com sucesso.`,
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
                                <Feather name="archive" size={16} color="#f59e0b" />
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
                                                style={{ backgroundColor: ativo ? "#f59e0b" : "#f9fafb", borderWidth: 1, borderColor: ativo ? "#f59e0b" : "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}
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
                            <View style={{ gap: 8 }}>
                                {FINALIDADES_TRATAMENTO.map((finalidade) => {
                                    const ativo = formData.finalidadeTratamento === finalidade.key;
                                    return (
                                        <TouchableOpacity
                                            key={finalidade.key}
                                            activeOpacity={0.75}
                                            onPress={() => setFormData({ ...formData, finalidadeTratamento: finalidade.key, finalidadeDescricao: finalidade.key === "outro_tratamento" ? formData.finalidadeDescricao : "" })}
                                            style={{
                                                backgroundColor: ativo ? finalidade.cor : "#f9fafb",
                                                borderWidth: 1,
                                                borderColor: ativo ? finalidade.cor : "#e5e7eb",
                                                borderRadius: 10,
                                                paddingVertical: 11,
                                                paddingHorizontal: 12,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#374151" }}>
                                                {finalidade.label}
                                            </Text>
                                            {ativo && <Feather name="check" size={16} color="#fff" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {formData.finalidadeTratamento === "outro_tratamento" && (
                                <View style={{ gap: 8, marginTop: 12 }}>
                                    {opcoesDoencas.length > 0 && (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={{ flexDirection: "row", gap: 8 }}>
                                                {opcoesDoencas.map((doenca) => {
                                                    const ativo = formData.finalidadeDescricao === doenca;
                                                    return (
                                                        <TouchableOpacity
                                                            key={doenca}
                                                            activeOpacity={0.75}
                                                            onPress={() => setFormData({ ...formData, finalidadeDescricao: doenca })}
                                                            style={{ backgroundColor: ativo ? "#f59e0b" : "#f9fafb", borderWidth: 1, borderColor: ativo ? "#f59e0b" : "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
                                                        >
                                                            <Text style={{ fontSize: 12, fontWeight: "600", color: ativo ? "#fff" : "#374151" }}>{doenca}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </ScrollView>
                                    )}
                                    <TextInput
                                        value={formData.finalidadeDescricao}
                                        onChangeText={(v) => setFormData({ ...formData, finalidadeDescricao: v })}
                                        placeholder="Qual doença?"
                                        placeholderTextColor="#9ca3af"
                                        style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
                                    />
                                </View>
                            )}
                        </View>
                    )}

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
