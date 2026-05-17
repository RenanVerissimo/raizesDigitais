import React, { useCallback, useMemo, useState } from "react";
import { Modal, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
    buscarPrevisaoReceita,
    listarPrevisoesReceita,
    listarProducoes,
    listarReceitas,
    PrevisaoReceitaConfirmada,
    salvarPrevisaoReceita,
} from "../../services/api";
import { Producao, Receita } from "../../interfaces/interfaces";

const PERIODO_MENSAL_DIAS = 30;
const SIMULAR_ULTIMO_DIA_DO_MES = false;
const PERIODOS_HISTORICO = ["3M", "6M", "12M"] as const;
type PeriodoHistorico = typeof PERIODOS_HISTORICO[number];
const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(valor: number) {
    return valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function normalizarData(data?: string | null) {
    return data ? data.slice(0, 10) : "";
}

function dataLocalTexto(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function parseDecimal(valor: string) {
    return Number(valor.replace(/\./g, "").replace(",", "."));
}

function anoMesAtual(data = new Date()) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function proximoAnoMes(anoMes: string) {
    const [ano, mes] = anoMes.split("-").map(Number);
    return anoMesAtual(new Date(ano, mes, 1));
}

function ultimoDiaDoMes(data = new Date()) {
    return data.getDate() === new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
}

export default function PrevisaoReceita() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [producoes, setProducoes] = useState<Producao[]>([]);
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [precoLitro, setPrecoLitro] = useState("");
    const [previsaoConfirmada, setPrevisaoConfirmada] = useState<PrevisaoReceitaConfirmada | null>(null);
    const [historicoPrevisoes, setHistoricoPrevisoes] = useState<PrevisaoReceitaConfirmada[]>([]);
    const [modalConfirmacaoVisible, setModalConfirmacaoVisible] = useState(false);
    const [modalAvisoAntecipadoVisible, setModalAvisoAntecipadoVisible] = useState(false);
    const [valorRealInformado, setValorRealInformado] = useState("");
    const [observacoesConfirmacao, setObservacoesConfirmacao] = useState("");
    const [mostrarConferencia, setMostrarConferencia] = useState(false);
    const [periodoHistorico, setPeriodoHistorico] = useState<PeriodoHistorico>("6M");

    const mesReferencia = anoMesAtual();
    const deveDestacarFechamento = SIMULAR_ULTIMO_DIA_DO_MES || ultimoDiaDoMes();
    const mesPrevisaoExibida = previsaoConfirmada ? proximoAnoMes(mesReferencia) : mesReferencia;

    async function carregarDados() {
        try {
            const [producoesDados, receitasDados, previsaoSalva, historicoSalvo] = await Promise.all([
                listarProducoes(),
                listarReceitas(),
                buscarPrevisaoReceita(mesReferencia),
                listarPrevisoesReceita(),
            ]);

            setProducoes(producoesDados);
            setReceitas(receitasDados);
            setPrevisaoConfirmada(previsaoSalva);
            setHistoricoPrevisoes(historicoSalvo);

            if (previsaoSalva) {
                setValorRealInformado(String(previsaoSalva.valorReal.toFixed(2)).replace(".", ","));
                setObservacoesConfirmacao(previsaoSalva.observacoes || "");
            }

            const totalLitrosVendidos = receitasDados.reduce((sum, receita) => sum + Number(receita.litros || 0), 0);
            const totalRecebido = receitasDados.reduce((sum, receita) => sum + Number(receita.valorTotal || 0), 0);
            const precoMedio = totalLitrosVendidos > 0 ? totalRecebido / totalLitrosVendidos : 0;

            setPrecoLitro(precoMedio > 0 ? precoMedio.toFixed(2).replace(".", ",") : "");
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar",
                text2: err.message || "Não foi possível calcular a previsão.",
                position: "top",
            });
        }
    }

    useFocusEffect(useCallback(() => {
        carregarDados();
    }, [mesReferencia]));

    const media30Dias = useMemo(() => calcularMediaProducao(producoes, 30), [producoes]);
    const mediaUsada = media30Dias;
    const precoEstimado = parseDecimal(precoLitro || "0");
    const litrosPrevistos = mediaUsada * PERIODO_MENSAL_DIAS;
    const receitaPrevista = litrosPrevistos * (Number.isNaN(precoEstimado) ? 0 : precoEstimado);
    const receitaRealMes = receitas
        .filter((receita) => normalizarData(receita.data).startsWith(mesReferencia))
        .reduce((sum, receita) => sum + Number(receita.valorTotal || 0), 0);
    const valorComparacaoEstimado = previsaoConfirmada?.valorEstimado ?? receitaPrevista;
    const valorComparacaoReal = previsaoConfirmada?.valorReal ?? receitaRealMes;
    const diferencaPrevisao = valorComparacaoReal - valorComparacaoEstimado;
    const percentualDiferenca = valorComparacaoEstimado > 0 ? (diferencaPrevisao / valorComparacaoEstimado) * 100 : 0;
    const previsaoBateu = Math.abs(percentualDiferenca) <= 5;
    const historicoFiltrado = filtrarHistoricoPrevisoes(historicoPrevisoes, periodoHistorico);
    const maiorValorHistorico = Math.max(
        ...historicoFiltrado.map((item) => Math.max(item.valorEstimado, item.valorReal)),
        1
    );
    const totalEstimadoHistorico = historicoFiltrado.reduce((sum, item) => sum + item.valorEstimado, 0);
    const totalRealHistorico = historicoFiltrado.reduce((sum, item) => sum + item.valorReal, 0);

    const ultimaReceita = receitas
        .slice()
        .sort((a, b) => String(b.data).localeCompare(String(a.data)))[0];

    function abrirFormularioConfirmacao() {
        const valorInicial = previsaoConfirmada?.valorReal ?? receitaRealMes;
        setValorRealInformado(String(valorInicial.toFixed(2)).replace(".", ","));
        setModalConfirmacaoVisible(true);
    }

    function solicitarConfirmacaoDados() {
        if (!deveDestacarFechamento) {
            setModalAvisoAntecipadoVisible(true);
            return;
        }

        abrirFormularioConfirmacao();
    }

    function continuarConfirmacaoAntecipada() {
        setModalAvisoAntecipadoVisible(false);
        abrirFormularioConfirmacao();
    }

    async function confirmarReceitaReal() {
        const valorReal = parseDecimal(valorRealInformado);

        if (Number.isNaN(valorReal) || valorReal < 0) {
            Toast.show({
                type: "info",
                text1: "Atenção",
                text2: "Informe o valor real arrecadado no mês.",
                position: "top",
                visibilityTime: 3000,
            });
            return;
        }

        try {
            const salva = await salvarPrevisaoReceita({
                anoMes: mesReferencia,
                valorEstimado: receitaPrevista,
                valorReal,
                observacoes: observacoesConfirmacao.trim() || null,
            });
            setPrevisaoConfirmada(salva);
            setHistoricoPrevisoes((prev) => [salva, ...prev.filter((item) => item.anoMes !== salva.anoMes)]);
            setModalConfirmacaoVisible(false);
            Toast.show({
                type: "success",
                text1: "Receita confirmada",
                text2: "A previsão e o valor real foram armazenados.",
                position: "top",
                visibilityTime: 3000,
            });
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao salvar",
                text2: err.message || "Não foi possível salvar a confirmação.",
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
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Previsão de Receita</Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Estimativa com base na produção e vendas
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 13, color: "#6b7280" }}>Receita bruta prevista</Text>
                            <Feather name="trending-up" size={20} color="#16a34a" />
                        </View>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 32, fontWeight: "800", color: "#16a34a" }}>
                            {formatarMoeda(receitaPrevista)}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                            {formatarNumero(litrosPrevistos)} litros previstos para {formatarAnoMes(mesPrevisaoExibida)}
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <ResumoCard icon="droplet" label="Média usada" valor={`${formatarNumero(mediaUsada)} L/dia`} color="#4a90e2" />
                        <ResumoCard icon="dollar-sign" label="Preço/L" valor={precoEstimado > 0 ? formatarMoeda(precoEstimado) : "R$ 0,00"} color="#16a34a" />
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9", gap: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>Preço estimado do litro</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 15, color: "#6b7280", marginRight: 6 }}>R$</Text>
                            <TextInput
                                value={precoLitro}
                                onChangeText={setPrecoLitro}
                                keyboardType="decimal-pad"
                                placeholder="0,00"
                                placeholderTextColor="#9ca3af"
                                style={{ flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: "700", color: "#0a0a0a" }}
                            />
                        </View>
                        <Text style={{ fontSize: 12, color: "#6b7280", lineHeight: 18 }}>
                            O valor vem da média das vendas registradas, mas pode ser ajustado para simular outro preço.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setMostrarConferencia((atual) => !atual)}
                        activeOpacity={0.85}
                        style={{
                            backgroundColor: "#eff6ff",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: deveDestacarFechamento ? "#60a5fa" : "#bfdbfe",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#4a90e2", alignItems: "center", justifyContent: "center" }}>
                                <Feather name="check-circle" size={22} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: "#1e3a8a" }}>Conferência do mês</Text>
                                <Text style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                                    {mostrarConferencia ? "Ocultar comparação" : "Ver estimado x real"}
                                </Text>
                            </View>
                        </View>
                        <Feather name={mostrarConferencia ? "chevron-up" : "chevron-down"} size={22} color="#2563eb" />
                        {deveDestacarFechamento && (
                            <View style={{ position: "absolute", top: -10, right: 14, backgroundColor: "#f59e0b", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 2, borderColor: "#fff" }}>
                                <Feather name="star" size={12} color="#fff" />
                                <Text style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}>Fechamento</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {mostrarConferencia && (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: deveDestacarFechamento ? "#bfdbfe" : "#f1f5f9", gap: 12 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#0a0a0a" }}>Conferência do mês</Text>
                                    <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 3, lineHeight: 18 }}>
                                        {deveDestacarFechamento
                                            ? "Hoje é o último dia do mês. Confira se a previsão bateu com o valor real."
                                            : "Registre o valor real quando quiser fechar ou revisar a previsão do mês."}
                                    </Text>
                                </View>
                                {previsaoConfirmada && (
                                    <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#15803d" }}>Confirmado</Text>
                                    </View>
                                )}
                            </View>

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <ComparacaoCard label="Estimado" valor={formatarMoeda(valorComparacaoEstimado)} color="#4a90e2" />
                                <ComparacaoCard label="Real" valor={formatarMoeda(valorComparacaoReal)} color="#16a34a" />
                            </View>

                            <View style={{ backgroundColor: previsaoBateu ? "#f0fdf4" : "#fff7ed", borderRadius: 10, padding: 12 }}>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 3 }}>Diferença</Text>
                                <Text style={{ fontSize: 18, fontWeight: "800", color: previsaoBateu ? "#15803d" : "#ea580c" }}>
                                    {formatarMoeda(diferencaPrevisao)} ({percentualDiferenca.toFixed(1)}%)
                                </Text>
                                <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                                    {previsaoBateu ? "A previsão ficou próxima do valor real." : "A previsão ficou distante do valor real."}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={solicitarConfirmacaoDados}
                                activeOpacity={0.8}
                                style={{ backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                            >
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                                    Confirmar dados do mês
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={solicitarConfirmacaoDados}
                                activeOpacity={0.75}
                                style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 2 }}
                            >
                                <Feather name="edit-3" size={14} color="#4a90e2" />
                                <Text style={{ fontSize: 13, fontWeight: "700", color: "#4a90e2" }}>
                                    {previsaoConfirmada ? "Editar valor real" : "Informar valor real"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9", gap: 14 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#0a0a0a" }}>Histórico: estimado x real</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                                    Compare os fechamentos salvos ao longo dos meses.
                                </Text>
                            </View>
                            <Feather name="bar-chart-2" size={20} color="#4a90e2" />
                        </View>

                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {PERIODOS_HISTORICO.map((periodo) => {
                                const ativo = periodoHistorico === periodo;
                                return (
                                    <TouchableOpacity
                                        key={periodo}
                                        onPress={() => setPeriodoHistorico(periodo as PeriodoHistorico)}
                                        activeOpacity={0.75}
                                        style={{
                                            minWidth: 54,
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderRadius: 999,
                                            alignItems: "center",
                                            backgroundColor: ativo ? "#4a90e2" : "#f8fafc",
                                            borderWidth: 1,
                                            borderColor: ativo ? "#4a90e2" : "#e5e7eb",
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: "800", color: ativo ? "#fff" : "#475569" }}>
                                            {periodo}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {historicoFiltrado.length === 0 ? (
                            <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" }}>
                                <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 19 }}>
                                    Nenhuma conferência salva para este período.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <ComparacaoCard label="Total estimado" valor={formatarMoeda(totalEstimadoHistorico)} color="#4a90e2" />
                                    <ComparacaoCard label="Total real" valor={formatarMoeda(totalRealHistorico)} color="#16a34a" />
                                </View>

                                <View style={{ gap: 14 }}>
                                    {historicoFiltrado.map((item) => (
                                        <LinhaHistoricoReceita
                                            key={item.anoMes}
                                            item={item}
                                            maiorValor={maiorValorHistorico}
                                        />
                                    ))}
                                </View>
                            </>
                        )}
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a", marginBottom: 12 }}>Base do cálculo</Text>
                        <LinhaInfo label="Média mensal" valor={`${formatarNumero(media30Dias)} L/dia`} />
                        <LinhaInfo label="Período da previsão" valor="30 dias" />
                        <LinhaInfo label="Vendas registradas" valor={String(receitas.length)} />
                        <LinhaInfo label="Último comprador" valor={ultimaReceita?.comprador || "-"} />
                    </View>
                </View>
            </ScrollView>

            <Modal visible={modalAvisoAntecipadoVisible} transparent animationType="fade" onRequestClose={() => setModalAvisoAntecipadoVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <View style={{ width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 20 }}>
                        <View style={{ alignSelf: "center", width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                            <Feather name="alert-triangle" size={24} color="#f59e0b" />
                        </View>
                        <Text style={{ fontSize: 19, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
                            Confirmar antes do fechamento?
                        </Text>
                        <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
                            Ainda não é o último dia do mês. Se você confirmar agora, os valores podem não representar o resultado final, pois novas receitas ainda podem ser registradas.
                        </Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity onPress={() => setModalAvisoAntecipadoVisible(false)} activeOpacity={0.75} style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#374151" }}>Voltar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={continuarConfirmacaoAntecipada} activeOpacity={0.8} style={{ flex: 1, backgroundColor: "#f59e0b", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Continuar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={modalConfirmacaoVisible} transparent animationType="fade" onRequestClose={() => setModalConfirmacaoVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <View style={{ width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 20 }}>
                        <Text style={{ fontSize: 19, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
                            Confirmar receita do mês
                        </Text>
                        <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
                            Informe o valor realmente arrecadado para comparar com a previsão e armazenar o fechamento de {mesReferencia}.
                        </Text>
                        <View style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 15, color: "#6b7280", marginRight: 6 }}>R$</Text>
                            <TextInput
                                value={valorRealInformado}
                                onChangeText={setValorRealInformado}
                                keyboardType="decimal-pad"
                                placeholder="0,00"
                                placeholderTextColor="#9ca3af"
                                style={{ flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: "800", color: "#0f172a" }}
                            />
                        </View>
                        <TextInput
                            value={observacoesConfirmacao}
                            onChangeText={setObservacoesConfirmacao}
                            placeholder="Observações sobre a diferença..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            textAlignVertical="top"
                            style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 78, fontSize: 14, color: "#0f172a", marginBottom: 16 }}
                        />
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity onPress={() => setModalConfirmacaoVisible(false)} activeOpacity={0.75} style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#374151" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmarReceitaReal} activeOpacity={0.8} style={{ flex: 1, backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function calcularMediaProducao(producoes: Producao[], dias: number) {
    const hoje = new Date();
    const datasPeriodo = new Set(Array.from({ length: dias }, (_, i) => {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        return dataLocalTexto(data);
    }));

    const totaisPorDia = producoes.reduce((acc, producao) => {
        const data = normalizarData(producao.data);
        if (datasPeriodo.has(data)) {
            acc[data] = (acc[data] || 0) + Number(producao.producao_diaria || 0);
        }
        return acc;
    }, {} as Record<string, number>);

    const totais = Object.values(totaisPorDia);
    if (totais.length === 0) return 0;
    return totais.reduce((sum, total) => sum + total, 0) / totais.length;
}

function dataDoAnoMes(anoMes: string) {
    const [ano, mes] = anoMes.split("-").map(Number);
    return new Date(ano, mes - 1, 1);
}

function dataInicioPeriodo(meses: number) {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() - meses + 1, 1);
}

function formatarAnoMes(anoMes: string) {
    const [ano, mes] = anoMes.split("-").map(Number);
    return `${NOMES_MES[mes - 1] || "--"}/${ano}`;
}

function filtrarHistoricoPrevisoes(historico: PrevisaoReceitaConfirmada[], periodo: PeriodoHistorico) {
    const ordenado = historico
        .slice()
        .sort((a, b) => a.anoMes.localeCompare(b.anoMes));

    const meses = Number(periodo.replace("M", ""));
    const inicio = dataInicioPeriodo(meses);
    return ordenado.filter((item) => dataDoAnoMes(item.anoMes) >= inicio);
}

function ResumoCard({ icon, label, valor, color }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; valor: string; color: string }) {
    return (
        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
            <Feather name={icon} size={16} color={color} />
            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>{label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 18, fontWeight: "800", color: "#0a0a0a", marginTop: 2 }}>{valor}</Text>
        </View>
    );
}

function ComparacaoCard({ label, valor, color }: { label: string; valor: string; color: string }) {
    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" }}>
            <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 17, fontWeight: "800", color }}>{valor}</Text>
        </View>
    );
}

