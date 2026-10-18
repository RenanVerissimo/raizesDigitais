import { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity
} from "react-native";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getUsuarioLogado } from "../../services/api";
import {
    listaDeTarefasOffline,
    novaTarefa
} from "../../services/offline/sincronizacaoOffline";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatarData } from "../../utils/formatters";
import { opcoesStatusReprodutivo } from "../../utils/statusReprodutivo";

function visualArea(area: string) {
    if (area === "Estoque de Ração") return { icone: "package" as const, cor: "#a16207", fundo: "#fef9c3" };
    if (area === "Animais") return { icone: "heart" as const, cor: "#16836b", fundo: "#e8f6ef" };
    if (area === "Estoque de Leite") return { icone: "archive" as const, cor: "#8655be", fundo: "#f2ecfa" };
    return { icone: "droplet" as const, cor: "#357abd", fundo: "#eaf3fe" };
}

const rotulos: Record<string, string> = {
    racaoNome: "Ração", racaoId: "Ração (número)", quantidade: "Quantidade", unidade: "Unidade", destino: "Destino",
    dataRegistro: "Data do registro",
    date: "Data", dailyProduction: "Quantidade", tanqueId: "Tanque (número)",
    notes: "Observações", nome: "Nome", identificador: "Identificação",
    status: "Status", producao_media_diaria: "Produção média diária",
    raca: "Raça", peso: "Peso", descricao: "Descrição",
    data_nascimento: "Nascimento", data_ultimo_parto: "Último parto",
    dias_descarte_leite: "Descarte de leite", status_reprodutivo: "Status reprodutivo",
    vaca_vazia: "Vaca vazia", prenha: "Prenha", em_cio: "Em cio",
    abortou: "Abortou", nao_emprenha: "Não emprenha", mastite: "Mastite",
    tratamento_mastite: "Tratamento da mastite", doente: "Doente",
    doenca: "Doença", descricao_doenca: "Descrição da doença",
    data_reproducao: "Reprodução", data_base_gestacao: "Base da gestação",
    data_cobertura: "Cobertura", data_inseminacao: "Inseminação",
    data_confirmacao_prenhez: "Confirmação da prenhez", tipo: "Tipo",
    volume: "Volume", data: "Data", motivo: "Motivo", comprador: "Comprador",
    temperatura: "Temperatura", consumoProprio: "Consumo próprio",
    observacoes: "Observações", tanqueNome: "Tanque",
};

function valorFormatado(chave: string, valor: unknown): string {
    if (typeof valor === "boolean") return valor ? "Sim" : "Não";
    if (typeof valor === "number") {
        const unidade = ["dailyProduction", "volume", "consumoProprio"].includes(chave)
            ? " L" : chave === "producao_media_diaria" ? " L/dia"
            : chave === "peso" ? " kg" : chave === "temperatura" ? " °C"
            : chave === "dias_descarte_leite" ? " dias" : "";
        return `${valor.toLocaleString("pt-BR")}${unidade}`;
    }
    if (typeof valor === "string") {
        if (["date", "data"].includes(chave) || chave.startsWith("data_")) {
            return formatarData(valor, false);
        }
        if (chave === "status_reprodutivo") {
            return opcoesStatusReprodutivo.find(opcao => opcao.key === valor)?.label ?? valor;
        }
        const nomes: Record<string, string> = {
            entrada: "Entrada", saida: "Saída", ativo: "Ativo", inativo: "Inativo",
            vendido: "Vendido", mastite: "Mastite", parasitas: "Parasitas", outra: "Outra",
        };
        return ["tipo", "status", "doenca"].includes(chave) ? nomes[valor] ?? valor : valor;
    }
    return JSON.stringify(valor);
}

function DadosTarefa({ tarefa }: { tarefa: novaTarefa }) {
    const [expandido, setExpandido] = useState(false);
    const visual = visualArea(tarefa.area);
    const essenciais = tarefa.area === "Produção de Leite" ? ["dailyProduction"]
        : tarefa.area === "Animais" ? ["identificador"]
        : tarefa.area === "Estoque de Leite" ? ["tipo", "volume", "consumoProprio"]
        : tarefa.area === "Estoque de Ração" ? [tarefa.dados.racaoNome ? "racaoNome" : "racaoId", "quantidade", "unidade"] : [];
    const preenchidos = Object.entries(tarefa.dados).filter(([chave, valor]) =>
        chave !== "idempotencyKey" &&
        !(tarefa.area === "Estoque de Leite" && ["volume", "consumoProprio"].includes(chave) && Number(valor) === 0) &&
        valor !== null && valor !== undefined && !(typeof valor === "string" && valor.trim() === "")
    );
    const resumo: [string, unknown][] = tarefa.area === "Animais"
        ? [
            ["identificador", tarefa.dados.identificador ?? "Sem ID"],
        ]
        : essenciais.flatMap(chave => preenchidos.filter(([campo]) => campo === chave));
    const detalhes = preenchidos.filter(([chave]) => !essenciais.includes(chave));
    function campo([chave, valor]: [string, unknown]) {
        return (
            <Text key={chave} style={{ color: "#374151", lineHeight: 22 }}>
                <Text style={{ fontWeight: "600" }}>{rotulos[chave] ?? chave.replace(/_/g, " ")}: </Text>
                {valorFormatado(chave, valor)}
            </Text>
        );
    }
    return (
        <View style={{ gap: 6, marginTop: 8 }}>
            {resumo.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {resumo.map(([chave, valor]) => (
                        <View key={chave} style={{ flexDirection: "row", alignItems: "baseline", columnGap: 6, paddingRight: 12, paddingVertical: 2 }}>
                            <Text style={{ color: "#748094", fontSize: 11, fontWeight: "600" }}>{tarefa.area === "Estoque de Leite" && tarefa.dados.tipo === "saida" && chave === "volume" ? "Entrega/Venda" : rotulos[chave] ?? chave}</Text>
                            <Text style={{ color: "#23334b", fontSize: 15, fontWeight: "600" }}>{valorFormatado(chave, valor)}</Text>
                        </View>
                    ))}
                </View>
            )}
            {detalhes.length > 0 && (
                <>
                    <TouchableOpacity
                        onPress={() => setExpandido(anterior => !anterior)}
                        accessibilityRole="button"
                        accessibilityLabel={expandido ? "Ocultar detalhes do registro" : "Ver detalhes do registro"}
                        accessibilityState={{ expanded: expandido }}
                        activeOpacity={0.7}
                        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#edf0f5", minHeight: 44 }}
                    >
                        <Text style={{ color: visual.cor, fontWeight: "600", fontSize: 13, textAlign: "center" }}>{expandido ? "Ocultar detalhes" : "Ver detalhes"}</Text>
                        <Feather name={expandido ? "chevron-up" : "chevron-down"} size={18} color={visual.cor} />
                    </TouchableOpacity>
                    {expandido && <View style={{ paddingBottom: 8, gap: 4 }}>{detalhes.map(campo)}</View>}
                </>
            )}
        </View>
    );
}


