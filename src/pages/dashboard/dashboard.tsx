import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { listarAnimais, listarProducoes, listarProducoesRecentes } from "../../services/api";
import { Producao } from "../../interfaces/interfaces";

function formatarDataLocal(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function normalizarDataProducao(data?: string | null) {
    if (!data) return "";
    return data.slice(0, 10);
}

export default function Dashboard() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const userName = "Produtor";
    const farmName = "Fazenda Modelo";

    const [todayProduction, setTodayProduction] = useState(0);
    const [average7Days, setAverage7Days] = useState(0);
    const [totalAnimals, setTotalAnimals] = useState(0);
    const [monthlyProduction, setMonthlyProduction] = useState(0);

    const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });




    function getQualidadeStyle(qualidade: string) {
        if (qualidade === "excellent") return { bg: "#dcfce7", text: "#15803d", label: "Excelente" };
        if (qualidade === "good") return { bg: "#dbeafe", text: "#1d4ed8", label: "Boa" };
        return { bg: "#fef9c3", text: "#a16207", label: "Regular" };
    }


    

    function handleLogout() {
        navigation.replace("Login");
    }

    const [producoesRecentes, setProducoesRecentes] = useState<Producao[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    async function carregarDados() {
        try {
            const [producoes, animais, recentes] = await Promise.all([
                listarProducoes(),
                listarAnimais(),
                listarProducoesRecentes(),
            ]);

            const hoje = new Date();
            const mesAtual = hoje.getMonth();
            const anoAtual = hoje.getFullYear();

            const hojeStr = formatarDataLocal(hoje);

            // Produção de hoje
            const producaoHoje = producoes
                .filter((p: any) => {
                    const dataP = normalizarDataProducao(p.data);
                    return dataP === hojeStr;
                })
                .reduce((sum: number, p: any) => sum + Number(p.producao_total), 0);

            // Media diaria dos ultimos 7 dias, incluindo hoje.
            const ultimos7 = new Set(Array.from({ length: 7 }, (_, i) => {
                const d = new Date(hoje);
                d.setDate(hoje.getDate() - i);
                return formatarDataLocal(d);
            }));
            const totaisPorDia = producoes.reduce((acc: Record<string, number>, p: any) => {
                const dataP = normalizarDataProducao(p.data);
                if (ultimos7.has(dataP)) {
                    acc[dataP] = (acc[dataP] ?? 0) + Number(p.producao_total);
                }
                return acc;
            }, {});
            const diasComProducao = Object.keys(totaisPorDia).length;
            const media7 = diasComProducao > 0
                ? Object.values(totaisPorDia).reduce((sum: number, total) => sum + Number(total), 0) / diasComProducao
                : 0;

            // Produção total do mês atual
            const totalMes = producoes
                .filter((p: any) => {
                    const [ano, mes] = normalizarDataProducao(p.data).split("-").map(Number);
                    return ano === anoAtual && mes === mesAtual + 1;
                })
                .reduce((sum: number, p: any) => sum + Number(p.producao_total), 0);

            setTodayProduction(producaoHoje);
            setAverage7Days(Math.round(media7 * 10) / 10);
            setTotalAnimals(animais.length);
            setMonthlyProduction(totalMes);
            setProducoesRecentes(recentes);
        } catch (err) {
            console.error("Erro:", err);
        }
    }

    useFocusEffect(
        useCallback(() => {
            carregarDados();
        }, [])
    );

    async function onRefresh() {
        console.log("🔄 Refresh disparado!");
        setRefreshing(true);
        await carregarDados();
        setRefreshing(false);
    }


    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4a90e2"]}
                        tintColor="#4a90e2"
                    />
                }
            >
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
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 }}>{farmName}</Text>
                            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>Olá, {userName}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: 10, borderRadius: 10 }}
                        >
                            <Feather name="log-out" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, padding: 14 }}>
                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Hoje</Text>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{todayProduction}L</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, padding: 14 }}>
                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Média 7 dias</Text>
                            {/* <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{average7Days}L</Text> */}
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}
                            >
                                {average7Days}L
                            </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, padding: 14 }}>
                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Animais</Text>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{totalAnimals}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 20, marginTop: 8, marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}
                            onPress={() => navigation.navigate("Animais")}>
                            <MaterialCommunityIcons name="cow" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Animais</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}
                            onPress={() => navigation.navigate("ProducaoHistorico")}>
                            <Feather name="clock" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Histórico</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}
                            onPress={() => navigation.navigate("graficos")}>
                            <Feather name="bar-chart-2" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Gráficos</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("compras_e_pedidos")}
                        >
                            <Feather name="shopping-cart" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Compras</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}
                            onPress={() => navigation.navigate("financeiro")}
                        >
                            <Feather name="dollar-sign" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Financeiro</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}
                            onPress={() => navigation.navigate("estoque")}>
                            <Feather name="package" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Estoque</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: "#fff",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 14,
                                padding: 16,
                                alignItems: "center",
                                gap: 8,
                            }}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("Alertas")}
                        >
                            <Feather name="alert-triangle" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>
                                Alertas
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ padding: 20, gap: 20 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
                            <View style={{ backgroundColor: "rgba(74,144,226,0.1)", padding: 8, borderRadius: 10 }}>
                                <Feather name="calendar" size={20} color="#4a90e2" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a" }}>Produção do Mês</Text>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>{currentMonth}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
                            <Text style={{ fontSize: 28, fontWeight: "700", color: "#0a0a0a" }}>{monthlyProduction.toLocaleString("pt-BR")}</Text>
                            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>litros</Text>
                        </View>
                    </View>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("ProducaoRegistro")}>
                        <LinearGradient
                            colors={["#4a90e2", "#357abd"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <Feather name="plus" size={24} color="#fff" />
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>Nova Coleta</Text>
                                    <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Registrar produção do dia</Text>
                                </View>
                            </View>
                            <Feather name="trending-up" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a" }}>Últimos Registros</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("ProducaoHistorico")}>
                                <Text style={{ fontSize: 13, color: "#4a90e2" }}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>
                        {producoesRecentes.map((prod, index) => {
                            const q = getQualidadeStyle(prod.qualidade);
                            return (
                                <View
                                    key={prod.id}
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingVertical: 12,
                                        borderBottomWidth: index < producoesRecentes.length - 1 ? 1 : 0,
                                        borderBottomColor: "#f1f5f9",
                                    }}
                                >
                                    <View>
                                        <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                            {new Date(prod.data).toLocaleDateString("pt-BR")}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                                            Manhã: {prod.producao_manha}L | Tarde: {prod.producao_tarde}L
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>{prod.producao_total}L</Text>
                                        <View style={{ backgroundColor: q.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 }}>
                                            <Text style={{ fontSize: 11, color: q.text, fontWeight: "500" }}>{q.label}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>



                  
                </View>
            </ScrollView>
        </View>
    );
}
