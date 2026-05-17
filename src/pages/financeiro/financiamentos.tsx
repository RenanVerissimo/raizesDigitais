import { useCallback, useState } from "react";
import { Alert, View, Text, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Financiamento } from "../../interfaces/interfaces";
import { calcularSaldoRestante, calcularValorParcela, formatarData, formatarMoeda } from "../../utils/financiamentos";
import { listarFinanciamentos } from "../../services/api";


export default function Financiamentos() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [financiamentos, setFinanciamentos] = useState<Financiamento[]>([]);

    useFocusEffect(
        useCallback(() => {
            listarFinanciamentos()
                .then(setFinanciamentos)
                .catch((error: any) => Alert.alert("Erro", error.message || "Nao foi possivel carregar os financiamentos."));
        }, [])
    );

    const recentes = financiamentos.slice(0, 5);
    const totalAberto = financiamentos.reduce((total, item) => total + calcularSaldoRestante(item), 0);

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
