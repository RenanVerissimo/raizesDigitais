import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Button, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { Animal } from "../interfaces/interfaces";
import {
    getUsuarioLogado,
    listarAnimaisDisponiveis,
    listarTarefasAnimaisOffline,
    observarSincronizacaoAnimais,
    sincronizarAnimaisPendentes,
} from "../services/api";

type ResultadoSincronizacao = Awaited<ReturnType<typeof sincronizarAnimaisPendentes>>;

/* function mensagemDoResultado(resultado: ResultadoSincronizacao) {
    const enviados = resultado.enviados > 0
        ? `${resultado.enviados} ${resultado.enviados === 1 ? "animal enviado" : "animais enviados"} ao servidor. `
        : "";
    if (resultado.erro) return `${enviados}${resultado.erro}`;
    if (resultado.pendentes > 0) return `${enviados}${resultado.pendentes} cadastro(s) aguardando sincronização.`;
    return enviados || "Todos os animais já estão sincronizados.";
} */

export function useAnimaisComSincronizacao() {
    const [animais, setAnimais] = useState<Animal[]>([]);
    const [tarefas, setTarefas] = useState<Awaited<ReturnType<typeof listarTarefasAnimaisOffline>>>([]);
    const [carregando, setCarregando] = useState(true);
    const [sincronizando, setSincronizando] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const sincronizarEmFoco = useRef<(() => Promise<void>) | null>(null);

    useFocusEffect(useCallback(() => {
        let cancelado = false;
        let tentativaManual = false;
        let ultimaLeitura = 0;
        const usuarioInicial = getUsuarioLogado();
        setAnimais([]);
        setTarefas([]);
        setCarregando(true);
        setSincronizando(false);
        setMensagem("");

        async function mesmaConta(usuarioId?: number | null) {
            const [inicial, atual] = await Promise.all([usuarioInicial, getUsuarioLogado()]);
            return !cancelado && !!inicial && inicial.id === atual?.id
                && (usuarioId === undefined || usuarioId === inicial.id);
        }

        async function carregarAnimais() {
            const leitura = ++ultimaLeitura;
            try {
                if (!(await mesmaConta())) return;
                const [dados, tarefasPendentes] = await Promise.all([
                    listarAnimaisDisponiveis(),
                    listarTarefasAnimaisOffline(),
                ]);
                if (await mesmaConta() && leitura === ultimaLeitura) {
                    setAnimais(dados);
                    setTarefas(tarefasPendentes);
                }
            } catch {
                if (!cancelado && leitura === ultimaLeitura) {
                    setMensagem("Não foi possível atualizar a lista de animais. Tente abrir esta tela novamente.");
                }
            } finally {
                if (!cancelado && leitura === ultimaLeitura) setCarregando(false);
            }
        }

        const pararObservacao = observarSincronizacaoAnimais((resultado) => {
            void (async () => {
                if (!(await mesmaConta(resultado.usuarioId))) return;
                //setMensagem(mensagemDoResultado(resultado));
                if (resultado.enviados > 0) await carregarAnimais();
            })().catch(() => undefined);
        });

        sincronizarEmFoco.current = async () => {
            if (cancelado || tentativaManual) return;
            tentativaManual = true;
            setSincronizando(true);
            setMensagem("");
            try {
                if (!(await mesmaConta())) return;
                const resultado = await sincronizarAnimaisPendentes();
                //if (await mesmaConta(resultado.usuarioId)) setMensagem(mensagemDoResultado(resultado));
            } catch (erro) {
                if (await mesmaConta()) {
                    setMensagem(erro instanceof Error ? erro.message : "Não foi possível sincronizar. Tente novamente.");
                }
            } finally {
                tentativaManual = false;
                if (!cancelado) setSincronizando(false);
            }
        };

        void carregarAnimais();
        return () => {
            cancelado = true;
            sincronizarEmFoco.current = null;
            pararObservacao();
        };
    }, []));

    return {
        animais,
        tarefas,
        setAnimais,
        carregando,
        sincronizando,
        mensagem,
        pendentes: tarefas.length,
        sincronizarAgora: () => { void sincronizarEmFoco.current?.(); },
    };
}

export default function AnimalSyncStatus({ pendentes, sincronizando, mensagem, sincronizarAgora }: {
    pendentes: number;
    sincronizando: boolean;
    mensagem: string;
    sincronizarAgora: () => void;
}) {
    const navigation = useNavigation<any>();
    const route = useRoute();

    if (!pendentes && !mensagem && !sincronizando) return null;

    return (
        <View style={{ backgroundColor: pendentes ? "#fffbeb" : "#eff6ff", borderRadius: 12, padding: 14, gap: 10 }}>
            {pendentes > 0 && (
                <>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <AntDesign
                            name="cloud-sync"
                            size={24}
                            color="#ff0000"
                        />

                        <Text
                            style={{
                                fontSize: 30,
                                color: "#ff0000",
                                fontWeight: "bold",
                            }}
                        >
                            Sincronização pendente
                        </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: "#ff0000", lineHeight: 19, textAlign: "center", alignSelf: "center", top: 4 }}>
                        As operações estão salvas neste aparelho e serão enviadas quando houver conexão com o servidor.
                    </Text>
                </>
            )}
            {!!mensagem && (
                <Text accessibilityLiveRegion="polite" style={{ fontSize: 13, color: "#374151", lineHeight: 19 }}>
                    {mensagem}
                </Text>
            )}

            {route.name !== "tarefasAsync" && (
                <TouchableOpacity
                    onPress={() => navigation.navigate("tarefasAsync")}
                    style={{
                        alignSelf: "stretch",
                        backgroundColor: "#4a90e2",
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.12,
                        shadowRadius: 6,
                        elevation: 3,
                    }}
                >
                    <AntDesign name="cloud-sync" size={18} color="#ffffff" />
                    <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
                        Visualizar as Tarefas Offline
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
