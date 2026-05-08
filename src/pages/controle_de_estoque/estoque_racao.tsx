import React from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EstoqueRacao() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={["#4a90e2", "#357abd"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>Estoque de Ração</Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                            Controle opcional de ração
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}
