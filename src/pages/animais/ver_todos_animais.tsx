import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Modal } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Animal } from "../../interfaces/interfaces";
import { atualizarAnimal, atualizarStatusAnimal, listarAnimais, excluirAnimal } from "../../services/api";
import ConfirmDeleteModal from "./ConfirmationModal";
import { formatarData2 } from "../../utils/formatters";
import { calcularIdade } from "../../utils/idade";
import Toast from "react-native-toast-message";



export default function VerTodosAnimais() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [animais, setAnimais] = useState<Animal[]>([]);

    useFocusEffect(
        useCallback(() => {
            listarAnimais()
                .then(setAnimais)
                .catch(() => Alert.alert("Erro", "Não foi possível carregar"));
        }, [])
    );
    const [modalVisible, setModalVisible] = useState(false);
    const [animalSelecionado, setAnimalSelecionado] = useState<Animal | null>(null);
    const [animalDetalhes, setAnimalDetalhes] = useState<Animal | null>(null);
    function handleExcluir(animal: Animal) {
        setAnimalSelecionado(animal);
        setModalVisible(true);
    }

    async function confirmarExclusao() {
        if (!animalSelecionado) return;

        const nomeExcluido = animalSelecionado.nome;

        try {
            await excluirAnimal(animalSelecionado.id);
            setAnimais((prev) => prev.filter((a) => a.id !== animalSelecionado.id));

            Toast.show({
                type: "success",
                text1: "Animal excluído",
                text2: `${nomeExcluido} foi removido com sucesso.`,
                position: "top",
                visibilityTime: 3000,
            });
        } catch {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: "Não foi possível excluir o animal.",
                position: "top",
                visibilityTime: 3000,
            });
        } finally {
            setModalVisible(false);
            setAnimalSelecionado(null);
        }
    }

    async function alternarStatusAnimal(animal: Animal) {
        if (animal.status === "vendido") {
            Toast.show({
                type: "info",
                text1: "Animal vendido",
                text2: "Esse animal foi marcado como vendido pela receita registrada.",
                position: "top",
                visibilityTime: 2500,
            });
            return;
        }
        const statusAtual = animal.status === "inativo" ? "inativo" : "ativo";
        const novoStatus = statusAtual === "ativo" ? "inativo" : "ativo";

        try {
            try {
                await atualizarStatusAnimal(animal.id, novoStatus);
            } catch {
                await atualizarAnimal(animal.id, {
                    nome: animal.nome,
                    identificador: animal.identificador,
                    status: novoStatus,
                    producao_media_diaria: animal.producao_media_diaria ?? null,
                    raca: animal.raca ?? null,
                    peso: animal.peso ?? null,
                    descricao: animal.descricao ?? null,
                    data_nascimento: animal.data_nascimento?.slice(0, 10),
                    data_ultimo_parto: animal.data_ultimo_parto?.slice(0, 10) || null,
                    prenha: Number(animal.prenha) === 1,
                    em_cio: Number(animal.em_cio) === 1,
                    abortou: Number(animal.abortou) === 1,
                    nao_emprenha: Number(animal.nao_emprenha) === 1,
                    mastite: Number(animal.mastite) === 1,
                    tratamento_mastite: animal.tratamento_mastite ?? null,
                    doente: Number(animal.doente) === 1,
                    doenca: animal.doenca ?? null,
                    descricao_doenca: animal.descricao_doenca ?? null,
                    data_cobertura: animal.data_cobertura?.slice(0, 10) || null,
                    data_inseminacao: animal.data_inseminacao?.slice(0, 10) || null,
                    data_confirmacao_prenhez: animal.data_confirmacao_prenhez?.slice(0, 10) || null,
                });
            }
            setAnimais((prev) => prev.map((item) => (
                item.id === animal.id ? { ...item, status: novoStatus } : item
            )));
            Toast.show({
                type: "success",
                text1: novoStatus === "ativo" ? "Animal ativado" : "Animal inativado",
                text2: `${animal.nome} agora está ${novoStatus}.`,
                position: "top",
                visibilityTime: 2500,
            });
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao atualizar status",
                text2: err.message || "Não foi possível alterar o status do animal.",
                position: "top",
                visibilityTime: 3000,
            });
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24,
                        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Todos os Animais
                            </Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {animais.length} {animais.length === 1 ? "animal" : "animais"} no total
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 10, paddingBottom: insets.bottom + 20 }}>
                    {animais.length === 0 ? (
                        <View style={{ alignItems: "center", paddingVertical: 60 }}>
                            <MaterialCommunityIcons name="cow" size={56} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>
                                Nenhum animal cadastrado
                            </Text>
                        </View>
                    ) : (
                        animais.map((animal) => (
                            <CardAnimal
                                key={animal.id}
                                animal={animal}
                                onAbrirDetalhes={() => setAnimalDetalhes(animal)}
                                onEditar={() => navigation.navigate("editar_animais", { animal })}
                                onExcluir={() => handleExcluir(animal)}
                                onAlternarStatus={() => alternarStatusAnimal(animal)}
                            />
                        ))
                    )}
                    <ConfirmDeleteModal
                        visible={modalVisible}
                        title="Excluir animal"
                        nomeAnimal={animalSelecionado?.nome || ""}
                        onCancel={() => setModalVisible(false)}
                        onConfirm={confirmarExclusao}
                    />
                    <DetalhesAnimalModal
                        visible={!!animalDetalhes}
                        animal={animalDetalhes}
                        onClose={() => setAnimalDetalhes(null)}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

