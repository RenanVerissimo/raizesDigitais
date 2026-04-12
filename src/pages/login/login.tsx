import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "./styles";
import { FloatingIconProps, InputFieldProps } from "../../interfaces/interfaces";


const colors = {
    primary: "#3b82f6",
    foreground: "#1e293b",
    border: "#e2e8f0",
    mutedForeground: "#94a3b8",
};



function FloatingIcon({ name, source, size, top, left, right, bottom, delay, duration }: FloatingIconProps & { source?: any }) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -18,
                    duration: duration ?? 3000,
                    delay: delay ?? 0,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: duration ?? 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute" as const,
                top,
                left,
                right,
                bottom,
                transform: [{ translateY }],
                opacity: 0.25,
            }}
        >
            {source ? (
                <Image source={source} style={{ width: size, height: size, tintColor: "#ffffff" }} resizeMode="contain" />
            ) : (
                <Feather name={name} size={size} color="#ffffff" />
            )}
        </Animated.View>
    );
}

function InputField({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    secureTextEntry,
    rightIcon,
    onRightIconPress,
    autoCapitalize,
}: InputFieldProps) {
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
                    keyboardType={keyboardType ?? "default"}
                    autoCapitalize={autoCapitalize ?? "none"}
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                    selectionColor={colors.primary}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={[styles.input, { color: colors.foreground, paddingRight: rightIcon ? 44 : 16, borderWidth: 0, outlineStyle: "none" as any }]}
                />
                {rightIcon && onRightIconPress && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.rightIconBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name={rightIcon} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
function FloatingImage({ source, size, top, left, right, bottom, delay, duration }: {
    source: any;
    size: number;
    top?: number | `${number}%`;
    left?: number | `${number}%`;
    right?: number | `${number}%`;
    bottom?: number | `${number}%`;
    delay?: number;
    duration?: number;
}) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -18,
                    duration: duration ?? 3000,
                    delay: delay ?? 0,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: duration ?? 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute" as const,
                top,
                left,
                right,
                bottom,
                transform: [{ translateY }],
                opacity: 0.25,
            }}
        >
            <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
        </Animated.View>
    );
}
export default function LoginScreen() {
    const insets = useSafeAreaInsets();

    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        phone: "",
        farmName: "",
        password: "",
        confirmPassword: "",
    });

    async function handleLoginSubmit() {
        if (!loginData.email || !loginData.password) {
            Alert.alert("Atenção", "Preencha todos os campos.");
            return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsLoading(true);
        setTimeout(() => {
            Alert.alert("Sucesso", "Login realizado com sucesso!");
            setIsLoading(false);
        }, 800);
    }

    async function handleRegisterSubmit() {
        if (!registerData.name || !registerData.email || !registerData.farmName || !registerData.password) {
            Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
            return;
        }
        if (registerData.password !== registerData.confirmPassword) {
            Alert.alert("Erro", "As senhas não coincidem!");
            return;
        }
        if (registerData.password.length < 6) {
            Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsLoading(true);
        setTimeout(() => {
            Alert.alert("Sucesso", "Conta criada com sucesso!");
            setIsLoading(false);
        }, 800);
    }

    function switchTab(toLogin: boolean) {
        Haptics.selectionAsync();
        setIsLogin(toLogin);
        setShowPassword(false);
        setShowConfirmPassword(false);
    }

    return (
        <LinearGradient colors={["#1e3a8a", "#3b82f6", "#60a5fa"]} style={styles.gradient}>


            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                >
                    <FloatingIcon source={require("../../assets/garrafa-de-leite.png")} size={32} top="15%" left={40} duration={3000} delay={0} name={"phone"} />
                    <FloatingIcon name="trending-up" size={28} top="7%" right={50} duration={4000} delay={500} />
                    <View style={styles.header}>
                        <View style={styles.logoWrapper}>
                            <View style={styles.logoContainer}>
                                <Image source={require("../../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
                            </View>
                        </View>
                        <Text style={styles.appName}>Raízes Digitais</Text>
                        <View style={styles.taglineWrapper}>
                            <Text style={styles.tagline}>Gestão Inteligente de Produção Leiteira</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <LinearGradient colors={["#3b82f6", "#60a5fa", "#93c5fd"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardTopBar} />

                        <View style={styles.tabContainer}>
                            <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => switchTab(true)} activeOpacity={0.8}>
                                <Text style={[styles.tabText, isLogin ? styles.tabTextActive : styles.tabTextInactive]}>Entrar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => switchTab(false)} activeOpacity={0.8}>
                                <Text style={[styles.tabText, !isLogin ? styles.tabTextActive : styles.tabTextInactive]}>Cadastrar</Text>
                            </TouchableOpacity>
                        </View>

                        {isLogin ? (
                            <View>
                                <Text style={styles.formTitle}>Bem-vindo de Volta!</Text>
                                <Text style={styles.formSubtitle}>Entre com suas credenciais</Text>
                                <InputField label="E-mail" icon="mail" value={loginData.email}
                                    onChangeText={(v) => setLoginData({ ...loginData, email: v })}
                                    placeholder="seu@email.com" keyboardType="email-address" />
                                <InputField label="Senha" icon="lock" value={loginData.password}
                                    onChangeText={(v) => setLoginData({ ...loginData, password: v })}
                                    placeholder="••••••••" secureTextEntry={!showPassword}
                                    rightIcon={showPassword ? "eye-off" : "eye"}
                                    onRightIconPress={() => setShowPassword(!showPassword)} />
                                <View style={styles.rememberRow}>
                                    <TouchableOpacity>
                                        <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={styles.submitButton} onPress={handleLoginSubmit} activeOpacity={0.85} disabled={isLoading}>
                                    <LinearGradient colors={["#3b82f6", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                                        {isLoading ? <ActivityIndicator color="#fff" /> : (
                                            <View style={styles.submitContent}>
                                                <Text style={styles.submitText}>Entrar</Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.formTitle}>Criar Conta</Text>
                                <Text style={styles.formSubtitle}>Preencha os dados para começar</Text>
                                <InputField label="Nome Completo" icon="user" value={registerData.name}
                                    onChangeText={(v) => setRegisterData({ ...registerData, name: v })}
                                    placeholder="Digite seu nome completo" autoCapitalize="words" />
                                <InputField label="E-mail" icon="mail" value={registerData.email}
                                    onChangeText={(v) => setRegisterData({ ...registerData, email: v })}
                                    placeholder="seu@email.com" keyboardType="email-address" />
                                <InputField label="Telefone" icon="phone" value={registerData.phone}
                                    onChangeText={(v) => setRegisterData({ ...registerData, phone: v })}
                                    placeholder="(00) 00000-0000" keyboardType="phone-pad" />
                                <InputField label="Nome da Fazenda" icon="home" value={registerData.farmName}
                                    onChangeText={(v) => setRegisterData({ ...registerData, farmName: v })}
                                    placeholder="Digite o nome da fazenda" autoCapitalize="words" />
                                <InputField label="Senha" icon="lock" value={registerData.password}
                                    onChangeText={(v) => setRegisterData({ ...registerData, password: v })}
                                    placeholder="••••••••" secureTextEntry={!showPassword}
                                    rightIcon={showPassword ? "eye-off" : "eye"}
                                    onRightIconPress={() => setShowPassword(!showPassword)} />
                                <InputField label="Confirmar Senha" icon="lock" value={registerData.confirmPassword}
                                    onChangeText={(v) => setRegisterData({ ...registerData, confirmPassword: v })}
                                    placeholder="••••••••" secureTextEntry={!showConfirmPassword}
                                    rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)} />
                                <TouchableOpacity style={styles.submitButton} onPress={handleRegisterSubmit} activeOpacity={0.85} disabled={isLoading}>
                                    <LinearGradient colors={["#3b82f6", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                                        {isLoading ? <ActivityIndicator color="#fff" /> : (
                                            <View style={styles.submitContent}>
                                                <Text style={styles.submitText}>Criar Conta</Text>
                                                <Feather name="zap" size={16} color="#ffffff" />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.versionRow}>
                            <View style={styles.divider} />
                            <Text style={styles.versionText}>Versão 1.0 - Sistema de Gestão Leiteira</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}