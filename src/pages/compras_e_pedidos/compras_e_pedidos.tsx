import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { listarCompras } from "../../services/api";
import { CategoriaCompra, Compra, StatusCompra } from "../../interfaces/interfaces";
import { toBr } from "../../utils/formatters";






export const CATEGORIAS: Record<CategoriaCompra, { label: string; bg: string; text: string }> = {
    racao: { label: "Ração", bg: "#ffedd5", text: "#c2410c" },
    medicamento: { label: "Medicamentos", bg: "#fee2e2", text: "#b91c1c" },
    equipamento: { label: "Equipamentos", bg: "#dbeafe", text: "#1d4ed8" },
    manutencao: { label: "Manutenção", bg: "#ede9fe", text: "#6d28d9" },
    outros: { label: "Outros", bg: "#f3f4f6", text: "#374151" },
};

const STATUS_CONFIG: Record<StatusCompra, { label: string; bg: string; text: string; iconColor: string; icon: any }> = {
    pendente: { label: "Pendente", bg: "#fef9c3", text: "#a16207", iconColor: "#ca8a04", icon: "clock" },
    concluido: { label: "Concluído", bg: "#dcfce7", text: "#15803d", iconColor: "#16a34a", icon: "check-circle" },
    cancelado: { label: "Cancelado", bg: "#fee2e2", text: "#b91c1c", iconColor: "#dc2626", icon: "x-circle" },
};

const FINALIDADE_LABEL: Record<string, { label: string; bg: string; text: string }> = {
    mastite: { label: "Mastite", bg: "#fee2e2", text: "#b91c1c" },
    outro_tratamento: { label: "Tratamento", bg: "#dbeafe", text: "#1d4ed8" },
    uso_geral: { label: "Uso geral", bg: "#f3f4f6", text: "#374151" },
};

const UNIDADE_COMPRA_LABEL: Record<string, { singular: string; plural: string }> = {
    kg: { singular: "kg", plural: "kg" },
    saco: { singular: "saco", plural: "sacos" },
    saca: { singular: "saca", plural: "sacas" },
    fardo: { singular: "fardo", plural: "fardos" },
    unidade: { singular: "un.", plural: "un." },
};

function formatarQuantidadeCompra(compra: Compra) {
    const quantidade = Number(compra.quantidade || 0);
    const unidadeBase = compra.categoria === "racao" ? compra.unidadeCompra : "unidade";
    const unidade = unidadeBase ? UNIDADE_COMPRA_LABEL[unidadeBase] : UNIDADE_COMPRA_LABEL.unidade;
    const labelUnidade = quantidade === 1 ? unidade.singular : unidade.plural;

    return `${quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${labelUnidade}`;
}

