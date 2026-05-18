import React, { useEffect, useState } from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { listarAnimais } from "../../services/api";
import { calcularDataParto, calcularDataSecagem, calcularDias } from "../../utils/alerts";

function Secao({ titulo, dados, cor, icone, onSelecionar }: any) {
    if (!dados || dados.length === 0) return null;

    return (
        <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <MaterialCommunityIcons name={icone} size={20} color={cor} />
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937" }}>
                    {titulo} <Text style={{ color: "#9ca3af", fontWeight: "400" }}>({dados.length})</Text>
                </Text>
            </View>

            {dados.map((a: any) => (
                <TouchableOpacity key={a.id} activeOpacity={0.82} onPress={() => onSelecionar(a)} style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 16,
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: "#f1f5f9",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    elevation: 2,
                }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{a.nome}</Text>
                        <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>ID: {a.identificador}</Text>
                        {a.abortou === 1 && (
                            <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: "600", marginTop: 4 }}>Ocorreu um aborto</Text>
                        )}
                        {a.mastite === 1 && (
                            <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600", marginTop: 4 }}>Mastite registrada</Text>
                        )}
                        {Number(a.doente) === 1 && a.doenca === "outra" && (
                            <Text style={{ fontSize: 12, color: "#1d4ed8", fontWeight: "600", marginTop: 4 }}>
                                Doença: {a.descricao_doenca || "Outra"}
                            </Text>
                        )}
                        {a.detalheAlerta && (
                            <Text style={{ fontSize: 12, color: cor, fontWeight: "700", marginTop: 4 }}>
                                {a.detalheAlerta}
                            </Text>
                        )}
                    </View>
                    <Feather name="chevron-right" size={18} color="#d1d5db" />
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default function Alertas() {
    const [animais, setAnimais] = useState<any[]>([]);
    const [animalSelecionado, setAnimalSelecionado] = useState<any | null>(null);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        try {
            const data = await listarAnimais();
            setAnimais(data || []);
        } catch (error) {
            console.error("Erro ao carregar alertas:", error);
        }
    }

    // --- FILTROS BASEADOS NO SEU JSON ---

    // 1. Em Cio: No seu JSON é o campo "em_cio": 1
    const emCio = animais.filter(a => a.em_cio === 1);

    // 2. Vacas Prenhas: No seu JSON é o campo "prenha": 1
    const vacasPrenhas = animais.filter(a => a.prenha === 1);

    // 3. Abortos: No seu JSON é o campo "abortou": 1
    const abortos = animais.filter(a => a.abortou === 1);

    const mastite = animais.filter(a => Number(a.mastite) === 1);
    const outrasDoencas = animais.filter(a => Number(a.doente) === 1 && a.doenca === "outra");

    const proximosPartos = vacasPrenhas.map(a => {
        const dataBaseGestacao = a.data_inseminacao || a.data_cobertura;
        if (!dataBaseGestacao) return null;

        const parto = calcularDataParto(dataBaseGestacao);
        if (!parto) return null;

        const dias = calcularDias(parto.toISOString());
        if (dias < 0 || dias > 10) return null;

        return {
            ...a,
            detalheAlerta: dias === 0 ? "Parto previsto para hoje" : `Faltam ${dias} dias para o parto`,
        };
    }).filter(Boolean);

    const secagem = vacasPrenhas.map(a => {
        const dataBaseGestacao = a.data_inseminacao || a.data_cobertura;
        if (!dataBaseGestacao) return null;

        const dataSecagem = calcularDataSecagem(dataBaseGestacao);
        if (!dataSecagem) return null;

        const dias = calcularDias(dataSecagem.toISOString());
        if (dias < 0 || dias > 10) return null;

        return {
            ...a,
            detalheAlerta: dias === 0 ? "Secagem prevista para hoje" : `Faltam ${dias} dias para a secagem`,
        };
    }).filter(Boolean);

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                    paddingTop: insets.top + 16,
                    paddingHorizontal: 20,
                    paddingBottom: 24,
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>🚨 Central de Alertas</Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>Acompanhe os eventos importantes</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            >
                <Secao titulo="Em Cio" dados={emCio} cor="#f59e0b" icone="fire" onSelecionar={setAnimalSelecionado} />

                <Secao titulo="Confirmado: Prenha" dados={vacasPrenhas} cor="#10b981" icone="check-circle-outline" onSelecionar={setAnimalSelecionado} />

                <Secao titulo="Partos nos próximos 10 dias" dados={proximosPartos} cor="#3b82f6" icone="baby-carriage" onSelecionar={setAnimalSelecionado} />

                <Secao titulo="Secagem nos próximos 10 dias" dados={secagem} cor="#8b5cf6" icone="water-off" onSelecionar={setAnimalSelecionado} />

                <Secao titulo="Atenção: Abortos" dados={abortos} cor="#7f1d1d" icone="alert-octagon" onSelecionar={setAnimalSelecionado} />

                <Secao titulo="Saúde: Mastite" dados={mastite} cor="#dc2626" icone="medical-bag" onSelecionar={setAnimalSelecionado} />

                <Secao titulo="Saúde: Outras Doenças" dados={outrasDoencas} cor="#1d4ed8" icone="heart-pulse" onSelecionar={setAnimalSelecionado} />

                {emCio.length === 0 && vacasPrenhas.length === 0 && proximosPartos.length === 0 && secagem.length === 0 && abortos.length === 0 && mastite.length === 0 && outrasDoencas.length === 0 && (
                    <View style={{ alignItems: "center", marginTop: 60 }}>
                        <MaterialCommunityIcons name="check-decagram" size={60} color="#d1d5db" />
                        <Text style={{ color: "#9ca3af", fontSize: 16, marginTop: 10 }}>Nenhum alerta no momento</Text>
                    </View>
                )}
            </ScrollView>

            <DetalhesAnimalModal
                visible={!!animalSelecionado}
                animal={animalSelecionado}
                onClose={() => setAnimalSelecionado(null)}
            />
        </View>
    );
}

