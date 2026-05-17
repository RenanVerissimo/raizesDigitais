import { useCallback, useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Financiamento } from "../../interfaces/interfaces";
import { listarFinanciamentos, quitarFinanciamento } from "../../services/api";
import { calcularSaldoRestante, formatarData, formatarMoeda } from "../../utils/financiamentos";
import Toast from "react-native-toast-message";

function parseDecimal(valor: string) {
    return Number(valor.replace(/\./g, "").replace(",", "."));
}

function hojeIso() {
    return new Date().toISOString().slice(0, 10);
}

export default function QuitarFinanciamento() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [financiamentos, setFinanciamentos] = useState<Financiamento[]>([]);
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [financiamentoId, setFinanciamentoId] = useState("");
    const [desconto, setDesconto] = useState("");
    const [valorPago, setValorPago] = useState("");
    const [modalConfirmacaoVisible, setModalConfirmacaoVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            listarFinanciamentos()
                .then((dados) => setFinanciamentos(dados.filter((item) => item.status === "ativo")))
                .catch((error: any) => Toast.show({ type: "error", text1: "Erro", text2: error.message || "Nao foi possivel carregar os financiamentos.", position: "top", visibilityTime: 3000 }));
        }, [])
    );

    const financiamentoSelecionado = financiamentos.find((item) => String(item.id) === financiamentoId) || null;
    const saldoRestante = financiamentoSelecionado ? calcularSaldoRestante(financiamentoSelecionado) : 0;
    const descontoNumero = parseDecimal(desconto) || 0;
    const valorSugerido = Math.max(saldoRestante - descontoNumero, 0);

    const valorPagoFinal = useMemo(() => {
        const digitado = parseDecimal(valorPago);
        return digitado || valorSugerido;
    }, [valorPago, valorSugerido]);

    function selecionarFinanciamento(financiamento: Financiamento) {
        const saldo = calcularSaldoRestante(financiamento);
        setFinanciamentoId(String(financiamento.id));
        setDropdownAberto(false);
        setDesconto("");
        setValorPago(String(saldo.toFixed(2)).replace(".", ","));
    }

    function handleDescontoChange(valor: string) {
        const descontoAtual = parseDecimal(valor) || 0;
        const final = Math.max(saldoRestante - descontoAtual, 0);
        setDesconto(valor);
        setValorPago(String(final.toFixed(2)).replace(".", ","));
    }

    function handleQuitar() {
        if (!financiamentoSelecionado) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Selecione o financiamento que deseja quitar.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (descontoNumero > saldoRestante) {
            Toast.show({ type: "info", text1: "Atencao", text2: "O desconto nao pode ser maior que o saldo restante.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (!valorPagoFinal || valorPagoFinal <= 0) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe o valor pago para quitar o financiamento.", position: "top", visibilityTime: 3000 });
            return;
        }

        setModalConfirmacaoVisible(true);
    }

    async function confirmarQuitacao() {
        if (!financiamentoSelecionado) return;

        try {
            await quitarFinanciamento(financiamentoSelecionado.id, {
                valorQuitacao: valorPagoFinal,
                descontoQuitacao: descontoNumero,
                dataQuitacao: hojeIso(),
            });

            setModalConfirmacaoVisible(false);
            Toast.show({
                type: "success",
                text1: "Financiamento quitado",
                text2: `${financiamentoSelecionado.nome} foi marcado como quitado.`,
                position: "top",
                visibilityTime: 3000,
            });

            setTimeout(() => navigation.navigate("financiamentos"), 500);
        } catch (error: any) {
            setModalConfirmacaoVisible(false);
            Toast.show({ type: "error", text1: "Erro", text2: error.message || "Nao foi possivel quitar o financiamento.", position: "top", visibilityTime: 3000 });
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
                                <Feather name="check-circle" size={18} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Quitar Financiamento
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                Registre o pagamento final da divida
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 20 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>
                            Financiamento
                        </Text>

                        {financiamentos.length === 0 ? (
                            <View style={{ alignItems: "center", paddingVertical: 22 }}>
                                <Feather name="file-text" size={40} color="#d1d5db" />
                                <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8, textAlign: "center" }}>
                                    Nenhum financiamento ativo para quitar
                                </Text>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={() => setDropdownAberto((aberto) => !aberto)}
                                    style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: dropdownAberto ? "#4a90e2" : "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}
                                >
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800", color: financiamentoSelecionado ? "#111827" : "#9ca3af" }}>
                                            {financiamentoSelecionado ? financiamentoSelecionado.nome : "Selecione um financiamento"}
                                        </Text>
                                        {financiamentoSelecionado && (
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                Restante: {formatarMoeda(saldoRestante)}
                                            </Text>
                                        )}
                                    </View>
                                    <Feather name={dropdownAberto ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
                                </TouchableOpacity>

                                {dropdownAberto && (
                                    <View style={{ marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" }}>
                                        {financiamentos.map((financiamento, index) => {
                                            const saldo = calcularSaldoRestante(financiamento);
                                            return (
                                                <TouchableOpacity
                                                    key={financiamento.id}
                                                    activeOpacity={0.75}
                                                    onPress={() => selecionarFinanciamento(financiamento)}
                                                    style={{ padding: 12, borderBottomWidth: index < financiamentos.length - 1 ? 1 : 0, borderBottomColor: "#f1f5f9", backgroundColor: financiamentoId === String(financiamento.id) ? "#eff6ff" : "#fff" }}
                                                >
                                                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#0f172a" }}>{financiamento.nome}</Text>
                                                    <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                                        {financiamento.credor || "Credor nao informado"} - restante {formatarMoeda(saldo)}
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
                                <ResumoLinha label="Vencimento da parcela" valor={formatarData(financiamentoSelecionado.dataVencimentoParcela)} />
                                <ResumoLinha label="Parcelas pagas" valor={`${financiamentoSelecionado.parcelasPagas}/${financiamentoSelecionado.quantidadeParcelas}`} />
                            </View>

                            <Campo
                                icone="percent"
                                label="Desconto por pagamento antecipado"
                                valor={desconto}
                                onChange={handleDescontoChange}
                                placeholder="Ex: 500,00"
                                keyboard="decimal-pad"
                            />

                            <View style={{ backgroundColor: "#ecfdf5", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#bbf7d0" }}>
                                <Text style={{ fontSize: 12, color: "#047857", marginBottom: 4 }}>Valor sugerido para quitar</Text>
                                <Text style={{ fontSize: 26, fontWeight: "800", color: "#16a34a" }}>
                                    {formatarMoeda(valorSugerido)}
                                </Text>
                            </View>

                            <Campo
                                icone="dollar-sign"
                                label="Valor pago para quitar *"
                                valor={valorPago}
                                onChange={setValorPago}
                                placeholder="Ex: 15000,00"
                                keyboard="decimal-pad"
                            />
                        </>
                    )}

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                            style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleQuitar} activeOpacity={0.85} style={{ flex: 2 }}>
                            <LinearGradient colors={["#16a34a", "#15803d"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Quitar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <Modal visible={modalConfirmacaoVisible} transparent animationType="fade" onRequestClose={() => setModalConfirmacaoVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <View style={{ width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 20 }}>
                        <View style={{ alignItems: "center", marginBottom: 12 }}>
                            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                                <Feather name="check-circle" size={28} color="#16a34a" />
                            </View>
                            <Text style={{ fontSize: 19, fontWeight: "800", color: "#0f172a", textAlign: "center" }}>
                                Confirmar quitacao
                            </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
                            Ao confirmar, o financiamento sera marcado como quitado e esta acao nao podera ser desfeita pela tela do app.
                        </Text>
                        <View style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 18, gap: 8 }}>
                            <ResumoLinha label="Financiamento" valor={financiamentoSelecionado?.nome || "-"} />
                            <ResumoLinha label="Valor pago" valor={formatarMoeda(valorPagoFinal || 0)} destaque />
                            <ResumoLinha label="Desconto" valor={formatarMoeda(descontoNumero)} />
                        </View>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity onPress={() => setModalConfirmacaoVisible(false)} activeOpacity={0.75} style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#374151" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmarQuitacao} activeOpacity={0.8} style={{ flex: 1, backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 15, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Confirmar</Text>
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
