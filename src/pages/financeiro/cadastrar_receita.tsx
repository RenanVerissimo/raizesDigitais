import React, { useCallback, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StatusBar, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import DateInput from "../../components/DateInput";
import { toIso } from "../../utils/formatters";
import { criarReceita, listarAnimais } from "../../services/api";
import { Animal } from "../../interfaces/interfaces";
import Toast from "react-native-toast-message";

type TipoReceita = "leite" | "animal";
type OrigemAnimal = "cadastrado" | "manual";

function hojeBr() {
    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, "0");
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const yyyy = hoje.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function parseDecimal(valor: string) {
    return Number(valor.replace(/\./g, "").replace(",", "."));
}

export default function CadastrarReceita() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [animais, setAnimais] = useState<Animal[]>([]);
    const [dropdownAnimaisAberto, setDropdownAnimaisAberto] = useState(false);
    const [buscaAnimal, setBuscaAnimal] = useState("");
    const [formData, setFormData] = useState({
        tipoReceita: "leite" as TipoReceita,
        origemAnimal: "cadastrado" as OrigemAnimal,
        data: hojeBr(),
        litros: "",
        precoPorLitro: "",
        comprador: "",
        observacoes: "",
        animalId: "",
        animalNome: "",
        animalIdentificador: "",
        animalPeso: "",
        valorAnimal: "",
    });

    useFocusEffect(
        useCallback(() => {
            listarAnimais()
                .then((dados) => setAnimais(dados.filter((animal) => animal.status === "ativo" || !animal.status)))
                .catch(() => setAnimais([]));
        }, [])
    );

    const totalLeite = (parseDecimal(formData.litros) || 0) * (parseDecimal(formData.precoPorLitro) || 0);
    const totalAnimal = parseDecimal(formData.valorAnimal) || 0;
    const total = formData.tipoReceita === "leite" ? totalLeite : totalAnimal;
    const animalSelecionado = animais.find((animal) => String(animal.id) === formData.animalId);
    const termoBuscaAnimal = buscaAnimal.trim().toLowerCase();
    const animaisFiltrados = animais.filter((animal) => {
        const textoAnimal = `${animal.nome || ""} ${animal.identificador || ""}`.toLowerCase();
        return textoAnimal.includes(termoBuscaAnimal);
    });

    function handleCancelar() {
        navigation.goBack();
    }

    async function handleSubmit() {
        const dataIso = toIso(formData.data);
        if (!dataIso) {
            Alert.alert("Atenção", "Informe uma data válida (DD/MM/AAAA).");
            return;
        }

        if (formData.tipoReceita === "leite" && !formData.comprador.trim()) {
            Alert.alert("Atenção", "Informe o comprador.");
            return;
        }

        try {
            if (formData.tipoReceita === "leite") {
                const litros = parseDecimal(formData.litros);
                const preco = parseDecimal(formData.precoPorLitro);

                if (!litros || litros <= 0) {
                    Alert.alert("Atenção", "Litros inválidos.");
                    return;
                }

                if (!preco || preco <= 0) {
                    Alert.alert("Atenção", "Preço inválido.");
                    return;
                }

                const nova = await criarReceita({
                    tipoReceita: "leite",
                    data: dataIso,
                    litros,
                    precoPorLitro: preco,
                    comprador: formData.comprador.trim(),
                    observacoes: formData.observacoes.trim() || null,
                });

                route.params?.onCadastrar?.(nova);
            } else {
                const valorAnimal = parseDecimal(formData.valorAnimal);
                const animalPeso = formData.origemAnimal === "manual" && formData.animalPeso.trim() ? parseDecimal(formData.animalPeso) : null;

                if (!valorAnimal || valorAnimal <= 0) {
                    Alert.alert("Atenção", "Informe o valor da venda do animal.");
                    return;
                }

                if (formData.origemAnimal === "cadastrado" && !formData.animalId) {
                    Alert.alert("Atenção", "Selecione o animal vendido.");
                    return;
                }

                if (formData.origemAnimal === "manual" && !formData.animalNome.trim()) {
                    Alert.alert("Atenção", "Informe o nome ou descrição do animal vendido.");
                    return;
                }

                const nova = await criarReceita({
                    tipoReceita: "animal",
                    data: dataIso,
                    animalId: formData.origemAnimal === "cadastrado" ? Number(formData.animalId) : null,
                    animalNome: formData.origemAnimal === "manual" ? formData.animalNome.trim() : animalSelecionado?.nome || null,
                    animalIdentificador: formData.origemAnimal === "manual" ? formData.animalIdentificador.trim() || null : animalSelecionado?.identificador || null,
                    animalPeso,
                    valorAnimal,
                    comprador: formData.comprador.trim(),
                    observacoes: formData.observacoes.trim() || null,
                });

                route.params?.onCadastrar?.(nova);
            }

            Toast.show({
                type: "success",
                text1: "Receita cadastrada!",
                text2: formData.tipoReceita === "animal" ? "A venda do animal foi registrada." : "A venda de leite foi registrada.",
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.goBack(), 500);
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao cadastrar",
                text2: error.message || "Não foi possível cadastrar a receita.",
                position: "top",
                visibilityTime: 3000,
            });
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="dollar-sign" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Nova Receita</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Registre uma venda de leite ou animal
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a0a0a", marginBottom: 12 }}>Tipo de venda</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <OpcaoTipo
                                ativo={formData.tipoReceita === "leite"}
                                icone="droplet"
                                label="Leite"
                                onPress={() => setFormData({ ...formData, tipoReceita: "leite" })}
                            />
                            <OpcaoTipo
                                ativo={formData.tipoReceita === "animal"}
                                icone="cow"
                                label="Animal"
                                onPress={() => setFormData({ ...formData, tipoReceita: "animal" })}
                            />
                        </View>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Data da Venda <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                        </View>
                        <DateInput value={formData.data} onChange={(v) => setFormData({ ...formData, data: v })} />
                    </View>

                    {formData.tipoReceita === "leite" ? (
                        <>
                            <Campo icone="droplet" label="Litros vendidos *" valor={formData.litros}
                                onChange={(v: string) => setFormData({ ...formData, litros: v })}
                                placeholder="Ex: 500" keyboard="decimal-pad" />

                            <Campo icone="dollar-sign" label="Preço por litro *" valor={formData.precoPorLitro}
                                onChange={(v: string) => setFormData({ ...formData, precoPorLitro: v })}
                                placeholder="Ex: 2,50" keyboard="decimal-pad" />
                        </>
                    ) : (
                        <View style={{ gap: 16 }}>
                            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a0a0a", marginBottom: 12 }}>Origem do animal</Text>
                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <OpcaoSimples
                                        ativo={formData.origemAnimal === "cadastrado"}
                                        label="Cadastrado"
                                        onPress={() => setFormData({ ...formData, origemAnimal: "cadastrado", animalPeso: "" })}
                                    />
                                    <OpcaoSimples
                                        ativo={formData.origemAnimal === "manual"}
                                        label="Não cadastrado"
                                        onPress={() => setFormData({ ...formData, origemAnimal: "manual", animalId: "" })}
                                    />
                                </View>
                            </View>

                            {formData.origemAnimal === "cadastrado" ? (
                                <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a0a0a", marginBottom: 12 }}>Animal vendido *</Text>
                                    {animais.length === 0 ? (
                                        <Text style={{ fontSize: 13, color: "#6b7280" }}>Nenhum animal ativo encontrado.</Text>
                                    ) : (
                                        <View>
                                            <TouchableOpacity
                                                activeOpacity={0.75}
                                                onPress={() => setDropdownAnimaisAberto((aberto) => !aberto)}
                                                style={{
                                                    backgroundColor: "#f9fafb",
                                                    borderWidth: 1,
                                                    borderColor: dropdownAnimaisAberto ? "#4a90e2" : "#e5e7eb",
                                                    borderRadius: 10,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 12,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: 10,
                                                }}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800", color: animalSelecionado ? "#111827" : "#9ca3af" }}>
                                                        {animalSelecionado ? animalSelecionado.nome : "Selecione uma vaca"}
                                                    </Text>
                                                    {animalSelecionado && (
                                                        <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                            ID: {animalSelecionado.identificador} {animalSelecionado.peso != null ? `- ${Number(animalSelecionado.peso).toFixed(1)} kg` : ""}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Feather name={dropdownAnimaisAberto ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
                                            </TouchableOpacity>

                                            {dropdownAnimaisAberto && (
                                                <View style={{ marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" }}>
                                                    <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#f9fafb" }}>
                                                        <View
                                                            style={{
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                                gap: 8,
                                                                backgroundColor: "#fff",
                                                                borderWidth: 1,
                                                                borderColor: "#e5e7eb",
                                                                borderRadius: 9,
                                                                paddingHorizontal: 10,
                                                            }}
                                                        >
                                                            <Feather name="search" size={16} color="#9ca3af" />
                                                            <TextInput
                                                                value={buscaAnimal}
                                                                onChangeText={setBuscaAnimal}
                                                                placeholder="Buscar pelo nome ou ID"
                                                                placeholderTextColor="#9ca3af"
                                                                style={{ flex: 1, minHeight: 42, fontSize: 14, color: "#111827" }}
                                                            />
                                                        </View>
                                                    </View>

                                                    {animaisFiltrados.length === 0 ? (
                                                        <Text style={{ padding: 12, fontSize: 13, color: "#6b7280" }}>Nenhum animal encontrado.</Text>
                                                    ) : (
                                                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={animaisFiltrados.length > 5} style={{ maxHeight: 310 }}>
                                                            {animaisFiltrados.map((animal, index) => (
                                                                <TouchableOpacity
                                                                    key={animal.id}
                                                                    activeOpacity={0.75}
                                                                    onPress={() => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            animalId: String(animal.id),
                                                                            animalPeso: "",
                                                                        });
                                                                        setBuscaAnimal("");
                                                                        setDropdownAnimaisAberto(false);
                                                                    }}
                                                                    style={{
                                                                        padding: 12,
                                                                        minHeight: 62,
                                                                        backgroundColor: formData.animalId === String(animal.id) ? "#eff6ff" : "#fff",
                                                                        borderBottomWidth: index < animaisFiltrados.length - 1 ? 1 : 0,
                                                                        borderBottomColor: "#f1f5f9",
                                                                    }}
                                                                >
                                                                    <Text style={{ fontSize: 14, fontWeight: "800", color: formData.animalId === String(animal.id) ? "#1d4ed8" : "#111827" }}>{animal.nome}</Text>
                                                                    <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                                        ID: {animal.identificador} {animal.peso != null ? `- ${Number(animal.peso).toFixed(1)} kg` : ""}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <>
                                    <Campo icone="tag" label="Nome/descrição do animal *" valor={formData.animalNome}
                                        onChange={(v: string) => setFormData({ ...formData, animalNome: v })}
                                        placeholder="Ex: Novilha Jersey" />
                                    <Campo icone="hash" label="Identificação" valor={formData.animalIdentificador}
                                        onChange={(v: string) => setFormData({ ...formData, animalIdentificador: v })}
                                        placeholder="Ex: BR-123, lote 02" />
                                    <Campo icone="bar-chart-2" label="Peso do animal (kg)" valor={formData.animalPeso}
                                        onChange={(v: string) => setFormData({ ...formData, animalPeso: v })}
                                        placeholder="Ex: 450" keyboard="decimal-pad" />
                                </>
                            )}

                            <Campo icone="dollar-sign" label="Valor da venda *" valor={formData.valorAnimal}
                                onChange={(v: string) => setFormData({ ...formData, valorAnimal: v })}
                                placeholder="Ex: 4500,00" keyboard="decimal-pad" />
                        </View>
                    )}

                    {formData.tipoReceita === "leite" && total > 0 && (
                        <View style={{ backgroundColor: "#f0fdf4", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#bbf7d0" }}>
                            <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Valor Total</Text>
                            <Text style={{ fontSize: 28, fontWeight: "700", color: "#16a34a" }}>
                                R$ {total.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <Campo icone="user" label={formData.tipoReceita === "animal" ? "Comprador" : "Comprador *"} valor={formData.comprador}
                        onChange={(v: string) => setFormData({ ...formData, comprador: v })}
                        placeholder={formData.tipoReceita === "animal" ? "Nome do comprador" : "Nome do comprador / laticínio"} />

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
                            multiline numberOfLines={3} textAlignVertical="top"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 80 }}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity onPress={handleCancelar} activeOpacity={0.7} style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ flex: 2 }}>
                            <LinearGradient colors={["#4a90e2", "#357abd"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
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

function OpcaoTipo({ ativo, icone, label, onPress }: { ativo: boolean; icone: "droplet" | "cow"; label: string; onPress: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", backgroundColor: ativo ? "#eff6ff" : "#f9fafb", alignItems: "center", gap: 6 }}
        >
            {icone === "cow" ? (
                <MaterialCommunityIcons name="cow" size={22} color={ativo ? "#4a90e2" : "#6b7280"} />
            ) : (
                <Feather name="droplet" size={20} color={ativo ? "#4a90e2" : "#6b7280"} />
            )}
            <Text style={{ fontSize: 13, fontWeight: "800", color: ativo ? "#1d4ed8" : "#374151" }}>{label}</Text>
        </TouchableOpacity>
    );
}

function OpcaoSimples({ ativo, label, onPress }: { ativo: boolean; label: string; onPress: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={{ flex: 1, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", backgroundColor: ativo ? "#eff6ff" : "#f9fafb", alignItems: "center" }}
        >
            <Text style={{ fontSize: 13, fontWeight: "800", color: ativo ? "#1d4ed8" : "#374151" }}>{label}</Text>
        </TouchableOpacity>
    );
}

function Campo({ icone, label, valor, onChange, placeholder, keyboard, hint }: any) {
    return (
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Feather name={icone} size={16} color="#4a90e2" />
                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>{label}</Text>
            </View>
            <TextInput
                value={valor}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboard || "default"}
                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a" }}
            />
            {hint && <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{hint}</Text>}
        </View>
    );
}