function LinhaHistoricoReceita({ item, maiorValor }: { item: PrevisaoReceitaConfirmada; maiorValor: number }) {
    const larguraEstimado = `${Math.max((item.valorEstimado / maiorValor) * 100, 4)}%` as const;
    const larguraReal = `${Math.max((item.valorReal / maiorValor) * 100, 4)}%` as const;
    const diferenca = item.valorReal - item.valorEstimado;
    const corDiferenca = diferenca >= 0 ? "#16a34a" : "#dc2626";

    return (
        <View style={{ gap: 7 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#0f172a" }}>{formatarAnoMes(item.anoMes)}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1, textAlign: "right", fontSize: 12, fontWeight: "800", color: corDiferenca }}>
                    {diferenca >= 0 ? "+" : ""}{formatarMoeda(diferenca)}
                </Text>
            </View>

            <View style={{ gap: 6 }}>
                <BarraComparacaoHistorico label="Estimado" valor={item.valorEstimado} largura={larguraEstimado} color="#4a90e2" />
                <BarraComparacaoHistorico label="Real" valor={item.valorReal} largura={larguraReal} color="#16a34a" />
            </View>
        </View>
    );
}

function BarraComparacaoHistorico({ label, valor, largura, color }: { label: string; valor: number; largura: `${number}%`; color: string }) {
    return (
        <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ fontSize: 11, color: "#64748b", fontWeight: "700" }}>{label}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1, textAlign: "right", fontSize: 11, color: "#334155", fontWeight: "800" }}>
                    {formatarMoeda(valor)}
                </Text>
            </View>
            <View style={{ height: 8, backgroundColor: "#eef2f7", borderRadius: 999, overflow: "hidden" }}>
                <View style={{ width: largura, height: "100%", backgroundColor: color, borderRadius: 999 }} />
            </View>
        </View>
    );
}

function LinhaInfo({ label, valor }: { label: string; valor: string }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12 }}>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>{label}</Text>
            <Text numberOfLines={1} style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: "800", color: "#0a0a0a" }}>{valor}</Text>
        </View>
    );
}
