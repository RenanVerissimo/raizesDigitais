import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Animal } from "../interfaces/interfaces";
import {
    getUsuarioLogado,
    listarAnimaisDisponiveis,
    observarSincronizacaoAnimais,
    sincronizarAnimaisPendentes,
} from "../services/api";

type ResultadoSincronizacao = Awaited<ReturnType<typeof sincronizarAnimaisPendentes>>;

function mensagemDoResultado(resultado: ResultadoSincronizacao) {
    const enviados = resultado.enviados > 0
        ? `${resultado.enviados} ${resultado.enviados === 1 ? "animal enviado" : "animais enviados"} ao servidor. `
        : "";
    if (resultado.erro) return `${enviados}${resultado.erro}`;
    if (resultado.pendentes > 0) return `${enviados}${resultado.pendentes} cadastro(s) aguardando sincronização.`;
    return enviados || "Todos os animais já estão sincronizados.";
}

export function useAnimaisComSincronizacao() {
    const [animais, setAnimais] = useState<Animal[]>([]);
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
                const dados = await listarAnimaisDisponiveis();
                if (await mesmaConta() && leitura === ultimaLeitura) setAnimais(dados);
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
                setMensagem(mensagemDoResultado(resultado));
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
                if (await mesmaConta(resultado.usuarioId)) setMensagem(mensagemDoResultado(resultado));
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
        setAnimais,
        carregando,
        sincronizando,
        mensagem,
        pendentes: animais.filter((animal) => animal.salvo_offline).length,
        sincronizarAgora: () => { void sincronizarEmFoco.current?.(); },
    };
}

export default function AnimalSyncStatus({ pendentes, sincronizando, mensagem, sincronizarAgora }: {
    pendentes: number;
    sincronizando: boolean;
    mensagem: string;
    sincronizarAgora: () => void;
}) {
    if (!pendentes && !mensagem && !sincronizando) return null;

    return (
        <View style={{ backgroundColor: pendentes ? "#fffbeb" : "#eff6ff", borderRadius: 12, padding: 14, gap: 10 }}>
            {pendentes > 0 && (
                <Text style={{ fontSize: 13, color: "#92400e", lineHeight: 19 }}>
                    {pendentes} {pendentes === 1 ? "animal aguardando" : "animais aguardando"} sincronização. Os cadastros estão salvos neste aparelho e serão enviados quando houver conexão com o servidor.
                </Text>
            )}
            {!!mensagem && (
                <Text accessibilityLiveRegion="polite" style={{ fontSize: 13, color: "#374151", lineHeight: 19 }}>
                    {mensagem}
                </Text>
            )}
            {(pendentes > 0 || sincronizando) && (
                <TouchableOpacity
                    onPress={sincronizarAgora}
                    disabled={sincronizando}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: sincronizando, busy: sincronizando }}
                    style={{ backgroundColor: "#4a90e2", borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, opacity: sincronizando ? 0.7 : 1 }}
                >
                    {sincronizando ? <ActivityIndicator color="#fff" /> : <Feather name="refresh-cw" size={16} color="#fff" />}
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                        {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
