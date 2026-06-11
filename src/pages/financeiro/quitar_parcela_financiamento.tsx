import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Financiamento } from "../../interfaces/interfaces";
import { listarFinanciamentos, quitarParcelaFinanciamento } from "../../services/api";
import { calcularSaldoRestante, calcularValorParcela, formatarData, formatarMoeda } from "../../utils/financiamentos";
import Toast from "react-native-toast-message";

function parseDecimal(valor: string) {
    return Number(valor.replace(/\./g, "").replace(",", "."));
}

function hojeIso() {
    return new Date().toISOString().slice(0, 10);
}

export default function QuitarParcelaFinanciamento() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [financiamentos, setFinanciamentos] = useState<Financiamento[]>([]);
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [financiamentoId, setFinanciamentoId] = useState("");
    const [valorPago, setValorPago] = useState("");
    const [modalConfirmacaoVisible, setModalConfirmacaoVisible] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setCarregando(true);
            listarFinanciamentos()
                .then((dados) => setFinanciamentos(dados.filter((item) => item.status === "ativo" && item.parcelasPagas < item.quantidadeParcelas)))
                .catch((error: any) => Toast.show({ type: "error", text1: "Erro", text2: error.message || "Nao foi possivel carregar os financiamentos.", position: "top", visibilityTime: 3000 }))
                .finally(() => setCarregando(false));
        }, [])
    );

    const financiamentoSelecionado = financiamentos.find((item) => String(item.id) === financiamentoId) || null;
    const saldoRestante = financiamentoSelecionado ? calcularSaldoRestante(financiamentoSelecionado) : 0;
    const valorParcela = financiamentoSelecionado ? calcularValorParcela(financiamentoSelecionado) : 0;
    const proximaParcela = financiamentoSelecionado ? financiamentoSelecionado.parcelasPagas + 1 : 0;

    const valorPagoFinal = useMemo(() => {
        const digitado = parseDecimal(valorPago);
        return digitado || valorParcela;
    }, [valorPago, valorParcela]);

    function selecionarFinanciamento(financiamento: Financiamento) {
        const parcela = calcularValorParcela(financiamento);
        setFinanciamentoId(String(financiamento.id));
        setDropdownAberto(false);
        setValorPago(String(parcela.toFixed(2)).replace(".", ","));
    }

    function handleQuitarParcela() {
        if (!financiamentoSelecionado) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Selecione o financiamento da parcela.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (!valorPagoFinal || valorPagoFinal <= 0) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe o valor pago da parcela.", position: "top", visibilityTime: 3000 });
            return;
        }

        setModalConfirmacaoVisible(true);
    }

    async function confirmarQuitacaoParcela() {
        if (!financiamentoSelecionado) return;
        if (salvando) return;

        try {
            setSalvando(true);
            const resposta = await quitarParcelaFinanciamento(financiamentoSelecionado.id, {
                valorPago: valorPagoFinal,
                dataPagamento: hojeIso(),
            });

            setModalConfirmacaoVisible(false);
            Toast.show({
                type: "success",
                text1: resposta?.status === "quitado" ? "Financiamento quitado" : "Parcela quitada",
                text2: `${financiamentoSelecionado.nome} recebeu o pagamento da parcela ${proximaParcela}.`,
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.navigate("financiamentos"), 500);
        } catch (error: any) {
            setModalConfirmacaoVisible(false);
            Toast.show({ type: "error", text1: "Erro", text2: error.message || "Nao foi possivel quitar a parcela.", position: "top", visibilityTime: 3000 });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
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
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="credit-card" size={18} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Quitar Parcela
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Registre o pagamento de uma parcela da divida
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 20 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>
                            Financiamento
                        </Text>

                        {carregando ? (
                            <View style={{ alignItems: "center", paddingVertical: 22 }}>
                                <ActivityIndicator color="#4a90e2" />
                                <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8, textAlign: "center" }}>
                                    Carregando financiamentos
                                </Text>
                            </View>
                        ) : financiamentos.length === 0 ? (
                            <View style={{ alignItems: "center", paddingVertical: 22 }}>
                                <Feather name="check-circle" size={40} color="#d1d5db" />
                                <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                                    Nenhum financiamento ativo com parcelas em aberto
                                </Text>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={() => setDropdownAberto(!dropdownAberto)}
                                    style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, backgroundColor: "#f9fafb", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800", color: financiamentoSelecionado ? "#111827" : "#9ca3af" }}>
                                            {financiamentoSelecionado ? financiamentoSelecionado.nome : "Selecione um financiamento"}
                                        </Text>
                                        {financiamentoSelecionado && (
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                                                Proxima parcela {proximaParcela}/{financiamentoSelecionado.quantidadeParcelas}
                                            </Text>
                                        )}
                                    </View>
                                    <Feather name={dropdownAberto ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
                                </TouchableOpacity>

                                {dropdownAberto && (
                                    <View style={{ marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" }}>
                                        {financiamentos.map((financiamento, index) => {
                                            const parcela = calcularValorParcela(financiamento);
                                            return (
                                                <TouchableOpacity
                                                    key={financiamento.id}
                                                    activeOpacity={0.75}
                                                    onPress={() => selecionarFinanciamento(financiamento)}
                                                    style={{ padding: 12, borderBottomWidth: index < financiamentos.length - 1 ? 1 : 0, borderBottomColor: "#f1f5f9", backgroundColor: financiamentoId === String(financiamento.id) ? "#eff6ff" : "#fff" }}
                                                >
                                                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#0f172a" }}>{financiamento.nome}</Text>
                                                    <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                        Parcela {financiamento.parcelasPagas + 1}/{financiamento.quantidadeParcelas} - {formatarMoeda(parcela)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </>
                        )}
                    </View>

                    {financiamentoSelecionado && (
                        <>
                            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f1f5f9", gap: 10 }}>
                                <ResumoLinha label="Saldo restante" valor={formatarMoeda(saldoRestante)} destaque />
                                <ResumoLinha label="Valor estimado da parcela" valor={formatarMoeda(valorParcela)} />
                                <ResumoLinha label="Vencimento da parcela" valor={formatarData(financiamentoSelecionado.dataVencimentoParcela)} />
                                <ResumoLinha label="Parcelas pagas" valor={`${financiamentoSelecionado.parcelasPagas}/${financiamentoSelecionado.quantidadeParcelas}`} />
                            </View>

                            <View style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#bfdbfe" }}>
                                <Text style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 4 }}>Parcela que sera quitada</Text>
                                <Text style={{ fontSize: 26, fontWeight: "800", color: "#2563eb" }}>
                                    {proximaParcela}/{financiamentoSelecionado.quantidadeParcelas}
                                </Text>
                            </View>

                            <Campo
                                icone="dollar-sign"
                                label="Valor pago da parcela *"
                                valor={valorPago}
                                onChange={setValorPago}
                                placeholder="Ex: 1500,00"
                                keyboard="decimal-pad"
                            />
                        </>
                    )}

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                            disabled={salvando}
                            style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleQuitarParcela} activeOpacity={0.85} disabled={carregando || salvando} style={{ flex: 2, opacity: carregando || salvando ? 0.65 : 1 }}>
                            <LinearGradient colors={["#2563eb", "#1d4ed8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Quitar Parcela</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <Modal visible={modalConfirmacaoVisible} transparent animationType="fade" onRequestClose={() => !salvando && setModalConfirmacaoVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <View style={{ width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 20 }}>
                        <View style={{ alignItems: "center", marginBottom: 12 }}>
                            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                                <Feather name="credit-card" size={28} color="#2563eb" />
                            </View>
                            <Text style={{ fontSize: 19, fontWeight: "800", color: "#0f172a", textAlign: "center" }}>
                                Confirmar parcela
                            </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
                            Ao confirmar, uma parcela sera marcada como paga neste financiamento.
                        </Text>
                        <View style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 18, gap: 8 }}>
                            <ResumoLinha label="Financiamento" valor={financiamentoSelecionado?.nome || "-"} />
                            <ResumoLinha label="Parcela" valor={`${proximaParcela}/${financiamentoSelecionado?.quantidadeParcelas || 0}`} />
                            <ResumoLinha label="Valor pago" valor={formatarMoeda(valorPagoFinal || 0)} destaque />
                        </View>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity onPress={() => setModalConfirmacaoVisible(false)} activeOpacity={0.75} disabled={salvando} style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 14, paddingVertical: 15, alignItems: "center", opacity: salvando ? 0.65 : 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#374151" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmarQuitacaoParcela} activeOpacity={0.8} disabled={salvando} style={{ flex: 1, backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 49, opacity: salvando ? 0.78 : 1 }}>
                                {salvando ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Confirmar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

function ResumoLinha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <Text style={{ flex: 1, fontSize: 13, color: "#6b7280" }}>{label}</Text>
            <Text style={{ fontSize: destaque ? 18 : 13, fontWeight: "800", color: destaque ? "#dc2626" : "#0f172a", textAlign: "right" }}>
                {valor}
            </Text>
        </View>
    );
}

function Campo({ icone, label, valor, onChange, placeholder, keyboard }: any) {
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
        </View>
    );
}
