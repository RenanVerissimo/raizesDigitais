import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { listarProducoes, listarReceitas } from "../../services/api";
import { Producao, Receita } from "../../interfaces/interfaces";

const PERIODOS = [7, 15, 30] as const;

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

export default function PrevisaoReceita() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [producoes, setProducoes] = useState<Producao[]>([]);
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [periodo, setPeriodo] = useState(30);
    const [precoLitro, setPrecoLitro] = useState("");

    async function carregarDados() {
        try {
            const [producoesDados, receitasDados] = await Promise.all([listarProducoes(), listarReceitas()]);
            setProducoes(producoesDados);
            setReceitas(receitasDados);

            const totalLitrosVendidos = receitasDados.reduce((sum, receita) => sum + Number(receita.litros || 0), 0);
            const totalRecebido = receitasDados.reduce((sum, receita) => sum + Number(receita.valorTotal || 0), 0);
            const precoMedio = totalLitrosVendidos > 0 ? totalRecebido / totalLitrosVendidos : 0;

            setPrecoLitro(precoMedio > 0 ? precoMedio.toFixed(2).replace(".", ",") : "");
        } catch (err: any) {
            Toast.show({ type: "error", text1: "Erro ao carregar", text2: err.message || "Não foi possível calcular a previsão.", position: "top" });
        }
    }

    useFocusEffect(useCallback(() => {
        carregarDados();
    }, []));

    const media7Dias = useMemo(() => calcularMediaProducao(producoes, 7), [producoes]);
    const media30Dias = useMemo(() => calcularMediaProducao(producoes, 30), [producoes]);
    const mediaUsada = media7Dias > 0 ? media7Dias : media30Dias;
    const precoEstimado = parseDecimal(precoLitro || "0");
    const litrosPrevistos = mediaUsada * periodo;
    const receitaPrevista = litrosPrevistos * (Number.isNaN(precoEstimado) ? 0 : precoEstimado);

    const ultimaReceita = receitas
        .slice()
        .sort((a, b) => String(b.data).localeCompare(String(a.data)))[0];

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
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Estimativa com base na produção e vendas</Text>
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
                            {formatarNumero(litrosPrevistos)} litros previstos em {periodo} dias
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <ResumoCard icon="droplet" label="Média usada" valor={`${formatarNumero(mediaUsada)} L/dia`} color="#4a90e2" />
                        <ResumoCard icon="dollar-sign" label="Preço/L" valor={precoEstimado > 0 ? formatarMoeda(precoEstimado) : "R$ 0,00"} color="#16a34a" />
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9", gap: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>Período da previsão</Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {PERIODOS.map((dias) => {
                                const ativo = periodo === dias;
                                return (
                                    <TouchableOpacity key={dias} onPress={() => setPeriodo(dias)} activeOpacity={0.75} style={{ flex: 1, backgroundColor: ativo ? "#4a90e2" : "#f9fafb", borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: ativo ? "#fff" : "#6b7280" }}>{dias} dias</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
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

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a", marginBottom: 12 }}>Base do cálculo</Text>
                        <LinhaInfo label="Média últimos 7 dias" valor={`${formatarNumero(media7Dias)} L/dia`} />
                        <LinhaInfo label="Média últimos 30 dias" valor={`${formatarNumero(media30Dias)} L/dia`} />
                        <LinhaInfo label="Vendas registradas" valor={String(receitas.length)} />
                        <LinhaInfo label="Último comprador" valor={ultimaReceita?.comprador || "-"} />
                    </View>
                </View>
            </ScrollView>
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
            acc[data] = (acc[data] || 0) + Number(producao.producao_total || 0);
        }
        return acc;
    }, {} as Record<string, number>);

    const totais = Object.values(totaisPorDia);
    if (totais.length === 0) return 0;
    return totais.reduce((sum, total) => sum + total, 0) / totais.length;
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

function LinhaInfo({ label, valor }: { label: string; valor: string }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12 }}>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>{label}</Text>
            <Text numberOfLines={1} style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: "800", color: "#0a0a0a" }}>{valor}</Text>
        </View>
    );
}
