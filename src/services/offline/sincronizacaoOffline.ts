import AsyncStorage from "@react-native-async-storage/async-storage";

export type novaTarefa = {
    id: string;
    usuarioId: number;
    tipo: "criar" | "editar" | "excluir";
    para: string;
    dados: Record<string, unknown>;
    criadaEm: string;
};


function chaveTarefas(usuarioId: number): string {
    return `@raizes_digitais:usuario:${usuarioId}:tarefas_offline`;
}


export async function listaDeTarefasOffline(
    usuarioId: number
): Promise<novaTarefa[]> {

    const chave = chaveTarefas(usuarioId);
    const dados = await AsyncStorage.getItem(chave);

    if (!dados) {
        return [];
    }

    return JSON.parse(dados) as novaTarefa[];
}


export async function adicionarTarefaOffline(
    usuarioId: number,
    novaTarefa: novaTarefa
): Promise<void> {

    const chave = chaveTarefas(usuarioId);

    // Pega as tarefas que já existem
    const tarefas = await listaDeTarefasOffline(usuarioId);

    // Adiciona a nova
    tarefas.push(novaTarefa);

    // Salva tudo novamente
    await AsyncStorage.setItem(
        chave,
        JSON.stringify(tarefas)
    );
}
