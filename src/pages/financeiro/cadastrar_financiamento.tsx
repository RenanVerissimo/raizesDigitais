import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";


export default function CadastrarFinanciamento() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const handleCancelar = () => {
        (navigation as any).navigate("financiamentos");
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
                            <Feather name="plus-circle" size={18} color="#fff" />
                            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
                                Cadastrar Financiamento
                            </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                            Adicione um novo financiamento
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 16, color: "#0a0a0a", fontWeight: "700" }}>
                    Conteúdo do formulário aqui
                </Text>
            </View>
        </ScrollView>
    );
}
