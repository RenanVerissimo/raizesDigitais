import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateInput from "./DateInput";

export type TipoParasita = "" | "endoparasitas" | "ectoparasitas" | "ambos";

type Condicao = "mastite" | "parasitas" | "outra";

export type SaudeAnimalForm = {
    mastite: boolean;
    outraDoenca: boolean;
    parasitas: boolean;
    tipoParasita: TipoParasita;
    descricaoDoenca: string;
    dataIdentificacao: string;
    observacoesSaude: string;
    tratamento: string;
    dataInicioTratamento: string;
    dataFimTratamento: string;
};

type Props = {
    value: SaudeAnimalForm;
    onChange: (changes: Partial<SaudeAnimalForm>) => void;
    disabled?: boolean;
};

const condicoes = [
    { value: "mastite", label: "Mastite", description: "Infecção da glândula mamária." },
    { value: "parasitas", label: "Parasitas", description: "Endoparasitas (vermes) ou ectoparasitas (carrapatos, piolhos, etc.)." },
    { value: "outra", label: "Outra doença ou condição", description: "Ex.: febre, casco inflamado, ferimento..." },
] as const;

const tiposParasita = [
    { value: "endoparasitas", label: "Endoparasitas", description: "Parasitas internos, como vermes." },
    { value: "ectoparasitas", label: "Ectoparasitas", description: "Parasitas externos, como carrapatos, piolhos e moscas." },
    { value: "ambos", label: "Ambos", description: "Endoparasitas e ectoparasitas." },
] as const;

function FieldTitle({ icon, title, optional = false }: {
    icon: React.ComponentProps<typeof Feather>["name"];
    title: string;
    optional?: boolean;
}) {
    return (
        <View style={styles.fieldTitle}>
            <View style={styles.iconBadge}><Feather name={icon} size={18} color="#15803d" /></View>
            <Text style={styles.label}>
                {title}{optional && <Text style={styles.optional}> (Opcional)</Text>}
            </Text>
        </View>
    );
}

