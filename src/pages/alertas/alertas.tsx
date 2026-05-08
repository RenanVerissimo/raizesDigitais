import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { listarAnimais } from "../../services/api";
import { calcularDataParto, calcularDias } from "../../utils/alerts";

function Secao({ titulo, dados, cor, icone }: any) {
    if (!dados || dados.length === 0) return null;

    return (
        <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <MaterialCommunityIcons name={icone} size={20} color={cor} />
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937" }}>
                    {titulo} <Text style={{ color: "#9ca3af", fontWeight: "400" }}>({dados.length})</Text>
                </Text>
            </View>

            {dados.map((a: any) => (
                <View key={a.id} style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 16,
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: "#f1f5f9",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    elevation: 2,
                }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{a.nome}</Text>
                        <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>ID: {a.identificador}</Text>
                        {a.abortou === 1 && (
                            <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: "600", marginTop: 4 }}>Ocorreu um aborto</Text>
                        )}
                        {a.mastite === 1 && (
                            <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600", marginTop: 4 }}>Mastite registrada</Text>
                        )}
                        {Number(a.doente) === 1 && a.doenca === "outra" && (
                            <Text style={{ fontSize: 12, color: "#1d4ed8", fontWeight: "600", marginTop: 4 }}>
                                Doença: {a.descricao_doenca || "Outra"}
                            </Text>
                        )}
                    </View>
                    <Feather name="chevron-right" size={18} color="#d1d5db" />
                </View>
            ))}
        </View>
    );
}

export default function Alertas() {
    const [animais, setAnimais] = useState<any[]>([]);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        try {
            const data = await listarAnimais();
            setAnimais(data || []);
        } catch (error) {
            console.error("Erro ao carregar alertas:", error);
        }
    }

    // --- FILTROS BASEADOS NO SEU JSON ---

    // 1. Em Cio: No seu JSON é o campo "em_cio": 1
    const emCio = animais.filter(a => a.em_cio === 1);

    // 2. Vacas Prenhas: No seu JSON é o campo "prenha": 1
    const vacasPrenhas = animais.filter(a => a.prenha === 1);

    // 3. Abortos: No seu JSON é o campo "abortou": 1
    const abortos = animais.filter(a => a.abortou === 1);

    const mastite = animais.filter(a => Number(a.mastite) === 1);
    const outrasDoencas = animais.filter(a => Number(a.doente) === 1 && a.doenca === "outra");

    // 4. Datas (Parto e Secagem) - Só funcionam se houver "data_cobertura"
    // 3. Próximos Partos (Ajustado para evitar o erro de 'null')
    const proximosPartos = vacasPrenhas.filter(a => {
        const dataBaseGestacao = a.data_inseminacao || a.data_cobertura;
        if (!dataBaseGestacao) return false;

        const parto = calcularDataParto(dataBaseGestacao);

        // Verificação de segurança: se o parto for null, ignora este animal
        if (!parto) return false;

        const dias = calcularDias(parto.toISOString());
        return dias >= 0 && dias <= 15;
    });

    // 4. Sugestão de Secagem (Ajustado para evitar o erro de 'null')
    const secagem = vacasPrenhas.filter(a => {
        const dataBaseGestacao = a.data_inseminacao || a.data_cobertura;
        if (!dataBaseGestacao) return false;

        const parto = calcularDataParto(dataBaseGestacao);

        // Verificação de segurança: se o parto for null, ignora este animal
        if (!parto) return false;

        const dias = calcularDias(parto.toISOString());
        return dias >= 0 && dias <= 60;
    });

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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
                    <View>
                        <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>🚨 Central de Alertas</Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>Acompanhe os eventos importantes</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            >
                <Secao titulo="Em Cio" dados={emCio} cor="#f59e0b" icone="fire" />

                <Secao titulo="Confirmado: Prenha" dados={vacasPrenhas} cor="#10b981" icone="check-circle-outline" />

                <Secao titulo="Próximos Partos" dados={proximosPartos} cor="#3b82f6" icone="baby-carriage" />

                <Secao titulo="Sugestão de Secagem" dados={secagem} cor="#8b5cf6" icone="water-off" />

                <Secao titulo="Atenção: Abortos" dados={abortos} cor="#7f1d1d" icone="alert-octagon" />

                <Secao titulo="Saúde: Mastite" dados={mastite} cor="#dc2626" icone="medical-bag" />

                <Secao titulo="Saúde: Outras Doenças" dados={outrasDoencas} cor="#1d4ed8" icone="heart-pulse" />

                {emCio.length === 0 && vacasPrenhas.length === 0 && abortos.length === 0 && mastite.length === 0 && outrasDoencas.length === 0 && (
                    <View style={{ alignItems: "center", marginTop: 60 }}>
                        <MaterialCommunityIcons name="check-decagram" size={60} color="#d1d5db" />
                        <Text style={{ color: "#9ca3af", fontSize: 16, marginTop: 10 }}>Nenhum alerta no momento</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