export default function TarefasOffline() {

    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [tarefas, setTarefas] = useState<novaTarefa[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);


    function voltar() {
        navigation.goBack();
    }


    useFocusEffect(useCallback(() => {
        let ativo = true;
        setCarregando(true);
        setErro(null);
        setTarefas([]);

        async function carregarTarefas() {
            try {
                const usuario = await getUsuarioLogado();
                const tarefasSalvas = usuario ? await listaDeTarefasOffline(usuario.id) : [];
                const tarefasOrdenadas = [...tarefasSalvas].sort(
                    (a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime()
                );
                if (ativo) setTarefas(tarefasOrdenadas);
            } catch {
                if (ativo) setErro("Não foi possível carregar as tarefas salvas.");
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        void carregarTarefas();
        return () => { ativo = false; };
    }, []));


    return (
        <View style={{ flex: 1, backgroundColor: "#f3f6fb" }}>
            <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, backgroundColor: "#357abd", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity onPress={voltar} accessibilityRole="button" accessibilityLabel="Voltar" style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 23, fontWeight: "700", color: "#fff" }}>Tarefas offline</Text>
                        <Text style={{ color: "#dceafd", fontSize: 13, marginTop: 4 }}>Seus registros salvos neste aparelho</Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, backgroundColor: "rgba(255,255,255,0.12)", padding: 14, borderRadius: 16 }}>
                    <Feather name="save" size={23} color="#fff" />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{carregando ? "Carregando registros…" : `${tarefas.length} ${tarefas.length === 1 ? "registro pendente" : "registros pendentes"}`}</Text>
                        <Text style={{ color: "#dceafd", fontSize: 12, marginTop: 3 }}>Confira os dados e expanda para ver mais.</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={tarefas}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: insets.bottom + 24 }}
                ListHeaderComponent={erro ? <View accessibilityRole="alert" style={{ backgroundColor: "#fff0ef", padding: 14, borderRadius: 12, marginBottom: 14 }}><Text style={{ color: "#b91c1c" }}>{erro}</Text></View> : null}
                ListEmptyComponent={
                    carregando ? <ActivityIndicator size="large" color="#357abd" style={{ marginTop: 40 }} /> : !erro ? (
                        <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
                            <View style={{ backgroundColor: "#e6effb", borderRadius: 28, padding: 18, marginBottom: 18 }}><Feather name="check-circle" size={30} color="#357abd" /></View>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#23334b" }}>Tudo em dia por aqui</Text>
                            <Text style={{ color: "#748094", textAlign: "center", lineHeight: 21, marginTop: 8 }}>Os registros que você salvar offline aparecerão aqui.</Text>
                        </View>
                    ) : null
                }
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const visual = visualArea(item.area);
                    return (
                        <View style={{ backgroundColor: "#fff", padding: 12, paddingBottom: 2, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#e7edf5" }}>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", columnGap: 12, rowGap: 4, marginBottom: 10 }}>
                                <Text style={{ fontSize: 16, fontWeight: "900", color: "#6b7280" }}>{item.acao}</Text>
                                <Text style={{ color: "#748094", fontSize: 11 }}>
                                    {new Date(item.criadaEm).toLocaleDateString("pt-BR")} às {new Date(item.criadaEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: visual.fundo, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderLeftWidth: 3, borderLeftColor: visual.cor }}>
                                <View style={{ width: 24, height: 26, alignItems: "center", justifyContent: "center" }}>
                                    {item.area === "Animais" ? (
                                        <MaterialCommunityIcons name="cow" size={23} color={visual.cor} />
                                    ) : (
                                        <Feather name={visual.icone} size={18} color={visual.cor} />
                                    )}
                                </View>
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Text style={{ fontSize: 17, fontWeight: "800", color: visual.cor }}>{item.area}</Text>
                                </View>
                            </View>
                            <DadosTarefa tarefa={item} />
                        </View>
                    );
                }}
            />
        </View>
    );
}