function CardAnimal({ animal, onAbrirDetalhes, onEditar, onExcluir, onAlternarStatus }: { animal: Animal; onAbrirDetalhes: () => void; onEditar: () => void; onExcluir: () => void; onAlternarStatus: () => void }) {

    const inativo = animal.status === "inativo";
    const vendido = animal.status === "vendido";
    const destacado = inativo || vendido;
    const statusLabel = vendido ? "Vendida" : inativo ? "Inativa" : "Ativa";
    const statusBg = vendido ? "#fee2e2" : inativo ? "#e5e7eb" : "#dcfce7";
    const statusText = vendido ? "#b91c1c" : inativo ? "#4b5563" : "#15803d";

    return (
        <TouchableOpacity
            activeOpacity={0.86}
            onPress={onAbrirDetalhes}
            style={{ backgroundColor: destacado ? "#f3f4f6" : "#fff", borderWidth: 1, borderColor: destacado ? "#d1d5db" : "#e5e7eb", borderRadius: 12, padding: 14, opacity: destacado ? 0.82 : 1 }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            backgroundColor: destacado ? "#e5e7eb" : "rgba(74,144,226,0.1)",
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <MaterialCommunityIcons name="cow" size={22} color={destacado ? "#6b7280" : "#4a90e2"} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                            <Text style={{ flexShrink: 1, minWidth: 0, fontSize: 15, fontWeight: "600", color: destacado ? "#6b7280" : "#0a0a0a", lineHeight: 20 }} numberOfLines={2}>
                                {animal.nome}
                            </Text>
                            <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                <Text style={{ fontSize: 10, fontWeight: "800", color: statusText }}>
                                    {statusLabel}
                                </Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }} numberOfLines={1}>
                            ID: {animal.identificador}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }} numberOfLines={1}>
                            Raça: {animal.raca || "—"}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Idade: {calcularIdade(animal.data_nascimento)}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Nascimento: {formatarData2(animal.data_nascimento)}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Último parto: {animal.data_ultimo_parto ? formatarData2(animal.data_ultimo_parto) : "—"}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af" }} numberOfLines={1}>
                            Peso: {animal.peso != null ? `${Number(animal.peso).toFixed(1)} kg` : "—"}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }} numberOfLines={2}>
                            Descrição: {animal.descricao || "—"}
                        </Text>
                        {Number(animal.mastite) === 1 && (
                            <View style={{ alignSelf: "flex-start", backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 }}>
                                <Text style={{ fontSize: 11, color: "#dc2626", fontWeight: "600" }}>Mastite</Text>
                            </View>
                        )}
                        {Number(animal.doente) === 1 && animal.doenca === "outra" && (
                            <View style={{ alignSelf: "flex-start", backgroundColor: "#dbeafe", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 }}>
                                <Text style={{ fontSize: 11, color: "#1d4ed8", fontWeight: "600" }}>
                                    {animal.descricao_doenca || "Outra doença"}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                        onPress={(event) => {
                            event.stopPropagation();
                            onEditar();
                        }}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#f59e0b",
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#f59e0b",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                    >
                        <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={(event) => {
                            event.stopPropagation();
                            onExcluir();
                        }}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#ef4444",
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#ef4444",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                    >
                        <MaterialCommunityIcons name="trash-can" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ marginTop: 10, padding: 10, backgroundColor: "#eff6ff", borderRadius: 8 }}>
                <Text style={{ fontSize: 11, color: "#6b7280" }}>Produção Média Diária</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#4a90e2" }}>
                    {animal.producao_media_diaria != null
                        ? `${Number(animal.producao_media_diaria).toFixed(1)} L/dia`
                        : "—"}
                </Text>
            </View>
            <TouchableOpacity
                onPress={(event) => {
                    event.stopPropagation();
                    onAlternarStatus();
                }}
                activeOpacity={0.78}
                style={{
                    marginTop: 10,
                    backgroundColor: inativo ? "#dcfce7" : "#f3f4f6",
                    borderWidth: 1,
                    borderColor: inativo ? "#bbf7d0" : "#d1d5db",
                    borderRadius: 10,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                }}
            >
                <MaterialCommunityIcons name={inativo ? "check-circle" : "pause-circle"} size={16} color={inativo ? "#15803d" : "#4b5563"} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: inativo ? "#15803d" : "#4b5563" }}>
                    {vendido ? "Animal vendido" : inativo ? "Ativar animal" : "Inativar animal"}
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

