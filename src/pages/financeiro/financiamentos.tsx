import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

export default function Financimentos() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handleCancelar = () => {
        (navigation as any).navigate("financeiro");
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
            <LinearGradient
                colors={["#4a90e2", "#357abd"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                    paddingTop: insets.top + 16,
                    paddingHorizontal: 20,
                    paddingBottom: 24,
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <TouchableOpacity onPress={handleCancelar} style={{ padding: 4 }}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Feather name="dollar-sign" size={18} color="#fff" />
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Financiamentos
                            </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                            Gerencie seus financiamentos
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => (navigation as any).navigate("cadastrar_financiamento")}
                    style={{ backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}
                >
                    <Feather name="plus" size={20} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                        Adicionar Financiamento
                    </Text>
                </TouchableOpacity>
            </LinearGradient>
            <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                    Financiamentos
                </Text>
            </View>
        </ScrollView>
    );
}
