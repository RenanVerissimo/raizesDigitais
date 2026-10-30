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
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { cadastrar } from "../../services/api";
import { obterCadastroPendente, limparCadastroPendente } from "../../services/cadastroPendente";

type AutorizacaoRoutes = {
    Login: undefined;
    tela_autorizacao: undefined;
    termo_de_uso: undefined;
    politica_de_privacidade: undefined;
};




export default function TelaAutorizacao() {
    const navigation = useNavigation<NativeStackNavigationProp<AutorizacaoRoutes>>();
    const [termosAceitos, setTermosAceitos] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const envioEmAndamento = useRef(false);

    useEffect(() => navigation.addListener("beforeRemove", (event) => {
        if (envioEmAndamento.current) {
            event.preventDefault();
            return;
        }
        limparCadastroPendente();
    }), [navigation]);


    async function handleContinuar() {
        if (envioEmAndamento.current) return;
        if (!termosAceitos) {
            Toast.show({
                type: "error",
                text1: "Aceite os Termos",
                text2: "Você precisa aceitar os termos para cadastrar sua conta e usar o aplicativo.",
                position: "top",
                visibilityTime: 4200,
            });
            return;
        }
        const dados = obterCadastroPendente();
        if (!dados) {
            Toast.show({ type: "error", text1: "Preencha os dados de cadastro", text2: "Volte e preencha o formulário para continuar." });
            return;
        }
        envioEmAndamento.current = true;
        setSalvando(true);
        try {
            await cadastrar(dados);
            limparCadastroPendente();
            envioEmAndamento.current = false;
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            Toast.show({
                type: "success",
                text1: "Conta cadastrada com sucesso!",
                text2: "Faça login para entrar no Raízes Digitais.",
                position: "top",
                visibilityTime: 4200,
            });
        } catch (erro: unknown) {
            Toast.show({
                type: "error",
                text1: "Não foi possível cadastrar sua conta",
                text2: erro instanceof Error ? erro.message : "Tente novamente.",
                position: "top",
                visibilityTime: 4200,
            });
        } finally {
            envioEmAndamento.current = false;
            setSalvando(false);
        }
    }
    function handleTermoDeUso(){
        navigation.navigate("termo_de_uso")

    }

    function handlePoliticaPrivacidade() {
        navigation.navigate("politica_de_privacidade");
    }

    return (
        <LinearGradient
            colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
            style={{ flex: 1 }}
        >
            <View style={{ justifyContent: "center", alignItems: "center", marginTop: 180 }}>
                <View style={{
                    width: "90%",
                    height: 500,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "black",
                    backgroundColor: "white"
                }}>
                    <Text style={{
                        color: "black",
                        textAlign: "center",
                        marginTop: 10,
                        fontSize: 24
                    }}>
                        Termos e Privacidade
                    </Text>
                    <View style={{
                        width: "85.5%",
                        height: 1,
                        backgroundColor: "gray",
                        marginTop: 15,
                        alignSelf: "center"
                    }}>
                        <Text style={{
                            color: "black",
                            textAlign: "justify",
                            marginTop: 10,
                            marginHorizontal: 0,
                            fontSize: 12,
                        }}>
                            Para criar sua conta no Raízes Digitais, é necessário ler e concordar com nossos Termos de Uso e estar ciente da Política de Privacidade.
                            {"\n"}

                        </Text>
                        <Text style={{
                            color: "black",
                            textAlign: "justify",
                            marginTop: 10,
                            marginHorizontal: 0,
                            fontSize: 12,
                        }}>
                            Clique nos botões abaixo para ler o termo de uso e politica e privacidade.
                        </Text>

                    </View> {/*  msg subtitulo + linha */}

                    <View style={{
                        alignSelf: "center",
                        width: "90%",
                        height: 200,
                        marginTop: 140,
                        borderRadius: 12,
                        //borderWidth: 1,
                        borderColor: "black",
                        backgroundColor: "white"
                    }}>
                        <TouchableOpacity
                            onPress={() => { handleTermoDeUso() }}
                            style={{
                                flexDirection: "row",
                                paddingHorizontal: 12,
                                alignSelf: "center",
                                width: "95%",
                                height: 52,
                                borderWidth: 1,
                                borderRadius: 12,
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                            <Ionicons name="document-text-outline" size={16} color="black" style={{ marginRight: 8 }} />
                            <Text style={{
                                flex: 1,
                                textAlign: "left",
                                textAlignVertical: "center",
                                includeFontPadding: false,
                                fontSize: 14,
                                fontWeight: "600",
                                lineHeight: 20,
                                margin: 0,
                                padding: 0,
                            }}>
                                Termo de Uso
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="black" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handlePoliticaPrivacidade}
                            style={{
                                flexDirection: "row",
                                paddingHorizontal: 12,
                                alignSelf: "center",
                                width: "95%",
                                height: 52,
                                borderWidth: 1,
                                borderRadius: 12,
                                marginTop: 12,
                                alignItems: "center",
                                justifyContent: "center",

                            }}>
                            <Ionicons name="shield-checkmark-outline" size={16} color="black" style={{ marginRight: 8 }} />
                            <Text style={{
                                flex: 1,
                                textAlign: "left",
                                textAlignVertical: "center",
                                includeFontPadding: false,
                                fontSize: 14,
                                fontWeight: "600",
                                lineHeight: 20,
                                margin: 0,
                                padding: 0,
                            }}>
                                Política de Privacidade
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="black" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setTermosAceitos((aceitos) => !aceitos)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: termosAceitos }}
                            accessibilityLabel="Li e aceito os Termos de Uso e estou ciente da Política de Privacidade"
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                minHeight: 44,
                                marginTop: 16,
                                width: "95%",
                                alignSelf: "center",
                            }}
                        >
                            <View style={{
                                width: 16,
                                height: 16,
                                borderWidth: 1,
                                borderRadius: 4,
                                borderColor: termosAceitos ? "#1e3a8a" : "#666",
                                backgroundColor: termosAceitos ? "#1e3a8a" : "white",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 8,
                            }}>
                                {termosAceitos && <Text style={{ color: "white", fontSize: 12, lineHeight: 14 }}>✓</Text>}
                            </View>
                            <Text style={{
                                flex: 1,
                                color: "black",
                                fontSize: 12,
                                lineHeight: 18,
                                textAlign: "justify",
                                includeFontPadding: false,
                            }}>
                                Li e aceito os Termos de Uso e estou ciente da Política de Privacidade.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleContinuar}
                            disabled={salvando}
                            accessibilityState={{ disabled: salvando, busy: salvando }}
                            style={{
                                alignSelf: "center",
                                width: 250,
                                height: 40,
                                borderWidth: 1,
                                borderRadius: 12,
                                marginTop: 30,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "green"
                            }}>
                            <Text style={{
                                width: "100%",
                                textAlign: "center",
                                textAlignVertical: "center",
                                includeFontPadding: false,
                                fontSize: 14,
                                lineHeight: 20,
                                margin: 0,
                                padding: 0,
                            }}>
                                {salvando ? "CADASTRANDO..." : "CONTINUAR"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            disabled={salvando}
                            onPress={() => navigation.goBack()}
                            style={{
                                alignSelf: "center",
                                width: 250,
                                height: 20,


                                marginTop: 10,
                                alignItems: "center",
                                justifyContent: "center",

                            }}>
                            <Text style={{
                                width: "100%",
                                textAlign: "center",
                                textAlignVertical: "center",
                                includeFontPadding: false,
                                fontSize: 14,
                                lineHeight: 20,
                                margin: 0,
                                padding: 0,
                            }}>
                                Voltar
                            </Text>
                        </TouchableOpacity>

                    </View>{/*  botoes */}
                </View> {/*  card */}
            </View>{/*  background */}
        </LinearGradient>
    );
}