function detalheValor(valor?: string | number | null) {
    if (valor === null || valor === undefined || valor === "") return "—";
    return String(valor);
}

function boolTexto(valor: unknown) {
    return Number(valor) === 1 || valor === true ? "Sim" : "Não";
}

function DetalhesAnimalModal({ visible, animal, onClose }: { visible: boolean; animal: Animal | null; onClose: () => void }) {
    if (!animal) return null;

    const inativo = animal.status === "inativo";
    const vendido = animal.status === "vendido";
    const destacado = inativo || vendido;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 }}>
                <View style={{ maxHeight: "86%", backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" }}>
                    <View style={{ padding: 18, backgroundColor: destacado ? "#f3f4f6" : "#eff6ff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <MaterialCommunityIcons name="cow" size={22} color={destacado ? "#6b7280" : "#4a90e2"} />
                                    <Text style={{ flexShrink: 1, fontSize: 20, fontWeight: "900", color: "#0a0a0a" }}>
                                        {animal.nome}
                                    </Text>
                                    <View style={{ backgroundColor: vendido ? "#fee2e2" : inativo ? "#e5e7eb" : "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                        <Text style={{ fontSize: 10, fontWeight: "800", color: vendido ? "#b91c1c" : inativo ? "#4b5563" : "#15803d" }}>
                                            {vendido ? "Vendida" : inativo ? "Inativa" : "Ativa"}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>ID: {animal.identificador}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, gap: 14 }}>
                        <SecaoDetalhes titulo="Dados gerais">
                            <LinhaDetalhe label="Raça" valor={detalheValor(animal.raca)} />
                            <LinhaDetalhe label="Idade" valor={calcularIdade(animal.data_nascimento)} />
                            <LinhaDetalhe label="Nascimento" valor={formatarData2(animal.data_nascimento)} />
                            <LinhaDetalhe label="Último parto" valor={animal.data_ultimo_parto ? formatarData2(animal.data_ultimo_parto) : "—"} />
                            <LinhaDetalhe label="Peso" valor={animal.peso != null ? `${Number(animal.peso).toFixed(1)} kg` : "—"} />
                            <LinhaDetalhe label="Produção média" valor={animal.producao_media_diaria != null ? `${Number(animal.producao_media_diaria).toFixed(1)} L/dia` : "—"} />
                        </SecaoDetalhes>

                        <SecaoDetalhes titulo="Reprodução">
                            <LinhaDetalhe label="Prenha" valor={boolTexto(animal.prenha)} />
                            <LinhaDetalhe label="Em cio" valor={boolTexto(animal.em_cio)} />
                            <LinhaDetalhe label="Abortou" valor={boolTexto(animal.abortou)} />
                            <LinhaDetalhe label="Não emprenha" valor={boolTexto(animal.nao_emprenha)} />
                            <LinhaDetalhe label="Cobertura" valor={animal.data_cobertura ? formatarData2(animal.data_cobertura) : "—"} />
                            <LinhaDetalhe label="Inseminação" valor={animal.data_inseminacao ? formatarData2(animal.data_inseminacao) : "—"} />
                            <LinhaDetalhe label="Confirmação prenhez" valor={animal.data_confirmacao_prenhez ? formatarData2(animal.data_confirmacao_prenhez) : "—"} />
                        </SecaoDetalhes>

                        <SecaoDetalhes titulo="Saúde">
                            <LinhaDetalhe label="Mastite" valor={boolTexto(animal.mastite)} />
                            <LinhaDetalhe label="Tratamento mastite" valor={detalheValor(animal.tratamento_mastite)} />
                            <LinhaDetalhe label="Doente" valor={boolTexto(animal.doente)} />
                            <LinhaDetalhe label="Doença" valor={detalheValor(animal.doenca)} />
                            <LinhaDetalhe label="Descrição doença" valor={detalheValor(animal.descricao_doenca)} />
                        </SecaoDetalhes>

                        <View style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Text style={{ fontSize: 13, fontWeight: "800", color: "#0a0a0a", marginBottom: 6 }}>Descrição</Text>
                            <Text style={{ fontSize: 13, color: "#374151", lineHeight: 19 }}>
                                {animal.descricao || "—"}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function SecaoDetalhes({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f1f5f9", overflow: "hidden" }}>
            <Text style={{ fontSize: 13, fontWeight: "900", color: "#0a0a0a", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 }}>
                {titulo}
            </Text>
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
                {children}
            </View>
        </View>
    );
}

function LinhaDetalhe({ label, valor }: { label: string; valor: string }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
            <Text style={{ flex: 1, fontSize: 12, color: "#6b7280" }}>{label}</Text>
            <Text style={{ flex: 1.2, textAlign: "right", fontSize: 12, fontWeight: "700", color: "#111827" }}>{valor}</Text>
        </View>
    );
}
