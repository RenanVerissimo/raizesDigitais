import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { redefinirSenhaPorCpf, verificarCpfRecuperacao } from "../../services/api";
import { styles } from "./styles";

const colors = {
    primary: "#3b82f6",
    foreground: "#1e293b",
    mutedForeground: "#94a3b8",
};

function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, "");
}

function Campo({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    rightIcon,
    onRightIconPress,
}: {
    label: string;
    icon: React.ComponentProps<typeof Feather>["name"];
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    rightIcon?: React.ComponentProps<typeof Feather>["name"];
    onRightIconPress?: () => void;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
            <View
                style={[
                    styles.inputWrapper,
                    {
                        borderColor: focused ? colors.primary : "transparent",
                        backgroundColor: "#f8fafc",
                    },
                ]}
            >
                <Feather
                    name={icon}
                    size={18}
                    color={focused ? colors.primary : colors.mutedForeground}
                    style={styles.inputIcon}
                />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={secureTextEntry}
                    keyboardType={icon === "credit-card" ? "numeric" : "default"}
                    autoCapitalize="none"
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                    selectionColor={colors.primary}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={[styles.input, { color: colors.foreground, paddingRight: rightIcon ? 44 : 16, borderWidth: 0, outlineStyle: "none" as any }]}
                />
                {rightIcon && onRightIconPress && (
                    <TouchableOpacity style={styles.rightIconBtn} onPress={onRightIconPress} activeOpacity={0.7}>
                        <Feather name={rightIcon} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export default function EsqueciSenha() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [cpfRg, setCpfRg] = useState("");
    const [cpfValidado, setCpfValidado] = useState(false);
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleVerificarCpf() {
        const documento = somenteNumeros(cpfRg);
        if (!documento) {
            Toast.show({
                type: "error",
                text1: "CPF/RG obrigatório",
                text2: "Digite somente os números do CPF/RG.",
                position: "top",
            });
            return;
        }

        setIsLoading(true);
        try {
            await verificarCpfRecuperacao(documento);
            setCpfValidado(true);
            Toast.show({
                type: "success",
                text1: "CPF/RG encontrado",
                text2: "Agora informe sua nova senha.",
                position: "top",
            });
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "CPF/RG incorreto",
                text2: err.message || "O CPF/RG digitado está errado.",
                position: "top",
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleRedefinirSenha() {
        if (!senha || !confirmarSenha) {
            Alert.alert("Atenção", "Preencha a senha e a confirmação.");
            return;
        }

        if (senha !== confirmarSenha) {
            Alert.alert("Erro", "As senhas não coincidem!");
            return;
        }

        if (senha.length < 6) {
            Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsLoading(true);
        try {
            await redefinirSenhaPorCpf({
                cpf_rg: somenteNumeros(cpfRg),
                senha,
                confirmar_senha: confirmarSenha,
            });
            Toast.show({
                type: "success",
                text1: "Senha alterada com sucesso",
                text2: "Faça login com a nova senha.",
                position: "top",
                visibilityTime: 2200,
            });
            setTimeout(() => navigation.goBack(), 900);
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Não foi possível redefinir",
                text2: err.message || "Confira o CPF/RG e tente novamente.",
                position: "top",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <LinearGradient colors={["#1e3a8a", "#3b82f6", "#60a5fa"]} style={styles.gradient}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.appName}>Raízes Digitais</Text>
                        <View style={styles.taglineWrapper}>
                            <Text style={styles.tagline}>Recuperação de senha</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <LinearGradient colors={["#3b82f6", "#60a5fa", "#93c5fd"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardTopBar} />

                        <Text style={styles.formTitle}>Esqueceu a senha?</Text>
                        <Text style={styles.formSubtitle}>Digite somente os números do CPF/RG cadastrado</Text>

                        <Campo
                            label="CPF/RG"
                            icon="credit-card"
                            value={cpfRg}
                            onChangeText={(value) => setCpfRg(somenteNumeros(value))}
                            placeholder="Digite somente os números"
                        />

                        {cpfValidado && (
                            <>
                                <Campo
                                    label="Nova Senha"
                                    icon="lock"
                                    value={senha}
                                    onChangeText={setSenha}
                                    placeholder="••••••••"
                                    secureTextEntry={!showPassword}
                                    rightIcon={showPassword ? "eye-off" : "eye"}
                                    onRightIconPress={() => setShowPassword(!showPassword)}
                                />
                                <Campo
                                    label="Confirmar Nova Senha"
                                    icon="lock"
                                    value={confirmarSenha}
                                    onChangeText={setConfirmarSenha}
                                    placeholder="••••••••"
                                    secureTextEntry={!showConfirmPassword}
                                    rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={cpfValidado ? handleRedefinirSenha : handleVerificarCpf}
                            activeOpacity={0.85}
                            disabled={isLoading}
                        >
                            <LinearGradient colors={["#3b82f6", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : (
                                    <View style={styles.submitContent}>
                                        <Text style={styles.submitText}>{cpfValidado ? "Redefinir Senha" : "Verificar CPF/RG"}</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.rememberRow, { alignItems: "center", marginTop: -4 }]} onPress={() => navigation.goBack()} activeOpacity={0.75}>
                            <Text style={[styles.forgotText, { color: colors.primary }]}>Voltar para o login</Text>
                        </TouchableOpacity>

                        <View style={styles.versionRow}>
                            <View style={styles.divider} />
                            <Text style={styles.versionText}>Versão 2.0 - Sistema de Gestão Leiteira</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
