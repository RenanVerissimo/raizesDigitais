import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import { getUsuarioLogado } from "../../services/api";
import {
    listaDeTarefasOffline,
    novaTarefa
} from "../../services/offline/sincronizacaoOffline";


export default function TarefasOffline() {

    const navigation = useNavigation<any>();

    const [tarefas, setTarefas] = useState<novaTarefa[]>([]);


    async function carregarTarefas() {

        const usuario = await getUsuarioLogado();

        if (!usuario) {
            return;
        }

        const tarefasSalvas = await listaDeTarefasOffline(usuario.id);

        setTarefas(tarefasSalvas);
    }


    function voltar() {
        navigation.goBack();
    }


    useEffect(() => {
        carregarTarefas();
    }, []);


    return (
        <View>

            <Pressable onPress={voltar}>
                <Text>← Voltar</Text>
            </Pressable>

            <Text>Tarefas Offline</Text>

            <FlatList
                data={tarefas}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View>

                        <Text>Para: {item.para}</Text>

                        <Text>Operação: {item.tipo}</Text>

                        <Text>
                            Data: {new Date(item.criadaEm).toLocaleString("pt-BR")}
                        </Text>

                    </View>
                )}
            />

        </View>
    );
}