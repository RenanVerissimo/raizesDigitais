import React, { useState } from "react";
import {
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
import { useNavigation } from "@react-navigation/native";

export type CategoriaCompra = "racao" | "medicamento" | "equipamento" | "manutencao" | "outros";
export type StatusCompra = "pendente" | "concluido" | "cancelado";

export interface Compra {
    id: string;
    categoria: CategoriaCompra;
    item: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
    fornecedor: string;
    data: string;
    status: StatusCompra;
    observacoes?: string;
}

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

export default function compras_e_pedidos() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [compras, setCompras] = useState<Compra[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusCompra>("todos");

    const comprasFiltradas = filtroStatus === "todos"
        ? compras
        : compras.filter((c) => c.status === filtroStatus);

    const totalPendente = compras
        .filter((c) => c.status === "pendente")
        .reduce((sum, c) => sum + c.precoTotal, 0);

    const totalConcluido = compras
        .filter((c) => c.status === "concluido")
        .reduce((sum, c) => sum + c.precoTotal, 0);

    function handleAdicionarCompra(novaCompra: Compra) {
        setCompras((prev) => [novaCompra, ...prev]);
    }

    function handleAtualizarStatus(id: string, novoStatus: StatusCompra) {
        setCompras((prev) => prev.map((c) => (c.id === id ? { ...c, status: novoStatus } : c)));
    }

    function handleExcluir(compra: Compra) {
        Alert.alert(
            "Excluir compra",
            `Deseja excluir "${compra.item}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => setCompras((prev) => prev.filter((c) => c.id !== compra.id)),
                },
            ]
        );
    }

    const filtros: { key: "todos" | StatusCompra; label: string; cor: string }[] = [
        { key: "todos", label: "Todos", cor: "#4a90e2" },
        { key: "pendente", label: "Pendente", cor: "#eab308" },
        { key: "concluido", label: "Concluído", cor: "#22c55e" },
        { key: "cancelado", label: "Cancelado", cor: "#ef4444" },
    ];

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
                                {comprasFiltradas.length} {comprasFiltradas.length === 1 ? "item" : "itens"}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("cadastrar_compras", {
                            onCadastrar: handleAdicionarCompra,
                        })}
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
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                            {filtros.map((f) => {
                                const ativo = filtroStatus === f.key;
                                return (
                                    <TouchableOpacity
                                        key={f.key}
                                        onPress={() => setFiltroStatus(f.key)}
                                        activeOpacity={0.7}
                                        style={{
                                            flexGrow: 1,
                                            flexBasis: "22%",
                                            backgroundColor: ativo ? f.cor : "#f3f4f6",
                                            paddingHorizontal: 8,
                                            paddingVertical: 8,
                                            borderRadius: 10,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            numberOfLines={1}
                                            style={{ fontSize: 12, fontWeight: "500", color: ativo ? "#fff" : "#374151" }}
                                        >
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {comprasFiltradas.length === 0 ? (
                        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" }}>
                            <Feather name="shopping-cart" size={48} color="#d1d5db" />
                            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 10 }}>
                                Nenhuma compra encontrada
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 12, marginBottom: insets.bottom + 20 }}>
                            {comprasFiltradas.map((compra) => {
                                const cat = CATEGORIAS[compra.categoria];
                                return (
                                    <View
                                        key={compra.id}
                                        style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" }}
                                    >
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0a0a0a" }}>
                                                        {compra.item}
                                                    </Text>
                                                    <View style={{ backgroundColor: cat.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                                        <Text style={{ fontSize: 10, color: cat.text, fontWeight: "500" }}>
                                                            {cat.label}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                                    Fornecedor: {compra.fornecedor}
                                                </Text>
                                                <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                                                    {new Date(compra.data + "T12:00:00").toLocaleDateString("pt-BR")}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => handleExcluir(compra)} style={{ padding: 6 }} activeOpacity={0.7}>
                                                <Feather name="trash-2" size={16} color="#9ca3af" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
                                            <View style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, padding: 8 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280" }}>Quantidade</Text>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0a0a0a", marginTop: 2 }}>
                                                    {compra.quantidade}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, padding: 8 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280" }}>Preço Unit.</Text>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0a0a0a", marginTop: 2 }}>
                                                    R$ {compra.precoUnitario.toFixed(2)}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: "#eff6ff", borderRadius: 8, padding: 8 }}>
                                                <Text style={{ fontSize: 10, color: "#4a90e2" }}>Total</Text>
                                                <Text style={{ fontSize: 13, fontWeight: "700", color: "#0a0a0a", marginTop: 2 }}>
                                                    R$ {compra.precoTotal.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>

                                        {compra.observacoes && (
                                            <View style={{ backgroundColor: "#f9fafb", borderRadius: 8, padding: 8, marginBottom: 10 }}>
                                                <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Observações</Text>
                                                <Text style={{ fontSize: 12, color: "#374151" }}>{compra.observacoes}</Text>
                                            </View>
                                        )}

                                        <View style={{ flexDirection: "row", gap: 6 }}>
                                            {(["pendente", "concluido", "cancelado"] as StatusCompra[]).map((s) => {
                                                const cfg = STATUS_CONFIG[s];
                                                const ativo = compra.status === s;
                                                return (
                                                    <TouchableOpacity
                                                        key={s}
                                                        onPress={() => handleAtualizarStatus(compra.id, s)}
                                                        activeOpacity={0.7}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: ativo ? cfg.bg : "#f3f4f6",
                                                            borderRadius: 8,
                                                            paddingVertical: 8,
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <Feather name={cfg.icon} size={12} color={ativo ? cfg.text : "#6b7280"} />
                                                        <Text style={{ fontSize: 11, fontWeight: "500", color: ativo ? cfg.text : "#6b7280" }}>
                                                            {cfg.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}