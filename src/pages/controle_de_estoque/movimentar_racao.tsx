import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import DateInput from "../../components/DateInput";
import { toIso } from "../../utils/formatters";
import { criarMovimentacaoRacao } from "../../services/api";
import { Racao } from "./estoque_racao";

type TipoMovRacaoFormulario = "saida" | "ajuste";

function hojeBr() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function MovimentarRacao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const racoes: Racao[] = route.params?.racoes || [];
    const racaoIdInicial = route.params?.racaoId ? String(route.params.racaoId) : "";
    const unidadeCompra = route.params?.unidadeCompra || null;
    const pesoPorUnidadeKg = route.params?.pesoPorUnidadeKg ? Number(route.params.pesoPorUnidadeKg) : null;

    const [formData, setFormData] = useState({
        racaoId: racaoIdInicial || (racoes[0]?.id ? String(racoes[0].id) : ""),
        tipo: "saida" as TipoMovRacaoFormulario,
        quantidade: "",
        descricaoQuantidade: "",
        data: hojeBr(),
        motivo: "",
        destino: "",
        observacoes: "",
    });

    const racaoSelecionada = racoes.find((r) => String(r.id) === formData.racaoId);

    function handleCancelar() {
        navigation.goBack();
    }

    async function handleSubmit() {
        const quantidade = parseFloat(formData.quantidade || "0");
        const data = toIso(formData.data);
        const motivo = formData.motivo.trim() || (formData.tipo === "saida" ? "Consumo" : "Ajuste de inventario");

        if (!formData.racaoId || !data || isNaN(quantidade) || quantidade < 0 || (formData.tipo !== "ajuste" && quantidade <= 0)) {
            Toast.show({ type: "error", text1: "Atencao", text2: "Confira item, data e quantidade.", position: "top" });
            return;
        }

        if (formData.tipo === "saida" && racaoSelecionada && quantidade > racaoSelecionada.quantidadeAtual) {
            Toast.show({ type: "error", text1: "Estoque insuficiente", text2: "A quantidade de saída é maior que o estoque atual.", position: "top" });
            return;
        }

        const observacoes = [
            formData.descricaoQuantidade.trim() ? `Descricao da saida: ${formData.descricaoQuantidade.trim()}` : null,
            formData.observacoes.trim() || null,
        ].filter(Boolean).join("\n") || null;

        try {
            await criarMovimentacaoRacao({
                racaoId: Number(formData.racaoId),
                tipo: formData.tipo,
                quantidade,
                data,
                motivo,
                destino: formData.destino.trim() || null,
                observacoes,
            });

            Toast.show({ type: "success", text1: "Movimentacao registrada", position: "top" });
            setTimeout(() => navigation.goBack(), 500);
        } catch (err: any) {
            Toast.show({ type: "error", text1: "Erro", text2: err.message || "Nao foi possivel movimentar.", position: "top" });
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient colors={["#4a90e2", "#357abd"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Feather name="repeat" size={20} color="#fff" />
                                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Movimentar Ração</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Saída de consumo ou ajuste de estoque</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ padding: 20, gap: 16 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="package" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Item *</Text>
                        </View>
                        {racoes.length === 0 ? (
                            <Text style={{ fontSize: 13, color: "#9ca3af" }}>Nenhuma ração cadastrada.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    {racoes.map((r) => {
                                        const ativo = String(r.id) === formData.racaoId;
                                        return (
                                            <TouchableOpacity key={r.id} onPress={() => setFormData({ ...formData, racaoId: String(r.id) })} activeOpacity={0.7} style={{ backgroundColor: ativo ? "#4a90e2" : "#f9fafb", borderWidth: 1, borderColor: ativo ? "#4a90e2" : "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#0a0a0a" }}>{r.nome}</Text>
                                                <Text style={{ fontSize: 10, color: ativo ? "rgba(255,255,255,0.85)" : "#6b7280", marginTop: 2 }}>{r.quantidadeAtual.toFixed(2)} {r.unidade}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="repeat" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Movimentação *</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {[
                                { key: "saida" as TipoMovRacaoFormulario, label: "Saída", icon: "trending-down" as const, cor: "#ef4444" },
                                { key: "ajuste" as TipoMovRacaoFormulario, label: "Ajuste", icon: "sliders" as const, cor: "#4a90e2" },
                            ].map((tipo) => {
                                const ativo = formData.tipo === tipo.key;
                                return (
                                    <TouchableOpacity key={tipo.key} onPress={() => setFormData({ ...formData, tipo: tipo.key })} activeOpacity={0.7} style={{ flex: 1, backgroundColor: ativo ? tipo.cor : "#f9fafb", borderWidth: 1, borderColor: ativo ? tipo.cor : "#e5e7eb", borderRadius: 10, paddingVertical: 12, alignItems: "center", gap: 4 }}>
                                        <Feather name={tipo.icon} size={16} color={ativo ? "#fff" : "#6b7280"} />
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#fff" : "#6b7280" }}>{tipo.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <Campo icone="archive" label={formData.tipo === "ajuste" ? "Nova quantidade em kg *" : "Quantidade que saiu em kg *"} valor={formData.quantidade} onChange={(v: string) => setFormData({ ...formData, quantidade: v })} placeholder="0" keyboard="decimal-pad" />
                    {formData.tipo === "saida" && (
                        <Campo
                            icone="edit-3"
                            label="Descrição da saída"
                            valor={formData.descricaoQuantidade}
                            onChange={(v: string) => setFormData({ ...formData, descricaoQuantidade: v })}
                            placeholder={unidadeCompra ? `Ex: meia ${unidadeCompra}, 1 ${unidadeCompra}, 2 baldes...` : "Ex: meia saca, 2 baldes, trato da manhã..."}
                        />
                    )}
                    {racaoSelecionada && formData.quantidade && !isNaN(parseFloat(formData.quantidade || "0")) && (
                        <View style={{ marginTop: -8, marginLeft: 4, gap: 2 }}>
                            <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                Após movimentação: {(formData.tipo === "saida"
                                    ? racaoSelecionada.quantidadeAtual - parseFloat(formData.quantidade || "0")
                                    : parseFloat(formData.quantidade || "0")
                                ).toFixed(2)} kg
                            </Text>
                            {formData.tipo === "saida" && unidadeCompra && pesoPorUnidadeKg && parseFloat(formData.quantidade || "0") > 0 && (
                                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                    Equivale a aproximadamente {(parseFloat(formData.quantidade || "0") / pesoPorUnidadeKg).toFixed(2)} {unidadeCompra}
                                </Text>
                            )}
                        </View>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Feather name="calendar" size={16} color="#4a90e2" />
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>Data *</Text>
                        </View>
                        <DateInput value={formData.data} onChange={(v) => setFormData({ ...formData, data: v })} />
                    </View>

                    <Campo icone="file-text" label="Motivo" valor={formData.motivo} onChange={(v: string) => setFormData({ ...formData, motivo: v })} placeholder="Trato, consumo, correção de estoque..." />
                    <Campo icone="map-pin" label="Destino" valor={formData.destino} onChange={(v: string) => setFormData({ ...formData, destino: v })} placeholder="Lote, piquete, animais em lactação..." />
                    <Campo icone="edit-3" label="Observações" valor={formData.observacoes} onChange={(v: string) => setFormData({ ...formData, observacoes: v })} placeholder="Opcional" multiline />

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: insets.bottom + 20 }}>
                        <TouchableOpacity onPress={handleCancelar} activeOpacity={0.7} style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={{ flex: 2 }}>
                            <LinearGradient colors={["#4a90e2", "#357abd"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                                <Feather name="check" size={18} color="#fff" />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Registrar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Campo({ icone, label, valor, onChange, placeholder, keyboard, multiline }: any) {
    return (
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Feather name={icone} size={16} color="#4a90e2" />
                <Text style={{ fontSize: 14, fontWeight: "500", color: "#0a0a0a" }}>{label}</Text>
            </View>
            <TextInput value={valor} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#9ca3af" keyboardType={keyboard || "default"} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: multiline ? 80 : undefined }} />
        </View>
    );
}
