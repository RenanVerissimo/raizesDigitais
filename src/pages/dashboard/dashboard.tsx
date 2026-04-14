import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function Dashboard() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const userName = "Produtor";
    const farmName = "Fazenda Modelo";

    const todayProduction = 45;
    const average7Days = 42;
    const totalAnimals = 12;
    const monthlyProduction = 1260;

    const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const recentProductions = [
        { id: 1, data: "2026-04-12", manha: 25, tarde: 20, total: 45, qualidade: "excellent" },
        { id: 2, data: "2026-04-11", manha: 22, tarde: 18, total: 40, qualidade: "good" },
        { id: 3, data: "2026-04-10", manha: 20, tarde: 21, total: 41, qualidade: "good" },
    ];

    function getQualidadeStyle(qualidade: string) {
        if (qualidade === "excellent") return { bg: "#dcfce7", text: "#15803d", label: "Excelente" };
        if (qualidade === "good") return { bg: "#dbeafe", text: "#1d4ed8", label: "Boa" };
        return { bg: "#fef9c3", text: "#a16207", label: "Regular" };
    }

    function handleLogout() {
        navigation.replace("Login");
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
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
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{average7Days}L</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, padding: 14 }}>
                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Animais</Text>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{totalAnimals}</Text>
                        </View>
                    </View>
                </LinearGradient>

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

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a" }}>Últimos Registros</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("ProducaoHistorico")}>
                                <Text style={{ fontSize: 13, color: "#4a90e2" }}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>
                        {recentProductions.map((prod, index) => {
                            const q = getQualidadeStyle(prod.qualidade);
                            return (
                                <View
                                    key={prod.id}
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingVertical: 12,
                                        borderBottomWidth: index < recentProductions.length - 1 ? 1 : 0,
                                        borderBottomColor: "#f1f5f9",
                                    }}
                                >
                                    <View>
                                        <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>
                                            {new Date(prod.data).toLocaleDateString("pt-BR")}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                                            Manhã: {prod.manha}L | Tarde: {prod.tarde}L
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>{prod.total}L</Text>
                                        <View style={{ backgroundColor: q.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 }}>
                                            <Text style={{ fontSize: 11, color: q.text, fontWeight: "500" }}>{q.label}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
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

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="cow" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Animais</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}
                            onPress={() => navigation.navigate("ProducaoHistorico")}>
                            <Feather name="clock" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Histórico</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}>
                            <Feather name="bar-chart-2" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Gráficos</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}>
                            <Feather name="shopping-cart" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Compras</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}>
                            <Feather name="dollar-sign" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Financeiro</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8, marginBottom: insets.bottom + 20 }} activeOpacity={0.7}>
                        <Feather name="package" size={24} color="#4a90e2" />
                        <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Controle de Estoque</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}