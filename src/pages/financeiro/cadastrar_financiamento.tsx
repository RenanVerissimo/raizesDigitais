import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { criarFinanciamento } from "../../services/api";
import { toIso } from "../../utils/formatters";
import Toast from "react-native-toast-message";

function parseDecimal(valor: string) {
    return Number(valor.replace(/\./g, "").replace(",", "."));
}

function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function aplicarMascaraData(texto: string) {
    const numeros = texto.replace(/\D/g, "").slice(0, 8);

    if (numeros.length >= 5) {
        return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
    }

    if (numeros.length >= 3) {
        return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return numeros;
}

export default function CadastrarFinanciamento() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [salvando, setSalvando] = useState(false);
    const [formData, setFormData] = useState({
        nome: "",
        credor: "",
        valorTotal: "",
        quantidadeParcelas: "",
        parcelasPagas: "",
        dataFinanciamento: "",
        dataVencimentoParcela: "",
        observacoes: "",
    });

    const valorTotal = parseDecimal(formData.valorTotal) || 0;
    const quantidadeParcelas = Number(formData.quantidadeParcelas.replace(/\D/g, "")) || 0;
    const parcelasPagas = Number(formData.parcelasPagas.replace(/\D/g, "")) || 0;
    const valorParcela = useMemo(() => {
        if (!valorTotal || !quantidadeParcelas) return 0;
        return valorTotal / quantidadeParcelas;
    }, [valorTotal, quantidadeParcelas]);
    const saldoRestante = Math.max(valorTotal - valorParcela * parcelasPagas, 0);

    const handleCancelar = () => {
        navigation.navigate("financiamentos");
    };

    const handleSubmit = async () => {
        if (salvando) return;

        if (!formData.nome.trim()) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe o nome do financiamento.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (!valorTotal || valorTotal <= 0) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe o valor total da divida.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (!quantidadeParcelas || quantidadeParcelas <= 0) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe em quantas parcelas foi feito.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (parcelasPagas > quantidadeParcelas) {
            Toast.show({ type: "info", text1: "Atencao", text2: "As parcelas pagas nao podem ser maiores que o total de parcelas.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (!formData.dataVencimentoParcela.trim()) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe a data de vencimento da parcela.", position: "top", visibilityTime: 3000 });
            return;
        }

        const dataFinanciamentoIso = formData.dataFinanciamento.trim() ? toIso(formData.dataFinanciamento) : null;
        const dataVencimentoIso = toIso(formData.dataVencimentoParcela);

        if (formData.dataFinanciamento.trim() && !dataFinanciamentoIso) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe a data do financiamento no formato DD/MM/AAAA.", position: "top", visibilityTime: 3000 });
            return;
        }

        if (!dataVencimentoIso) {
            Toast.show({ type: "info", text1: "Atencao", text2: "Informe a data de vencimento no formato DD/MM/AAAA.", position: "top", visibilityTime: 3000 });
            return;
        }

        try {
            setSalvando(true);
            await criarFinanciamento({
                nome: formData.nome.trim(),
                credor: formData.credor.trim() || null,
                valorTotal,
                quantidadeParcelas,
                parcelasPagas,
                dataFinanciamento: dataFinanciamentoIso,
                dataVencimentoParcela: dataVencimentoIso,
                observacoes: formData.observacoes.trim() || null,
            });

            Toast.show({ type: "success", text1: "Financiamento cadastrado", text2: "O financiamento foi salvo com sucesso.", position: "top", visibilityTime: 3000 });
            setTimeout(handleCancelar, 500);
        } catch (error: any) {
            Toast.show({ type: "error", text1: "Erro", text2: error.message || "Nao foi possivel cadastrar o financiamento.", position: "top", visibilityTime: 3000 });
        } finally {
            setSalvando(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16,
                        paddingHorizontal: 20,
                        paddingBottom: 24,
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4, marginTop: 2 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                                <Text numberOfLines={2} style={{ flex: 1, fontSize: 21, lineHeight: 26, fontWeight: "700", color: "#fff" }}>
                                    Cadastrar Financiamento
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>
                                Registre valor, parcelas e vencimentos
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    <Campo
                        icone="tag"
                        label="Nome do financiamento *"
                        valor={formData.nome}
                        onChange={(v: string) => setFormData({ ...formData, nome: v })}
                        placeholder="Ex: Trator, caminhonete, emprestimo"
                    />

                    <Campo
                        icone="dollar-sign"
                        label="Valor total da divida *"
                        valor={formData.valorTotal}
                        onChange={(v: string) => setFormData({ ...formData, valorTotal: v })}
                        placeholder="Ex: 45000,00"
                        keyboard="decimal-pad"
                    />

                    <Campo
                        icone="grid"
                        label="Total de parcelas *"
                        valor={formData.quantidadeParcelas}
                        onChange={(v: string) => setFormData({ ...formData, quantidadeParcelas: v.replace(/\D/g, "") })}
                        placeholder="Ex: 36"
                        keyboard="number-pad"
                    />

                    <Campo
                        icone="check-square"
                        label="Parcelas pagas"
                        valor={formData.parcelasPagas}
                        onChange={(v: string) => setFormData({ ...formData, parcelasPagas: v.replace(/\D/g, "") })}
                        placeholder="Ex: 3"
                        keyboard="number-pad"
                    />

                    <Campo
                        icone="calendar"
                        label="Data do Financiamento"
                        valor={formData.dataFinanciamento}
                        onChange={(v: string) => setFormData({ ...formData, dataFinanciamento: aplicarMascaraData(v) })}
                        placeholder="DD/MM/AAAA"
                        keyboard="number-pad"
                        maxLength={10}
                    />

                    <Campo
                        icone="clock"
                        label="Data de vencimento da parcela *"
                        valor={formData.dataVencimentoParcela}
                        onChange={(v: string) => setFormData({ ...formData, dataVencimentoParcela: aplicarMascaraData(v) })}
                        placeholder="DD/MM/AAAA"
                        keyboard="number-pad"
                        maxLength={10}
                    />

                    <Campo
                        icone="user"
                        label="Banco, loja ou credor"
                        valor={formData.credor}
                        onChange={(v: string) => setFormData({ ...formData, credor: v })}
                        placeholder="Ex: Banco do Brasil"
                    />

                    {valorParcela > 0 && (
                        <View style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#bfdbfe", gap: 12 }}>
                            <ResumoLinha label="Valor estimado da parcela" valor={formatarMoeda(valorParcela)} destaque />
                            <ResumoLinha label="Saldo restante estimado" valor={formatarMoeda(saldoRestante)} />
                        </View>
                    )}





                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="edit-3" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                Observacoes <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(opcional)</Text>
                            </Text>
                        </View>
                        <TextInput
                            value={formData.observacoes}
                            onChangeText={(v) => setFormData({ ...formData, observacoes: v })}
                            placeholder="Ex: juros, dia de pagamento, contrato..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{
                                backgroundColor: "#f9fafb",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 10,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                fontSize: 15,
                                color: "#0a0a0a",
                                minHeight: 84,
                            }}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity
                            onPress={handleCancelar}
                            activeOpacity={0.7}
                            disabled={salvando}
                            style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: salvando ? 0.65 : 1 }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={salvando} style={{ flex: 2, opacity: salvando ? 0.78 : 1 }}>
                            <LinearGradient
                                colors={["#4a90e2", "#357abd"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                            >
                                {salvando ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Feather name="check" size={18} color="#fff" />
                                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Cadastrar</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function ResumoLinha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ flex: 1, fontSize: 13, color: "#475569", fontWeight: destaque ? "700" : "500" }}>{label}</Text>
            <Text style={{ fontSize: destaque ? 20 : 15, color: destaque ? "#1d4ed8" : "#0f172a", fontWeight: "800" }}>{valor}</Text>
        </View>
    );
}

function Campo({ icone, label, valor, onChange, placeholder, keyboard, maxLength }: any) {
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
                maxLength={maxLength}
                style={{
                    backgroundColor: "#f9fafb",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: "#0a0a0a",
                }}
            />
        </View>
    );
}
