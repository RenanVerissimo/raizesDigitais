import { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    TouchableOpacity
} from "react-native";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getUsuarioLogado } from "../../services/api";
import {
    listaDeTarefasOffline,
    novaTarefa
} from "../../services/offline/sincronizacaoOffline";
import { Feather } from "@expo/vector-icons";


export default function TarefasOffline() {

    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [tarefas, setTarefas] = useState<novaTarefa[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);


    function voltar() {
        navigation.goBack();
    }


    useFocusEffect(useCallback(() => {
        let ativo = true;
        setCarregando(true);
        setErro(null);
        setTarefas([]);

        async function carregarTarefas() {
            try {
                const usuario = await getUsuarioLogado();
                const tarefasSalvas = usuario ? await listaDeTarefasOffline(usuario.id) : [];
                if (ativo) setTarefas(tarefasSalvas);
            } catch {
                if (ativo) setErro("Não foi possível carregar as tarefas salvas.");
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        void carregarTarefas();
        return () => { ativo = false; };
    }, []));


    return (
        <View style={{ flex: 1, paddingTop: insets.top + 16, paddingHorizontal: 20, backgroundColor: "#4a90e2" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TouchableOpacity onPress={voltar} style={{ padding: 4 }}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={{ fontSize: 22, fontWeight: "700", marginVertical: 20, color: "#fff" }}>Tarefas Offline</Text>
            </View>

            {erro && <Text style={{ color: "#b91c1c", marginBottom: 12 }}>{erro}</Text>}

            <FlatList
                data={tarefas}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                ListEmptyComponent={
                    <Text>{carregando ? "Carregando tarefas…" : erro ? "" : "Nenhuma tarefa offline pendente."}</Text>
                }
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <View style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, gap: 6 }}>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700" }}>Tarefa #{index + 1} </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700" }}>Área: </Text>
                            <Text>{item.area}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700" }}>Ação Realizada: </Text>
                            <Text>{item.acao}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700" }}>Criado em: </Text>
                            <Text>
                                {new Date(item.criadaEm).toLocaleString("pt-BR")}
                            </Text>
                        </View>
                    </View>
                )}
            />

        </View>
    );
}
