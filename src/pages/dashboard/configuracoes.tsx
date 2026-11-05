import { useNavigation } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";




export default function Configuracoes() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

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
            </ScrollView>
        </View>
    )
}
