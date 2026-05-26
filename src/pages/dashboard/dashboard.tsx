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
import { getUsuarioLogado, limparUsuarioLogado, listarAnimais, listarProducoes, listarProducoesRecentes, UsuarioLogado } from "../../services/api";
import { Producao } from "../../interfaces/interfaces";
import { calcularAvisoDescarteLeite, calcularDataParto, calcularDataSecagem, calcularDias } from "../../utils/alerts";

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

function formatarDataProducao(data?: string | null) {
    const normalizada = normalizarDataProducao(data);
    const [ano, mes, dia] = normalizada.split("-").map(Number);
    if (!ano || !mes || !dia) return "-";
    return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

function obterProducaoDiaria(producao: Producao) {
    const numero = Number(producao.producao_diaria);
    return Number.isFinite(numero) ? numero : 0;
}

function contarAlertas(animais: any[]) {
    const emCio = animais.filter((a) => Number(a.em_cio) === 1);
    const vacasPrenhas = animais.filter((a) => Number(a.prenha) === 1);
    const abortos = animais.filter((a) => Number(a.abortou) === 1);
    const mastite = animais.filter((a) => Number(a.mastite) === 1);
    const outrasDoencas = animais.filter((a) => Number(a.doente) === 1 && a.doenca === "outra");
    const descarteLeite = animais.filter((a) => calcularAvisoDescarteLeite(a.data_ultimo_parto, a.dias_descarte_leite));

    const proximosPartos = vacasPrenhas.filter((a) => {
        const dataBaseGestacao = a.data_inseminacao || a.data_reproducao || a.data_base_gestacao || a.data_cobertura;
        if (!dataBaseGestacao) return false;

        const parto = calcularDataParto(dataBaseGestacao);
        if (!parto) return false;

        const dias = calcularDias(parto.toISOString());
        return dias >= 0 && dias <= 10;
    });

    const secagem = vacasPrenhas.filter((a) => {
        const dataBaseGestacao = a.data_inseminacao || a.data_reproducao || a.data_base_gestacao || a.data_cobertura;
        if (!dataBaseGestacao) return false;

        const dataSecagem = calcularDataSecagem(dataBaseGestacao);
        if (!dataSecagem) return false;

        const dias = calcularDias(dataSecagem.toISOString());
        return dias >= 0 && dias <= 10;
    });

    return emCio.length + vacasPrenhas.length + proximosPartos.length + secagem.length + descarteLeite.length + abortos.length + mastite.length + outrasDoencas.length;
}

export default function Dashboard() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

    const userName = usuario?.nome || "Produtor";
    const farmName = usuario?.nome_fazenda || "Minha fazenda";

    const [todayProduction, setTodayProduction] = useState(0);
    const [average7Days, setAverage7Days] = useState(0);
    const [totalAnimals, setTotalAnimals] = useState(0);
    const [monthlyProduction, setMonthlyProduction] = useState(0);
    const [alertCount, setAlertCount] = useState(0);

    const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });




    async function handleLogout() {
        await limparUsuarioLogado();
        navigation.replace("Login");
    }

    const [producoesRecentes, setProducoesRecentes] = useState<Producao[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    async function carregarDados() {
        try {
            const usuarioSalvo = await getUsuarioLogado();
            setUsuario(usuarioSalvo);

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
                .reduce((sum: number, p: Producao) => sum + obterProducaoDiaria(p), 0);

            // Media diaria dos ultimos 7 dias, incluindo hoje.
            const ultimos7 = new Set(Array.from({ length: 7 }, (_, i) => {
                const d = new Date(hoje);
                d.setDate(hoje.getDate() - i);
                return formatarDataLocal(d);
            }));
            const totaisPorDia = producoes.reduce((acc: Record<string, number>, p: any) => {
                const dataP = normalizarDataProducao(p.data);
                if (ultimos7.has(dataP)) {
                    acc[dataP] = (acc[dataP] ?? 0) + obterProducaoDiaria(p);
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
                .reduce((sum: number, p: Producao) => sum + obterProducaoDiaria(p), 0);

            setTodayProduction(producaoHoje);
            setAverage7Days(Math.round(media7 * 10) / 10);
            setTotalAnimals(animais.length);
            setMonthlyProduction(totalMes);
            setProducoesRecentes(recentes);
            setAlertCount(contarAlertas(animais));
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
                            <Feather name="droplet" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Leite</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 }} activeOpacity={0.7}
                            onPress={() => navigation.navigate("estoque_racao")}>
                            <MaterialCommunityIcons name="barley" size={24} color="#4a90e2" />
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a" }}>Ração</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: "#fff",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 14,
                                paddingVertical: 16,
                                paddingLeft: 16,
                                paddingRight: 16,
                                alignItems: "center",
                                gap: 8,
                                position: "relative",
                                overflow: "hidden",
                            }}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("Alertas")}
                        >
                            {alertCount > 0 ? (
                                <>
                                    <View style={{
                                        position: "absolute",
                                        top: 0,
                                        right: 0,
                                        width: 0,
                                        height: 0,
                                        borderTopWidth: 42,
                                        borderLeftWidth: 42,
                                        borderTopColor: "#ef4444",
                                        borderLeftColor: "transparent",
                                    }} />
                                    <Text style={{
                                        position: "absolute",
                                        top: 5,
                                        right: 0,
                                        width: 28,
                                        height: 20,
                                        color: "#fff",
                                        fontSize: 13,
                                        fontWeight: "900",
                                        textAlign: "center",
                                        lineHeight: 18,
                                    }}>
                                        {alertCount > 99 ? "99+" : alertCount}
                                    </Text>
                                </>
                            ) : null}
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
                            return (
                                <View
                                    key={prod.id}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        paddingVertical: 12,
                                        borderBottomWidth: index < producoesRecentes.length - 1 ? 1 : 0,
                                        borderBottomColor: "#f1f5f9",
                                    }}
                                >
                                    <View style={{ flex: 1, justifyContent: "center" }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Feather name="calendar" size={14} color="#4a90e2" />
                                            <Text style={{ fontSize: 17, fontWeight: "800", color: "#0a0a0a" }}>
                                                {formatarDataProducao(prod.data)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{
                                        width: "48%",
                                        backgroundColor: "rgba(74,144,226,0.1)",
                                        borderRadius: 10,
                                        paddingHorizontal: 10,
                                        paddingVertical: 9,
                                    }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 3 }}>
                                            <Feather name="droplet" size={12} color="#4a90e2" />
                                            <Text style={{ fontSize: 11, color: "#4a90e2" }}>Produção diária</Text>
                                        </View>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a", textAlign: "center" }}>
                                            {obterProducaoDiaria(prod)}L
                                        </Text>
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