function DetalhesAnimalModal({ visible, animal, onClose }: { visible: boolean; animal: any | null; onClose: () => void }) {
    if (!animal) return null;

    const inativo = animal.status === "inativo";
    const vendido = animal.status === "vendido";
    const statusLabel = vendido ? "Vendida" : inativo ? "Inativa" : "Ativa";
    const statusBg = vendido ? "#fee2e2" : inativo ? "#e5e7eb" : "#dcfce7";
    const statusText = vendido ? "#b91c1c" : inativo ? "#4b5563" : "#15803d";
    const dataBaseGestacao = animal.data_inseminacao || animal.data_cobertura;
    const parto = dataBaseGestacao ? calcularDataParto(dataBaseGestacao) : null;
    const secagem = dataBaseGestacao ? calcularDataSecagem(dataBaseGestacao) : null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 }}>
                <View style={{ maxHeight: "86%", backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" }}>
                    <View style={{ padding: 18, backgroundColor: "#fff7ed", borderBottomWidth: 1, borderBottomColor: "#fed7aa" }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <MaterialCommunityIcons name="cow" size={22} color="#dc2626" />
                                    <Text style={{ flexShrink: 1, fontSize: 20, fontWeight: "900", color: "#0f172a" }}>
                                        {animal.nome}
                                    </Text>
                                    <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                        <Text style={{ fontSize: 10, fontWeight: "800", color: statusText }}>
                                            {statusLabel}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>ID: {animal.identificador}</Text>
                                {animal.detalheAlerta && (
                                    <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "800", marginTop: 4 }}>
                                        {animal.detalheAlerta}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, gap: 14 }}>
                        <SecaoDetalhes titulo="Dados gerais">
                            <LinhaDetalhe label="Raça" valor={detalheValor(animal.raca)} />
                            <LinhaDetalhe label="Nascimento" valor={animal.data_nascimento ? formatarData(animal.data_nascimento) : "-"} />
                            <LinhaDetalhe label="Último parto" valor={animal.data_ultimo_parto ? formatarData(animal.data_ultimo_parto) : "-"} />
                            <LinhaDetalhe label="Peso" valor={animal.peso != null ? `${Number(animal.peso).toFixed(1)} kg` : "-"} />
                            <LinhaDetalhe label="Produção média" valor={animal.producao_media_diaria != null ? `${Number(animal.producao_media_diaria).toFixed(1)} L/dia` : "-"} />
                        </SecaoDetalhes>

                        <SecaoDetalhes titulo="Reprodução">
                            <LinhaDetalhe label="Gestante" valor={boolTexto(animal.prenha)} />
                            <LinhaDetalhe label="Em cio" valor={boolTexto(animal.em_cio)} />
                            <LinhaDetalhe label="Abortou" valor={boolTexto(animal.abortou)} />
                            <LinhaDetalhe label="Cobertura" valor={animal.data_cobertura ? formatarData(animal.data_cobertura) : "-"} />
                            <LinhaDetalhe label="Inseminação" valor={animal.data_inseminacao ? formatarData(animal.data_inseminacao) : "-"} />
                            <LinhaDetalhe label="Confirmação prenhez" valor={animal.data_confirmacao_prenhez ? formatarData(animal.data_confirmacao_prenhez) : "-"} />
                            <LinhaDetalhe label="Parto previsto" valor={parto ? formatarData(parto.toISOString()) : "-"} />
                            <LinhaDetalhe label="Secagem prevista" valor={secagem ? formatarData(secagem.toISOString()) : "-"} />
                        </SecaoDetalhes>

                        <SecaoDetalhes titulo="Saúde">
                            <LinhaDetalhe label="Mastite" valor={boolTexto(animal.mastite)} />
                            <LinhaDetalhe label="Tratamento mastite" valor={detalheValor(animal.tratamento_mastite)} />
                            <LinhaDetalhe label="Doente" valor={boolTexto(animal.doente)} />
                            <LinhaDetalhe label="Doença" valor={detalheValor(animal.doenca)} />
                            <LinhaDetalhe label="Descrição doença" valor={detalheValor(animal.descricao_doenca)} />
                        </SecaoDetalhes>

                        <View style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Text style={{ fontSize: 13, fontWeight: "800", color: "#0f172a", marginBottom: 6 }}>Descrição</Text>
                            <Text style={{ fontSize: 13, color: "#374151", lineHeight: 19 }}>
                                {animal.descricao || "-"}
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
            <Text style={{ fontSize: 13, fontWeight: "900", color: "#0f172a", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 }}>
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

function detalheValor(valor?: string | number | null) {
    if (valor === null || valor === undefined || valor === "") return "-";
    return String(valor);
}

function boolTexto(valor: unknown) {
    return Number(valor) === 1 || valor === true ? "Sim" : "Não";
}

function formatarData(data: string) {
    const limpa = data.slice(0, 10);
    const [ano, mes, dia] = limpa.split("-").map(Number);
    if (!ano || !mes || !dia) return "-";
    return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}