function RadioOption({ label, description, selected, disabled, onPress }: {
    label: string;
    description: string;
    selected: boolean;
    disabled: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityHint={description}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={onPress}
            activeOpacity={0.75}
            style={[styles.option, selected && styles.optionSelected]}
        >
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{label}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
}

export default function AnimalHealthSection({ value, onChange, disabled = false }: Props) {
    const [seletorAberto, setSeletorAberto] = useState(false);
    const condicao: Condicao | null = value.parasitas ? "parasitas" : value.mastite ? "mastite" : value.outraDoenca ? "outra" : null;
    const opcaoSelecionada = condicoes.find((opcao) => opcao.value === condicao);
    const mostrarOpcoes = !condicao || seletorAberto;
    const temTratamento = Boolean(value.tratamento || value.dataInicioTratamento || value.dataFimTratamento);

    function atualizar(changes: Partial<SaudeAnimalForm>) {
        if (!disabled) onChange(changes);
    }

    function selecionarCondicao(novaCondicao: Condicao | null) {
        if (disabled) return;
        // Mantém os textos e datas ao alternar entre as opções.
        atualizar({
            mastite: novaCondicao === "mastite",
            parasitas: novaCondicao === "parasitas",
            outraDoenca: novaCondicao === "outra",
        });
        setSeletorAberto(false);
    }

    return (
        <View style={[styles.container, disabled && styles.disabled]} pointerEvents={disabled ? "none" : "auto"}>
            <View style={styles.heading}>
                <Feather name="heart" size={22} color="#dc2626" />
                <Text style={styles.title}>Saúde <Text style={styles.optional}>(Opcional)</Text></Text>
            </View>

            <View style={styles.card}>
                <View style={styles.field}>
                    <FieldTitle icon="activity" title="Qual doença ou condição foi identificada?" />
                    {!condicao && <Text style={styles.description}>Selecione uma opção abaixo.</Text>}

                    {opcaoSelecionada && (
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`Condição: ${opcaoSelecionada.label}. Alterar seleção`}
                            accessibilityState={{ expanded: seletorAberto, disabled }}
                            onPress={() => setSeletorAberto(!seletorAberto)}
                            disabled={disabled}
                            activeOpacity={0.75}
                            style={styles.selector}
                        >
                            <Text style={styles.label}>{opcaoSelecionada.label}</Text>
                            <Feather name={seletorAberto ? "chevron-up" : "chevron-down"} size={20} color="#374151" />
                        </TouchableOpacity>
                    )}

                    {mostrarOpcoes && (
                        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Doença ou condição">
                            {condicoes.map((opcao) => (
                                <RadioOption key={opcao.value} {...opcao}
                                    selected={condicao === opcao.value} disabled={disabled}
                                    onPress={() => selecionarCondicao(opcao.value)} />
                            ))}
                            {condicao && (
                                <TouchableOpacity accessibilityRole="button" disabled={disabled}
                                    onPress={() => selecionarCondicao(null)} style={styles.clearButton}>
                                    <Feather name="x" size={16} color="#565c64" />
                                    <Text style={styles.description}>Limpar seleção</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {!condicao && (
                    <View style={styles.hint}>
                        <Feather name="info" size={20} color="#3b82f6" />
                        <Text style={[styles.description, styles.hintText]}>
                            Selecione a condição e, se necessário, informe mais detalhes nos campos seguintes.
                        </Text>
                    </View>
                )}

                {condicao === "parasitas" && (
                    <View style={styles.field}>
                        <FieldTitle icon="activity" title="Qual o tipo de parasita?" />
                        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Tipo de parasita">
                            {tiposParasita.map((opcao) => (
                                <RadioOption key={opcao.value} {...opcao}
                                    selected={value.tipoParasita === opcao.value} disabled={disabled}
                                    onPress={() => atualizar({ tipoParasita: opcao.value })} />
                            ))}
                        </View>
                    </View>
                )}

                {condicao === "outra" && (
                    <View style={styles.field}>
                        <FieldTitle icon="activity" title="Qual doença ou condição?" />
                        <TextInput accessibilityLabel="Qual doença ou condição?" value={value.descricaoDoenca}
                            onChangeText={(descricaoDoenca) => atualizar({ descricaoDoenca })}
                            editable={!disabled} placeholder="Ex.: febre, casco inflamado, ferimento, tristeza..."
                            placeholderTextColor="#94a3b8" multiline numberOfLines={3}
                            textAlignVertical="top" style={styles.textArea} />
                    </View>
                )}

                {condicao && (
                    <View style={styles.field}>
                        <FieldTitle icon="calendar" title="Data de identificação" optional />
                        <DateInput value={value.dataIdentificacao}
                            onChange={(dataIdentificacao) => atualizar({ dataIdentificacao })} />
                    </View>
                )}

                {condicao === "outra" && (
                    <View style={styles.field}>
                        <FieldTitle icon="file-text" title="Observações" optional />
                        <TextInput accessibilityLabel="Observações de saúde" value={value.observacoesSaude}
                            onChangeText={(observacoesSaude) => atualizar({ observacoesSaude })}
                            editable={!disabled} placeholder="Ex.: sintomas, acompanhamento, evolução..."
                            placeholderTextColor="#94a3b8" multiline numberOfLines={3}
                            textAlignVertical="top" style={styles.textArea} />
                    </View>
                )}
            </View>

            {(condicao || temTratamento) && (
                <View style={styles.card}>
                    <View style={styles.field}>
                        <FieldTitle icon="clipboard" title="Tipo de tratamento" optional />
                        <TextInput accessibilityLabel="Tipo de tratamento" value={value.tratamento}
                            onChangeText={(tratamento) => atualizar({ tratamento })}
                            editable={!disabled} placeholder="Descreva os cuidados, medicamentos e acompanhamento realizados..."
                            placeholderTextColor="#94a3b8" multiline numberOfLines={3}
                            textAlignVertical="top" style={styles.textArea} />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Data de início do tratamento <Text style={styles.optional}>(Opcional)</Text></Text>
                        <DateInput value={value.dataInicioTratamento}
                            onChange={(dataInicioTratamento) => atualizar({ dataInicioTratamento })} />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Data de fim do tratamento <Text style={styles.optional}>(Opcional)</Text></Text>
                        <DateInput value={value.dataFimTratamento}
                            onChange={(dataFimTratamento) => atualizar({ dataFimTratamento })} />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: "#d4f8d7", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#a6d5b3", gap: 14 },
    disabled: { opacity: 0.65 },
    heading: { flexDirection: "row", alignItems: "center", gap: 10 },
    title: { flex: 1, fontSize: 16, fontWeight: "600", color: "#0a0a0a" },
    optional: { color: "#8490a3", fontWeight: "400" },
    card: { backgroundColor: "#f8fcf9", borderWidth: 1, borderColor: "#a6d5b3", borderRadius: 16, padding: 14, gap: 22 },
    field: { gap: 10 },
    fieldTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconBadge: { width: 34, height: 34, flexShrink: 0, borderRadius: 12, backgroundColor: "#e2f3e7", alignItems: "center", justifyContent: "center" },
    label: { flexShrink: 1, fontSize: 13, fontWeight: "500", color: "#374151", lineHeight: 19 },
    options: { gap: 10 },
    option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, padding: 12, borderWidth: 1, borderColor: "#dce3e9", borderRadius: 12, backgroundColor: "#f9fafb" },
    optionSelected: { backgroundColor: "#ecfdf3", borderColor: "#22a45a" },
    optionContent: { flex: 1, gap: 3 },
    optionLabel: { fontSize: 14, fontWeight: "600", color: "#25334b", lineHeight: 20 },
    description: { fontSize: 12, color: "#64748b", lineHeight: 18 },
    radio: { width: 20, height: 20, flexShrink: 0, borderWidth: 2, borderColor: "#94a3b8", borderRadius: 10, alignItems: "center", justifyContent: "center" },
    radioSelected: { borderColor: "#16a34a" },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16a34a" },
    selector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 12, borderWidth: 1, borderColor: "#dce3e9", borderRadius: 10, backgroundColor: "#f9fafb", minHeight: 48 },
    clearButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingVertical: 12, paddingHorizontal: 4 },
    hint: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#bfdbfe", backgroundColor: "#eff6ff" },
    hintText: { flex: 1, color: "#475569" },
    textArea: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#dce3e9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#0a0a0a", minHeight: 86 },
});
