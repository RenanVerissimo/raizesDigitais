import { useCallback, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import {
    calcularSaldoRestante,
    calcularValorParcela,
    formatarData,
    formatarMoeda,
} from "../../utils/financiamentos";
import { Financiamento } from "../../interfaces/interfaces";
import { listarFinanciamentos } from "../../services/api";
import Toast from "react-native-toast-message";

export default function VerTodosFinanciamentos() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [financiamentos, setFinanciamentos] = useState<Financiamento[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "quitado">("todos");
    const [busca, setBusca] = useState("");

    useFocusEffect(
        useCallback(() => {
            listarFinanciamentos()
                .then(setFinanciamentos)
                .catch((error: any) => Toast.show({ type: "error", text1: "Erro", text2: error.message || "Nao foi possivel carregar os financiamentos.", position: "top", visibilityTime: 3000 }));
        }, [])
    );

    const termoBusca = busca.trim().toLowerCase();
    const financiamentosFiltrados = financiamentos.filter((financiamento) => {
        const statusOk = filtroStatus === "todos" || financiamento.status === filtroStatus;
        const textoBusca = [
            financiamento.nome,
            financiamento.credor || "",
            financiamento.dataFinanciamento || "",
            financiamento.dataVencimentoParcela || "",
            formatarData(financiamento.dataFinanciamento),
            formatarData(financiamento.dataVencimentoParcela),
        ].join(" ").toLowerCase();

        return statusOk && (!termoBusca || textoBusca.includes(termoBusca));
    });

    const totalAberto = financiamentosFiltrados.reduce((total, item) => total + calcularSaldoRestante(item), 0);

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
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
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="list" size={18} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                    Todos os Financiamentos
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {financiamentosFiltrados.length} registros encontrados
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 20 }}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Total em aberto</Text>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#dc2626" }}>{formatarMoeda(totalAberto)}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Text style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Quantidade</Text>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>{financiamentosFiltrados.length}</Text>
                        </View>
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9", gap: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12 }}>
                            <Feather name="search" size={16} color="#9ca3af" />
                            <TextInput
                                value={busca}
                                onChangeText={setBusca}
                                placeholder="Buscar por nome ou data"
                                placeholderTextColor="#9ca3af"
                                style={{ flex: 1, minHeight: 42, fontSize: 14, color: "#0f172a" }}
                            />
                        </View>
                        <View style={{ flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 10, padding: 3 }}>
                            <FiltroStatus label="Todos" ativo={filtroStatus === "todos"} onPress={() => setFiltroStatus("todos")} />
                            <FiltroStatus label="Nao quitados" ativo={filtroStatus === "ativo"} onPress={() => setFiltroStatus("ativo")} />
                            <FiltroStatus label="Quitados" ativo={filtroStatus === "quitado"} onPress={() => setFiltroStatus("quitado")} />
                        </View>
                    </View>

                    {financiamentosFiltrados.length === 0 ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Feather name="file-text" size={48} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>
                                Nenhum financiamento encontrado
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {financiamentosFiltrados.map((financiamento) => (
                                <CardFinanciamentoCompleto
                                    key={financiamento.id}
                                    financiamento={financiamento}
                                    onEditar={() => navigation.navigate("editar_financiamento", { financiamento })}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function FiltroStatus({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={{ flex: 1, backgroundColor: ativo ? "#fff" : "transparent", borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
        >
            <Text style={{ fontSize: 11, fontWeight: ativo ? "800" : "600", color: ativo ? "#4a90e2" : "#6b7280" }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function CardFinanciamentoCompleto({ financiamento, onEditar }: { financiamento: Financiamento; onEditar: () => void }) {
    const valorParcela = calcularValorParcela(financiamento);
    const saldoRestante = calcularSaldoRestante(financiamento);
    const quitado = financiamento.status === "quitado";
    const progresso = Math.min((financiamento.parcelasPagas / financiamento.quantidadeParcelas) * 100, 100);

    return (
        <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 10, flex: 1, minWidth: 0 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: quitado ? "#dcfce7" : "#eff6ff", alignItems: "center", justifyContent: "center" }}>
                        <Feather name={quitado ? "check-circle" : "credit-card"} size={20} color={quitado ? "#16a34a" : "#2563eb"} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "800", color: "#0f172a" }}>
                            {financiamento.nome}
                        </Text>
                        <Text numberOfLines={1} style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                            {financiamento.credor || "Credor nao informado"}
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TouchableOpacity onPress={onEditar} activeOpacity={0.75} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="edit-2" size={15} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ backgroundColor: quitado ? "#dcfce7" : "#fee2e2", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: quitado ? "#15803d" : "#b91c1c" }}>
                            {quitado ? "Quitado" : "Ativo"}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
                <LinhaInfo label="Valor total" valor={formatarMoeda(financiamento.valorTotal)} />
                <LinhaInfo label="Valor da parcela" valor={formatarMoeda(valorParcela)} />
                <LinhaInfo label="Saldo restante" valor={formatarMoeda(saldoRestante)} destaque={!quitado} />
                <LinhaInfo label="Data do financiamento" valor={formatarData(financiamento.dataFinanciamento)} />
                <LinhaInfo label="Vencimento da parcela" valor={formatarData(financiamento.dataVencimentoParcela)} />
            </View>

            <View style={{ marginTop: 12 }}>
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

function LinhaInfo({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <Text style={{ flex: 1, fontSize: 12, color: "#6b7280" }}>{label}</Text>
            <Text style={{ fontSize: 12, fontWeight: "800", color: destaque ? "#dc2626" : "#0f172a", textAlign: "right" }}>
                {valor}
            </Text>
        </View>
    );
}
