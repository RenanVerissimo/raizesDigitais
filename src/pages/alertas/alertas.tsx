import React, { useEffect, useState } from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { atualizarAnimal, listarAnimais } from "../../services/api";
import { calcularAvisoDescarteLeite, calcularDataParto, calcularDataSecagem, calcularDias } from "../../utils/alerts";

type TipoAlertaSolucao = "cio" | "prenhez" | "parto" | "secagem" | "aborto" | "descarte" | "mastite" | "outra_doenca";

function Secao({ titulo, dados, cor, icone, onSelecionar, onSolucionar }: any) {
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
                    <View style={{ alignItems: "flex-end", gap: 10 }}>
                        <TouchableOpacity
                            onPress={(event: any) => {
                                event.stopPropagation?.();
                                onSolucionar(a);
                            }}
                            activeOpacity={0.8}
                            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
                        >
                            <Feather name="check-circle" size={14} color="#16a34a" />
                            <Text style={{ fontSize: 11, fontWeight: "800", color: "#16a34a" }}>Solucionar</Text>
                        </TouchableOpacity>
                        <Feather name="chevron-right" size={18} color="#d1d5db" />
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default function Alertas() {
    const [animais, setAnimais] = useState<any[]>([]);
    const [animalSelecionado, setAnimalSelecionado] = useState<any | null>(null);
    const [modalMotivosVisivel, setModalMotivosVisivel] = useState(false);
    const [alertaParaSolucionar, setAlertaParaSolucionar] = useState<any | null>(null);
    const [solucionando, setSolucionando] = useState(false);
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

    async function confirmarSolucaoAlerta() {
        if (!alertaParaSolucionar || solucionando) return;

        try {
            setSolucionando(true);
            await atualizarAnimal(alertaParaSolucionar.id, montarDadosSolucao(alertaParaSolucionar));
            setAlertaParaSolucionar(null);
            await carregar();
            Toast.show({
                type: "success",
                text1: "Alerta solucionado",
                text2: "O registro do animal foi atualizado.",
                position: "top",
                visibilityTime: 3000,
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao solucionar alerta",
                text2: error.message || "Tente novamente em alguns instantes.",
                position: "top",
                visibilityTime: 3500,
            });
        } finally {
            setSolucionando(false);
        }
    }

    // --- FILTROS BASEADOS NO SEU JSON ---

    // 1. Em Cio: No seu JSON é o campo "em_cio": 1
    const emCio = animais.filter(a => a.em_cio === 1).map(a => ({ ...a, tipoAlerta: "cio" as TipoAlertaSolucao }));

    // 2. Vacas Prenhas: No seu JSON é o campo "prenha": 1
    const vacasPrenhasBase = animais.filter(a => a.prenha === 1);
    const vacasPrenhas = vacasPrenhasBase.map(a => ({ ...a, tipoAlerta: "prenhez" as TipoAlertaSolucao }));

    // 3. Abortos: No seu JSON é o campo "abortou": 1
    const abortos = animais.filter(a => a.abortou === 1).map(a => ({ ...a, tipoAlerta: "aborto" as TipoAlertaSolucao }));

    const mastite = animais.filter(a => Number(a.mastite) === 1).map(a => ({ ...a, tipoAlerta: "mastite" as TipoAlertaSolucao }));
    const outrasDoencas = animais.filter(a => Number(a.doente) === 1 && a.doenca === "outra").map(a => ({ ...a, tipoAlerta: "outra_doenca" as TipoAlertaSolucao }));
    const descarteLeite = animais.map(a => {
        const aviso = calcularAvisoDescarteLeite(a.data_ultimo_parto, a.dias_descarte_leite);
        if (!aviso) return null;

        return {
            ...a,
            tipoAlerta: "descarte" as TipoAlertaSolucao,
            detalheAlerta: aviso.texto,
            fimDescarteLeite: aviso.fimDescarte.toISOString(),
        };
    }).filter(Boolean);

    const proximosPartos = vacasPrenhasBase.map(a => {
        const dataBaseGestacao = a.data_inseminacao || a.data_reproducao || a.data_base_gestacao || a.data_cobertura;
        if (!dataBaseGestacao) return null;

        const parto = calcularDataParto(dataBaseGestacao);
        if (!parto) return null;

        const dias = calcularDias(parto.toISOString());
        if (dias < 0 || dias > 10) return null;

        return {
            ...a,
            tipoAlerta: "parto" as TipoAlertaSolucao,
            detalheAlerta: dias === 0 ? "Parto previsto para hoje" : `Faltam ${dias} dias para o parto`,
        };
    }).filter(Boolean);

    const secagem = vacasPrenhasBase.map(a => {
        const dataBaseGestacao = a.data_inseminacao || a.data_reproducao || a.data_base_gestacao || a.data_cobertura;
        if (!dataBaseGestacao) return null;

        const dataSecagem = calcularDataSecagem(dataBaseGestacao);
        if (!dataSecagem) return null;

        const dias = calcularDias(dataSecagem.toISOString());
        if (dias < 0 || dias > 10) return null;

        return {
            ...a,
            tipoAlerta: "secagem" as TipoAlertaSolucao,
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
                    <View style={{ flex: 1, paddingRight: 34 }}>
                        <TouchableOpacity
                            onPress={() => setModalMotivosVisivel(true)}
                            activeOpacity={0.75}
                            style={{
                                position: "absolute",
                                right: 0,
                                top: 0,
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(255,255,255,0.18)",
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.28)",
                            }}
                        >
                            <Feather name="info" size={16} color="#fff" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>🚨 Central de Alertas</Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>Acompanhe os eventos importantes</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            >
                <Secao titulo="Em Cio" dados={emCio} cor="#f59e0b" icone="fire" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                <Secao titulo="Confirmado: Prenha" dados={vacasPrenhas} cor="#10b981" icone="check-circle-outline" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                <Secao titulo="Partos nos próximos 10 dias" dados={proximosPartos} cor="#3b82f6" icone="baby-carriage" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                <Secao titulo="Secagem nos próximos 10 dias" dados={secagem} cor="#8b5cf6" icone="water-off" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                <Secao titulo="Atenção: Abortos" dados={abortos} cor="#7f1d1d" icone="alert-octagon" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                <Secao titulo="Leite em descarte" dados={descarteLeite} cor="#ea580c" icone="alert-triangle" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                <Secao titulo="Saúde: Mastite" dados={mastite} cor="#dc2626" icone="medical-bag" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                <Secao titulo="Saúde: Outras Doenças" dados={outrasDoencas} cor="#1d4ed8" icone="heart-pulse" onSelecionar={setAnimalSelecionado} onSolucionar={setAlertaParaSolucionar} />

                {emCio.length === 0 && vacasPrenhas.length === 0 && proximosPartos.length === 0 && secagem.length === 0 && descarteLeite.length === 0 && abortos.length === 0 && mastite.length === 0 && outrasDoencas.length === 0 && (
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
            <MotivosAlertasModal
                visible={modalMotivosVisivel}
                onClose={() => setModalMotivosVisivel(false)}
            />
            <SolucionarAlertaModal
                animal={alertaParaSolucionar}
                salvando={solucionando}
                onClose={() => {
                    if (!solucionando) setAlertaParaSolucionar(null);
                }}
                onConfirmar={confirmarSolucaoAlerta}
            />
        </View>
    );
}

function MotivosAlertasModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const motivos = [
        { titulo: "Em cio", descricao: "Animal marcado como em cio no cadastro ou edição." },
        { titulo: "Prenhez confirmada", descricao: "Animal marcado como prenha." },
        { titulo: "Parto próximo", descricao: "Prenhez com parto previsto para os próximos 10 dias." },
        { titulo: "Secagem próxima", descricao: "Prenhez com secagem prevista para os próximos 10 dias." },
        { titulo: "Aborto", descricao: "Animal marcado com ocorrência de aborto." },
        { titulo: "Leite em descarte", descricao: "Animal com período de descarte de leite ativo após parto ou tratamento." },
        { titulo: "Mastite", descricao: "Animal marcado com mastite registrada." },
        { titulo: "Outras doenças", descricao: "Animal marcado como doente com doença diferente de mastite." },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 }}>
                <View style={{ maxHeight: "82%", backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" }}>
                    <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: "#fee2e2", backgroundColor: "#fff5f5" }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 18, fontWeight: "900", color: "#991b1b" }}>Motivos dos alertas</Text>
                                <Text style={{ fontSize: 12, color: "#7f1d1d", marginTop: 4, lineHeight: 17 }}>
                                    A central mostra animais que precisam de atenção por reprodução, saúde ou leite em descarte.
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                <Feather name="x" size={24} color="#7f1d1d" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, gap: 10 }}>
                        {motivos.map((motivo) => (
                            <View key={motivo.titulo} style={{ borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 12, padding: 12, backgroundColor: "#fff" }}>
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#111827" }}>{motivo.titulo}</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", lineHeight: 17, marginTop: 4 }}>{motivo.descricao}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function SolucionarAlertaModal({ animal, salvando, onClose, onConfirmar }: { animal: any | null; salvando: boolean; onClose: () => void; onConfirmar: () => void }) {
    if (!animal) return null;

    const titulo = tituloSolucaoAlerta(animal.tipoAlerta);

    return (
        <Modal visible={!!animal} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 }}>
                <View style={{ backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" }}>
                    <View style={{ padding: 18, backgroundColor: "#fef2f2", borderBottomWidth: 1, borderBottomColor: "#fecaca" }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 18, fontWeight: "900", color: "#991b1b" }}>Solucionar alerta?</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} disabled={salvando} style={{ padding: 4, opacity: salvando ? 0.5 : 1 }}>
                                <Feather name="x" size={24} color="#7f1d1d" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ padding: 18, gap: 12 }}>
                        <View style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Text style={{ fontSize: 13, color: "#6b7280" }}>Animal</Text>
                            <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginTop: 2 }}>{animal.nome}</Text>
                            <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>ID: {animal.identificador}</Text>
                        </View>

                        <View style={{ backgroundColor: "#fff7ed", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#fed7aa" }}>
                            <Text style={{ fontSize: 13, fontWeight: "900", color: "#9a3412" }}>{titulo}</Text>
                            <Text style={{ fontSize: 12, color: "#9a3412", lineHeight: 17, marginTop: 4 }}>
                                {descricaoSolucaoAlerta(animal.tipoAlerta)}
                            </Text>
                        </View>

                        <View style={{ backgroundColor: "#fef2f2", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#fecaca", flexDirection: "row", gap: 8 }}>
                            <Feather name="alert-triangle" size={16} color="#dc2626" />
                            <Text style={{ flex: 1, fontSize: 12, color: "#991b1b", lineHeight: 17, fontWeight: "700" }}>
                                Atenção: essa ação é irreversível. Depois de confirmar, o alerta será removido do animal.
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                            <TouchableOpacity
                                onPress={onClose}
                                disabled={salvando}
                                activeOpacity={0.85}
                                style={{ flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 13, alignItems: "center", opacity: salvando ? 0.6 : 1 }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#6b7280" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onConfirmar}
                                disabled={salvando}
                                activeOpacity={0.85}
                                style={{ flex: 1.4, backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 13, alignItems: "center", opacity: salvando ? 0.75 : 1 }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "900", color: "#fff" }}>
                                    {salvando ? "Solucionando..." : "Sim, solucionar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function montarDadosSolucao(animal: any) {
    const dados = {
        nome: animal.nome,
        identificador: animal.identificador,
        status: animal.status || "ativo",
        producao_media_diaria: animal.producao_media_diaria ?? null,
        raca: animal.raca || null,
        peso: animal.peso ?? null,
        descricao: animal.descricao || null,
        data_nascimento: dataBanco(animal.data_nascimento) || "",
        data_ultimo_parto: dataBanco(animal.data_ultimo_parto),
        dias_descarte_leite: animal.dias_descarte_leite ?? null,
        prenha: boolAnimal(animal.prenha),
        em_cio: boolAnimal(animal.em_cio),
        abortou: boolAnimal(animal.abortou),
        nao_emprenha: boolAnimal(animal.nao_emprenha),
        mastite: boolAnimal(animal.mastite),
        tratamento_mastite: animal.tratamento_mastite || null,
        doente: boolAnimal(animal.doente),
        doenca: animal.doenca || null,
        descricao_doenca: animal.descricao_doenca || null,
        data_reproducao: dataBanco(animal.data_reproducao || animal.data_base_gestacao || animal.data_cobertura),
        data_inseminacao: dataBanco(animal.data_inseminacao),
        data_confirmacao_prenhez: dataBanco(animal.data_confirmacao_prenhez),
    };

    switch (animal.tipoAlerta as TipoAlertaSolucao) {
        case "cio":
            dados.em_cio = false;
            break;
        case "prenhez":
        case "parto":
        case "secagem":
            dados.prenha = false;
            dados.data_confirmacao_prenhez = null;
            break;
        case "aborto":
            dados.abortou = false;
            break;
        case "descarte":
            dados.dias_descarte_leite = null;
            break;
        case "mastite":
            dados.mastite = false;
            dados.tratamento_mastite = null;
            dados.doente = false;
            dados.doenca = null;
            dados.descricao_doenca = null;
            break;
        case "outra_doenca":
            dados.doente = false;
            dados.doenca = null;
            dados.descricao_doenca = null;
            break;
    }

    return dados;
}

function tituloSolucaoAlerta(tipo: TipoAlertaSolucao) {
    const titulos: Record<TipoAlertaSolucao, string> = {
        cio: "O alerta de cio será removido.",
        prenhez: "O alerta de prenhez será removido.",
        parto: "O alerta de parto próximo será removido.",
        secagem: "O alerta de secagem próxima será removido.",
        aborto: "O alerta de aborto será removido.",
        descarte: "O alerta de leite em descarte será removido.",
        mastite: "O alerta de mastite será removido.",
        outra_doenca: "O alerta de outra doença será removido.",
    };
    return titulos[tipo] || "O alerta será removido.";
}

function descricaoSolucaoAlerta(tipo: TipoAlertaSolucao) {
    const descricoes: Record<TipoAlertaSolucao, string> = {
        cio: "As informações deste alerta serão removidas do animal.",
        prenhez: "As informações deste alerta serão removidas do animal.",
        parto: "As informações desta gestação serão removidas do animal.",
        secagem: "As informações desta gestação serão removidas do animal.",
        aborto: "As informações deste alerta serão removidas do animal.",
        descarte: "As informações deste alerta serão removidas do animal.",
        mastite: "As informações deste alerta serão removidas do animal.",
        outra_doenca: "As informações deste alerta serão removidas do animal.",
    };
    return descricoes[tipo] || "As informações deste alerta serão removidas do animal.";
}

function DetalhesAnimalModal({ visible, animal, onClose }: { visible: boolean; animal: any | null; onClose: () => void }) {
    if (!animal) return null;

    const inativo = animal.status === "inativo";
    const vendido = animal.status === "vendido";
    const statusLabel = vendido ? "Vendida" : inativo ? "Inativa" : "Ativa";
    const statusBg = vendido ? "#fee2e2" : inativo ? "#e5e7eb" : "#dcfce7";
    const statusText = vendido ? "#b91c1c" : inativo ? "#4b5563" : "#15803d";
    const dataBaseGestacao = animal.data_inseminacao || animal.data_reproducao || animal.data_base_gestacao || animal.data_cobertura;
    const parto = dataBaseGestacao ? calcularDataParto(dataBaseGestacao) : null;
    const secagem = dataBaseGestacao ? calcularDataSecagem(dataBaseGestacao) : null;
    const avisoDescarte = calcularAvisoDescarteLeite(animal.data_ultimo_parto, animal.dias_descarte_leite);

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
                        {avisoDescarte && (
                            <View style={{ backgroundColor: "#fff7ed", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#fed7aa", flexDirection: "row", gap: 10 }}>
                                <Feather name="alert-triangle" size={18} color="#ea580c" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "900", color: "#9a3412" }}>Antibiotico no leite / terapia de vaca seca</Text>
                                    <Text style={{ fontSize: 12, color: "#9a3412", lineHeight: 17, marginTop: 3 }}>
                                        {avisoDescarte.texto}. Descartar ate {formatarData(avisoDescarte.fimDescarte.toISOString())}.
                                    </Text>
                                </View>
                            </View>
                        )}
                        <SecaoDetalhes titulo="Dados gerais">
                            <LinhaDetalhe label="Raça" valor={detalheValor(animal.raca)} />
                            <LinhaDetalhe label="Nascimento" valor={animal.data_nascimento ? formatarData(animal.data_nascimento) : "-"} />
                            <LinhaDetalhe label="Descarte de leite" valor={animal.dias_descarte_leite ? `${animal.dias_descarte_leite} dia(s)` : "-"} />
                            <LinhaDetalhe label="Fim do descarte" valor={avisoDescarte ? formatarData(avisoDescarte.fimDescarte.toISOString()) : "-"} />
                            <LinhaDetalhe label="Último parto" valor={animal.data_ultimo_parto ? formatarData(animal.data_ultimo_parto) : "-"} />
                            <LinhaDetalhe label="Peso" valor={animal.peso != null ? `${Number(animal.peso).toFixed(1)} kg` : "-"} />
                            <LinhaDetalhe label="Produção média" valor={animal.producao_media_diaria != null ? `${Number(animal.producao_media_diaria).toFixed(1)} L/dia` : "-"} />
                        </SecaoDetalhes>

                        <SecaoDetalhes titulo="Reprodução">
                            <LinhaDetalhe label="Gestante" valor={boolTexto(animal.prenha)} />
                            <LinhaDetalhe label="Em cio" valor={boolTexto(animal.em_cio)} />
                            <LinhaDetalhe label="Abortou" valor={boolTexto(animal.abortou)} />
                            <LinhaDetalhe label="Reproducao" valor={animal.data_reproducao || animal.data_base_gestacao ? formatarData(animal.data_reproducao || animal.data_base_gestacao) : "-"} />
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

function boolAnimal(valor: unknown) {
    return Number(valor) === 1 || valor === true;
}

function dataBanco(valor?: string | null) {
    if (!valor) return null;
    return String(valor).slice(0, 10);
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
