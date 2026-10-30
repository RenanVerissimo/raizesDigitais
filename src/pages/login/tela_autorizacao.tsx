import React from "react";
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

export default function TelaAutorizacao() {
    return (
        <LinearGradient
            colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
            style={{ flex: 1 }}
        >
            <View style={{ justifyContent: "center", alignItems: "center", marginTop: 180 }}>
                <View style={{
                    width: "90%",
                    height: 400,
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
                        width: "85%",
                        height: 1,
                        backgroundColor: "gray",
                        marginTop: 15,
                        alignSelf: "center"
                    }}>
                        <Text style={{
                            color: "black",
                            textAlign: "justify",
                            marginTop: 10,
                            marginHorizontal: 15,
                            fontSize: 12,
                        }}>
                            Para criar sua conta no Raízes Digitais, é necessário ler e concordar com nossos Termos de Uso e estar ciente da Política de Privacidade.
                        </Text>
                    </View> {/*  msg subtitulo + linha */}

                    <View style={{
                        alignSelf: "center",
                        width: "60%",
                        height: 200,
                        marginTop: 120,
                        borderRadius: 12,
                        //borderWidth: 1,
                        borderColor: "black",
                        backgroundColor: "white"
                    }}>
                        <TouchableOpacity
                            onPress={() => {console.log("termo de uso") }}
                            style={{
                                alignSelf: "center",
                                width: "95%",
                                height: 40,
                                borderWidth: 1,
                                borderRadius: 12,

                            }}>
                            <Text style={{ textAlign: "center", marginTop: 7 }}>
                                Termo de Uso
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                         onPress={() => {console.log("Politica de Privacidade") }}
                            style={{
                                alignSelf: "center",
                                width: "95%",
                                height: 40,
                                borderWidth: 1,
                                borderRadius: 12,
                                marginTop: 20

                            }}>
                            <Text style={{ textAlign: "center", marginTop: 7 }}>
                                Politica de Privacidade
                            </Text>
                        </TouchableOpacity>

                    </View>{/*  botoes */}
                </View> {/*  card */}
            </View>{/*  background */}
        </LinearGradient>
    );
}