export default function ComprasEPedidos() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [compras, setCompras] = useState<Compra[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusCompra>("todos");
    const [carregando, setCarregando] = useState(true);



    const comprasFiltradas = filtroStatus === "todos"
        ? compras
        : compras.filter((c) => c.status === filtroStatus);
    const comprasExibidas = comprasFiltradas.slice(0, 6);

    const totalPendente = compras
        .filter((c) => c.status === "pendente")
        .reduce((sum, c) => sum + c.precoTotal, 0);

    const totalConcluido = compras
        .filter((c) => c.status === "concluido")
        .reduce((sum, c) => sum + c.precoTotal, 0);


    const filtros: { key: "todos" | StatusCompra; label: string; cor: string }[] = [
        { key: "todos", label: "Todos", cor: "#4a90e2" },
        { key: "pendente", label: "Pendente", cor: "#eab308" },
        { key: "concluido", label: "Concluído", cor: "#22c55e" },
        { key: "cancelado", label: "Cancelado", cor: "#ef4444" },
    ];


    useFocusEffect(
        useCallback(() => {
            if (route.params?.filtroStatusInicial) {
                setFiltroStatus(route.params.filtroStatusInicial);
            }

            setCarregando(true);
            listarCompras()
                .then(setCompras)
                .catch(() => Alert.alert("Erro", "Não foi possível carregar as compras"))
                .finally(() => setCarregando(false));
        }, [route.params?.filtroStatusInicial])
    );

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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Compras e Pedidos
                            </Text>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                                {comprasExibidas.length} {comprasExibidas.length === 1 ? "item" : "itens"}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("cadastrar_compras")}
                        style={{
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.3)",
                            borderRadius: 12,
                            paddingVertical: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                            Nova Compra/Pedido
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <Feather name="clock" size={14} color="#ca8a04" />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Pendente</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#0a0a0a" }}>
                                R$ {totalPendente.toFixed(2)}
                            </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <Feather name="check-circle" size={14} color="#16a34a" />
                                <Text style={{ fontSize: 11, color: "#6b7280" }}>Concluído</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#0a0a0a" }}>
                                R$ {totalConcluido.toFixed(2)}
                            </Text>
                        </View>
                    </View>


                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Text style={{ fontSize: 13, fontWeight: "500", color: "#0a0a0a", marginBottom: 10 }}>
                                Filtrar por Status
                            </Text>
                            <View style={{
                                flexDirection: "row",
                                backgroundColor: "#f3f4f6",
                                borderRadius: 10,
                                padding: 3,
                            }}>
                                {filtros.map((f) => {
                                    const ativo = filtroStatus === f.key;
                                    return (
                                        <TouchableOpacity
                                            key={f.key}
                                            onPress={() => setFiltroStatus(f.key)}
                                            activeOpacity={0.7}
                                            style={{
                                                flex: 1,
                                                backgroundColor: ativo ? f.cor : "transparent",
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                alignItems: "center",
                                                shadowColor: ativo ? "#000" : "transparent",
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: ativo ? 0.1 : 0,
                                                shadowRadius: 2,
                                                elevation: ativo ? 2 : 0,
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 11,
                                                fontWeight: ativo ? "700" : "500",
                                                color: ativo ? "#fff" : "#9ca3af",
                                            }}>
                                                {f.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f1f5f9", gap: 12, marginBottom: insets.bottom + 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" }}>
                                <Feather name="shopping-bag" size={18} color="#4a90e2" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#0a0a0a" }}>Compras recentes</Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                                    {comprasExibidas.length} {comprasExibidas.length === 1 ? "compra exibida" : "compras exibidas"}
                                </Text>
                            </View>
                            {comprasFiltradas.length > 6 && (
                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={() => navigation.navigate("todas_compras")}
                                    style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5 }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: "800", color: "#4a90e2" }}>Ver todas</Text>
                                    <Feather name="chevron-right" size={15} color="#4a90e2" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {carregando ? (
                            <View style={{ padding: 32, alignItems: "center" }}>
                                <ActivityIndicator size="large" color="#4a90e2" />
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 14 }}>
                                    Carregando compras
                                </Text>
                                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4, textAlign: "center" }}>
                                    A API pode levar alguns segundos para responder.
                                </Text>
                            </View>
                        ) : comprasExibidas.length === 0 ? (
                            <View style={{ padding: 32, alignItems: "center" }}>
                                <Feather name="shopping-cart" size={48} color="#d1d5db" />
                                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>
                                    Nenhuma compra encontrada
                                </Text>
                            </View>
                        ) : (
                        <View style={{ gap: 12 }}>
                            {comprasExibidas.map((compra) => {
                                const cat = CATEGORIAS[compra.categoria];
                                const status = STATUS_CONFIG[compra.status];
                                const finalidade = compra.finalidadeTratamento ? FINALIDADE_LABEL[compra.finalidadeTratamento] : null;

                                return (
                                    <View
                                        key={compra.id}
                                        style={{
                                            backgroundColor: "#f9fafb",
                                            borderRadius: 14,
                                            padding: 16,
                                            borderWidth: 1,
                                            borderColor: "#f1f5f9",
                                        }}
                                    >
                                        {/* 🔹 HEADER — título + categoria */}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: "600", color: "#0a0a0a", marginBottom: 6 }}>
                                                    {compra.item}
                                                </Text>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                    <View style={{ backgroundColor: cat.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                        <Text style={{ fontSize: 11, color: cat.text, fontWeight: "500" }}>{cat.label}</Text>
                                                    </View>
                                                    <View style={{ backgroundColor: status.bg, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                        <Feather name={status.icon} size={11} color={status.iconColor} />
                                                        <Text style={{ fontSize: 11, color: status.text, fontWeight: "500" }}>{status.label}</Text>
                                                    </View>
                                                    {compra.categoria === "medicamento" && finalidade && (
                                                        <View style={{ backgroundColor: finalidade.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                            <Text style={{ fontSize: 11, color: finalidade.text, fontWeight: "500" }}>{finalidade.label}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>

                                        {/* 🔹 INFO — fornecedor + data */}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                <Feather name="truck" size={12} color="#6b7280" />
                                                <Text style={{ fontSize: 12, color: "#6b7280" }}>{compra.fornecedor}</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                <Feather name="calendar" size={12} color="#6b7280" />
                                                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                                    {toBr(compra.data)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* 🔹 VALORES — grid de 3 */}
                                        <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#f9fafb", padding: 10, borderRadius: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Quantidade</Text>
                                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>{formatarQuantidadeCompra(compra)}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Preço Un.</Text>
                                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#0a0a0a" }}>R$ {compra.precoUnitario.toFixed(2)}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Total</Text>
                                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#4a90e2" }}>R$ {compra.precoTotal.toFixed(2)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
