import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { VictoryPie } from "victory-native";
import { Financiamento } from "../../interfaces/interfaces";
import { calcularSaldoRestante, calcularValorParcela, formatarData, formatarMoeda } from "../../utils/financiamentos";
import { listarFinanciamentos } from "../../services/api";
import Toast from "react-native-toast-message";

export default function Financiamentos() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [financiamentos, setFinanciamentos] = useState<Financiamento[]>([]);

    useFocusEffect(
        useCallback(() => {
            listarFinanciamentos()
                .then(setFinanciamentos)
                .catch((error: any) => Toast.show({ type: "error", text1: "Erro", text2: error.message || "Nao foi possivel carregar os financiamentos.", position: "top", visibilityTime: 3000 }));
        }, [])
    );

    const recentes = financiamentos.slice(0, 5);
    const totalAberto = financiamentos.reduce((total, item) => total + calcularSaldoRestante(item), 0);
    const financiamentosAtivos = financiamentos.filter((item) => item.status === "ativo");
    const financiamentosQuitados = financiamentos.filter((item) => item.status === "quitado");
    const totalQuitado = financiamentosQuitados.reduce((total, item) => total + (item.valorQuitacao || item.valorTotal), 0);
    const maioresSaldos = financiamentosAtivos
        .map((item) => ({ financiamento: item, saldo: calcularSaldoRestante(item) }))
        .filter((item) => item.saldo > 0)
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5);
    const maiorSaldo = Math.max(...maioresSaldos.map((item) => item.saldo), 1);
    const dadosStatus = [
        { x: "Ativos", y: financiamentosAtivos.length },
        { x: "Quitados", y: financiamentosQuitados.length },
    ].filter((item) => item.y > 0);

    const handleCancelar = () => {
        navigation.navigate("financeiro");
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#f5f7fa" }} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" />
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Feather name="dollar-sign" size={18} color="#fff" />
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Financiamentos
                            </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                            Gerencie seus financiamentos
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("cadastrar_financiamento")}
                    style={{ backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}
                >
                    <Feather name="plus" size={20} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                        Adicionar Financiamento
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("quitar_financiamento")}
                    style={{ backgroundColor: "rgba(22,163,74,0.25)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}
                >
                    <Feather name="check-circle" size={20} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                        Quitar Financiamento
                    </Text>
                </TouchableOpacity>
            </LinearGradient>

            <View style={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 20 }}>
                <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" }}>
                    <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Saldo em aberto</Text>
                    <Text style={{ fontSize: 28, fontWeight: "700", color: "#dc2626" }}>
                        {formatarMoeda(totalAberto)}
                    </Text>
                    {financiamentos.length > 0 && (
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                            Considera o valor estimado restante das parcelas.
                        </Text>
                    )}
                </View>

                <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Feather name="pie-chart" size={17} color="#4a90e2" />
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>
                            Situação dos financiamentos
                        </Text>
                    </View>

                    {financiamentos.length === 0 ? (
                        <View style={{ alignItems: "center", paddingVertical: 28 }}>
                            <Feather name="bar-chart-2" size={42} color="#d1d5db" />
                            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                                Nenhum dado para exibir no gráfico
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={{ height: 150, alignItems: "center", justifyContent: "center", marginTop: -8, marginBottom: 6 }}>
                                <VictoryPie
                                    width={230}
                                    height={150}
                                    data={dadosStatus}
                                    colorScale={["#4a90e2", "#16a34a"]}
                                    innerRadius={38}
                                    radius={66}
                                    padAngle={2}
                                    labels={() => ""}
                                    style={{ data: { stroke: "#fff", strokeWidth: 2 } }}
                                />
                            </View>

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
                                <ResumoGrafico
                                    cor="#4a90e2"
                                    label="Ativos"
                                    valor={`${financiamentosAtivos.length}`}
                                    detalhe={formatarMoeda(totalAberto)}
                                />
                                <ResumoGrafico
                                    cor="#16a34a"
                                    label="Quitados"
                                    valor={`${financiamentosQuitados.length}`}
                                    detalhe={formatarMoeda(totalQuitado)}
                                />
                            </View>
                        </>
                    )}
                </View>

                <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Feather name="bar-chart-2" size={17} color="#dc2626" />
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>
                            Maiores saldos em aberto
                        </Text>
                    </View>

                    {maioresSaldos.length === 0 ? (
                        <View style={{ alignItems: "center", paddingVertical: 26 }}>
                            <Feather name="check-circle" size={42} color="#d1d5db" />
                            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8, textAlign: "center" }}>
                                Nenhum saldo em aberto para comparar
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 12 }}>
                            {maioresSaldos.map(({ financiamento, saldo }) => (
                                <View key={financiamento.id} style={{ gap: 6 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                        <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: "700", color: "#374151" }}>
                                            {financiamento.nome}
                                        </Text>
                                        <Text style={{ fontSize: 12, fontWeight: "800", color: "#dc2626" }}>
                                            {formatarMoeda(saldo)}
                                        </Text>
                                    </View>
                                    <View style={{ height: 12, borderRadius: 999, backgroundColor: "#f3f4f6", overflow: "hidden" }}>
                                        <View
                                            style={{
                                                width: `${Math.min((saldo / maiorSaldo) * 100, 100)}%`,
                                                height: "100%",
                                                backgroundColor: "#ef4444",
                                            }}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>
                                Financiamentos recentes
                            </Text>
                            <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                                Ultimos 5 registros
                            </Text>
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => navigation.navigate("ver_todos_financiamentos")}
                            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: "700", color: "#4a90e2" }}>Ver todos</Text>
                            <Feather name="chevron-right" size={16} color="#4a90e2" />
                        </TouchableOpacity>
                    </View>

                    {recentes.length === 0 ? (
                        <View style={{ alignItems: "center", paddingVertical: 28 }}>
                            <Feather name="file-text" size={42} color="#d1d5db" />
                            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                                Nenhum financiamento cadastrado
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {recentes.map((financiamento) => (
                                <CardFinanciamento key={financiamento.id} financiamento={financiamento} />
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

function ResumoGrafico({ cor, label, valor, detalhe }: { cor: string; label: string; valor: string; detalhe: string }) {
    return (
        <View style={{ flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, backgroundColor: "#f9fafb" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: cor }} />
                <Text style={{ fontSize: 11, color: "#6b7280", fontWeight: "700" }}>{label}</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>{valor}</Text>
            <Text numberOfLines={1} style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{detalhe}</Text>
        </View>
    );
}

function CardFinanciamento({ financiamento }: { financiamento: Financiamento }) {
    const valorParcela = calcularValorParcela(financiamento);
    const saldoRestante = calcularSaldoRestante(financiamento);
    const quitado = financiamento.status === "quitado";
    const progresso = Math.min((financiamento.parcelasPagas / financiamento.quantidadeParcelas) * 100, 100);

    return (
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, backgroundColor: quitado ? "#f8fafc" : "#fff" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: quitado ? "#dcfce7" : "#eff6ff", alignItems: "center", justifyContent: "center" }}>
                    <Feather name={quitado ? "check-circle" : "credit-card"} size={19} color={quitado ? "#16a34a" : "#2563eb"} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "800", color: "#0f172a" }}>
                            {financiamento.nome}
                        </Text>
                        <View style={{ backgroundColor: quitado ? "#dcfce7" : "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                            <Text style={{ fontSize: 10, fontWeight: "800", color: quitado ? "#15803d" : "#b91c1c" }}>
                                {quitado ? "Quitado" : "Ativo"}
                            </Text>
                        </View>
                    </View>
                    <Text numberOfLines={1} style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        {financiamento.credor || "Credor nao informado"} - vence em {formatarData(financiamento.dataVencimentoParcela)}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: "#9ca3af" }}>Parcela</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#0f172a" }}>{formatarMoeda(valorParcela)}</Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 11, color: "#9ca3af" }}>Restante</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: quitado ? "#16a34a" : "#dc2626" }}>{formatarMoeda(saldoRestante)}</Text>
                </View>
            </View>

            <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                    <Text style={{ fontSize: 11, color: "#6b7280" }}>
                        {financiamento.parcelasPagas}/{financiamento.quantidadeParcelas} parcelas pagas
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#4a90e2" }}>{progresso.toFixed(0)}%</Text>
                </View>
                <View style={{ height: 6, borderRadius: 999, backgroundColor: "#e5e7eb", overflow: "hidden" }}>
                    <View style={{ width: `${progresso}%`, height: "100%", backgroundColor: quitado ? "#16a34a" : "#4a90e2" }} />
                </View>
            </View>
        </View>
    );
}
