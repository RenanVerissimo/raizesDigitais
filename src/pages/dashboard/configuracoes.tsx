import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, ScrollView, StatusBar, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";





export default function Configuracoes() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [excluirConta, setExcluirConta] = useState(false);

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
                            backgroundColor: "rgba(0,0,0,0.6)",
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            <View style={{
                                width: "85%",
                                backgroundColor: "white",
                                borderRadius: 15,
                                padding: 25,
                                alignItems: "center",
                                gap: 20,
                                elevation: 10
                            }}>

                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: "bold",
                                    textAlign: "center"
                                }}>
                                    Excluir Conta
                                </Text>

                                <Text style={{
                                    fontSize: 14,
                                    textAlign: "center"
                                }}>
                                    Tem certeza que deseja excluir sua conta?
                                </Text>

                                {/* BOTÕES NA HORIZONTAL */}
                                <View style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    gap: 12
                                }}>

                                    <TouchableOpacity
                                        onPress={() => setExcluirConta(false)}
                                        style={{
                                            flex: 1,
                                            height: 42,
                                            backgroundColor: "#4a90e2",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 14
                                        }}
                                    >
                                        <Text style={{ color: "white" }}>
                                            Cancelar
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            // Implementar exclusão futuramente
                                        }}
                                        style={{
                                            flex: 1,
                                            height: 42,
                                            backgroundColor: "#99351b",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 14
                                        }}
                                    >
                                        <Text style={{ color: "white" }}>
                                            Excluir
                                        </Text>
                                    </TouchableOpacity>

                                </View>
                            </View>
                        </View>
                    </Modal>
                )}
            </ScrollView>

        </View>


    )
}
