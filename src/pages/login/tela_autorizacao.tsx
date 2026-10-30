import React, { useState } from "react";
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
    const [termosAceitos, setTermosAceitos] = useState(false);


    function handleContinuar() {

        /*         if(termosAceitos === true){
                   navigation.navigate("")}     
                }else{
                    return;
        
                } */
    }

    return (
        <LinearGradient
            colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
            style={{ flex: 1 }}
        >
            <View style={{ justifyContent: "center", alignItems: "center", marginTop: 180 }}>
                <View style={{
                    width: "90%",
                    height: 450,
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
                        marginTop: 90,
                        borderRadius: 12,
                        //borderWidth: 1,
                        borderColor: "black",
                        backgroundColor: "white"
                    }}>
                        <TouchableOpacity
                            onPress={() => { console.log("termo de uso") }}
                            style={{
                                alignSelf: "center",
                                width: "95%",
                                height: 40,
                                borderWidth: 1,
                                borderRadius: 12,
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
                                Termo de Uso
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { console.log("Politica de Privacidade") }}
                            style={{
                                alignSelf: "center",
                                width: "95%",
                                height: 40,
                                borderWidth: 1,
                                borderRadius: 12,
                                marginTop: 20,
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
                                Politica de Privacidade
                            </Text>
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
                            <Text style={{ flex: 1, color: "black", fontSize: 12 }}>
                                Li e aceito os Termos de Uso e estou ciente da Política de Privacidade.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { console.log("Politica de Privacidade") }}
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
                                CONTINUAR
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { console.log("Politica de Privacidade") }}
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
