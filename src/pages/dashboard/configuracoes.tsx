import { useNavigation, CommonActions } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, ScrollView, StatusBar, Modal, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { excluirUsuario, limparUsuarioLogado, verificarSenhaUsuario } from "../../services/api";
import Toast from "react-native-toast-message";
import { toastConfig } from "../../components/toastConfig";
import { goBack } from "expo-router/build/global-state/routing";
import { TextInput } from "react-native";



export default function Configuracoes() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [excluirConta, setExcluirConta] = useState(false);
    const [confirmExcluir, setConfirmExcluir] = useState(false);
    const [senhaDigitada, setSenhaDigitada] = useState(String);
    const [confirmacaoSenha, setConfirmacaoSenha] = useState(String);
    const [verificacaoStatus, setVerificacaoStatus] = useState(false);


    function resetarCampos() {
        
        setConfirmExcluir(false);
        setSenhaDigitada("");
        setConfirmacaoSenha("");

    }

    async function verificacaoSenhaBackEnd() {

        try {
            await verificarSenhaUsuario(senhaDigitada);
            await verificarSenhaUsuario(confirmacaoSenha);
            setVerificacaoStatus(true);

        } catch (error) {
            console.log(error);
            return
        }
    }

    async function deletarUsuario() {

        await excluirUsuario();
        await limparUsuarioLogado();
        setExcluirConta(false);
        setSenhaDigitada("");
        setConfirmacaoSenha("");

        Toast.show({
            type: "success",
            text1: "Sua conta foi excluida com sucesso",
            position: "top",
            visibilityTime: 3200,
        });

        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
            })
        );

    }

    async function verificacaoSenhas() {

        if (!senhaDigitada.trim() || !confirmacaoSenha.trim()) {

            Toast.show({
                type: "error",
                text1: "Campo Vazio",
                text2: "Um ou mais campos de senha estão vazios. Por favor, preencha todos os campos para continuar.",
                position: "top",
                visibilityTime: 3200,
            });
            return
        }

        try {
            if (senhaDigitada === confirmacaoSenha) {
                await verificacaoSenhaBackEnd();
                if (verificacaoStatus) {
                    await deletarUsuario();
                } else {
                    Toast.show({
                        type: "error",
                        text1: "Senha Incorreta",
                        text2: "Essa senha é invalida.",
                        position: "top",
                        visibilityTime: 3200,
                    });

                }
            } else {
                Toast.show({
                    type: "error",
                    text1: "Senhas Incorretas",
                    text2: "As senha nao sao iguais, por favor preencha corretamente.",
                    position: "top",
                    visibilityTime: 3200,
                });
            }

        } catch (error) {
            Toast.show({
                type: "info",
                text1: "Erro, nao foi possivel excluir sua conta",

                position: "top",
                visibilityTime: 3200,
            });
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#4a90e2", "#357abd"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24,
                        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 18,
                            height: 40,
                            width: "100%",
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                justifyContent: "center",
                                padding: 4,
                                zIndex: 1,
                            }}
                        >
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>

                        <Text
                            style={{
                                fontSize: 22,
                                color: "white",
                                textAlign: "center",
                                marginLeft: 24
                            }}
                        >
                            Configurações
                        </Text>
                    </View>
                </LinearGradient>
                <View style={{ marginTop: 200, justifyContent: "space-between", flex: 1, alignItems: "center", gap: 20 }}>
                    <TouchableOpacity style={{
                        width: 200,
                        height: 50,
                        borderWidth: 1,
                        alignItems: "center",
                        borderRadius: 14,
                        justifyContent: "center",
                        backgroundColor: "#4a90e2"
                    }}>
                        <Text style={{ textAlign: "center" }}>Teste</Text>

                    </TouchableOpacity>
                    <TouchableOpacity style={{
                        width: 200,
                        height: 50,
                        borderWidth: 1,
                        alignItems: "center",
                        borderRadius: 14,
                        justifyContent: "center",
                        backgroundColor: "#4a90e2"
                    }}>
                        <Text style={{ textAlign: "center" }}>Teste</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setExcluirConta(!excluirConta)}
                        style={{
                            width: 200,
                            height: 50,
                            borderWidth: 1,
                            alignItems: "center",
                            borderRadius: 14,
                            justifyContent: "center",
                            backgroundColor: "#99351b"
                        }}>
                        <Text style={{ textAlign: "center" }}>Excluir Conta</Text>
                    </TouchableOpacity>
                </View>
                {excluirConta && (
                    <Modal
                        visible={excluirConta}
                        transparent={true}
                        animationType="fade"
                        statusBarTranslucent={true}
                        onRequestClose={() => setExcluirConta(false)}
                    >
                        <View style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.65)",
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            <View style={{
                                width: "88%",
                                backgroundColor: "#FFFFFF",
                                borderRadius: 18,
                                padding: 24,
                                alignItems: "center",
                                elevation: 12,
                                gap: 16
                            }}>

                                {/* ÍCONE DE ALERTA */}
                                <View style={{
                                    width: 58,
                                    height: 58,
                                    borderRadius: 29,
                                    backgroundColor: "#FEE2E2",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <Feather
                                        name="alert-triangle"
                                        size={28}
                                        color="#B42318"
                                    />
                                </View>

                                {/* TÍTULO */}
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    color: "#1F2937",
                                    lineHeight: 28,
                                    marginTop: 4
                                }}>
                                    Deseja EXCLUIR sua conta?
                                </Text>

                                {/* AVISO */}
                                <Text style={{
                                    fontSize: 14,
                                    textAlign: "center",
                                    color: "#6B7280",
                                    lineHeight: 22
                                }}>
                                    Esta ação é permanente e não poderá ser desfeita.
                                    {"\n\n"}
                                    <Text style={{
                                        fontWeight: "bold",
                                        color: "#B42318",
                                    }}>
                                        Você perderá o acesso à sua conta.
                                    </Text>
                                </Text>

                                {/* BOTÕES */}
                                <View style={{
                                    flexDirection: "row",
                                    width: "100%",
                                    gap: 12,
                                    marginTop: 12
                                }}>

                                    {/* CANCELAR */}
                                    <TouchableOpacity
                                        onPress={() => setExcluirConta(false)}
                                        activeOpacity={0.7}
                                        style={{
                                            flex: 1,
                                            height: 48,
                                            backgroundColor: "#FFFFFF",
                                            borderWidth: 1.5,
                                            borderColor: "#94A3B8",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 12,
                                            elevation: 2
                                        }}
                                    >
                                        <Text style={{
                                            color: "#1F2937",
                                            fontSize: 15,
                                            fontWeight: "bold"
                                        }}>
                                            Cancelar
                                        </Text>
                                    </TouchableOpacity>

                                    {/* EXCLUIR */}
                                    <TouchableOpacity
                                        onPress={() => setConfirmExcluir(!confirmExcluir)}
                                        activeOpacity={0.7}
                                        style={{
                                            flex: 1,
                                            height: 48,
                                            backgroundColor: "#B42318",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 12
                                        }}
                                    >
                                        <Text style={{
                                            color: "#FFFFFF",
                                            fontSize: 15,
                                            fontWeight: "bold"
                                        }}>
                                            Excluir
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}

                {confirmExcluir && (
                    <Modal
                        visible={confirmExcluir}
                        transparent={true}
                        animationType="fade"
                        statusBarTranslucent={true}
                        onRequestClose={() => setConfirmExcluir(false)}
                    >
                        <View style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.65)",
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            <View style={{
                                width: "94%",
                                minHeight: 420,
                                backgroundColor: "#FFFFFF",
                                borderRadius: 18,
                                padding: 24,
                                alignItems: "center",
                                elevation: 12,
                                gap: 16,

                            }}>
                                <Text>Para confirmar o processo de exclusao de conta, voce precisa digitar a sua senha</Text>
                                <View style={{}}>
                                    <Text
                                        style={{ marginTop: 20 }}>Digite a senha:
                                    </Text>

                                    <TextInput
                                        value={senhaDigitada}
                                        onChangeText={setSenhaDigitada}
                                        placeholder="Sua senha"
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={{
                                            borderWidth: 1,
                                            width: "100%",
                                            height: 48,
                                            paddingHorizontal: 12,
                                            borderRadius: 8,
                                        }}
                                    />

                                    <Text
                                        style={{ marginTop: 20 }}>Confirme a senha:
                                    </Text>

                                    <TextInput
                                        value={confirmacaoSenha}
                                        onChangeText={setConfirmacaoSenha}
                                        placeholder="Confirme sua senha"
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={{
                                            borderWidth: 1,
                                            width: "100%",
                                            height: 48,
                                            paddingHorizontal: 12,
                                            borderRadius: 8,
                                        }}
                                    />
                                </View>
                                <View
                                    style={{

                                        width: "100%",
                                        gap: 18,
                                        padding: 28,
                                        alignItems: "stretch",

                                    }}>

                                    <TouchableOpacity
                                        onPress={verificacaoSenhas}
                                        style={{
                                            flex: 1,
                                            borderWidth: 1,
                                            borderRadius: 14,
                                            minHeight: 48,
                                            paddingHorizontal: 10,
                                            paddingVertical: 10,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "red"
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontWeight: "600",
                                                textAlign: "center",
                                                color: "white",
                                            }}
                                        >
                                            Continuar com a Exclusão da Conta
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={resetarCampos}
                                        style={{
                                            borderWidth: 1,
                                            borderRadius: 14,
                                            height: 40,
                                            width: 185,
                                            alignItems: "center",
                                            justifyContent: "center",

                                        }}
                                    >
                                        <Text
                                            style={{ fontWeight: "600" }}>
                                            Voltar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <Toast config={toastConfig} />
                    </Modal>
                )}
            </ScrollView>
        </View >
    )
}
