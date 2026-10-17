import AsyncStorage from "@react-native-async-storage/async-storage";

export type novaTarefa = {
    id: string;
    usuarioId: number;
    acao: "Novo Registro" | "Atualização" | "Exclusão de Registro";
    area: string;
    dadosAntigos?: Record<string, unknown>;
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

    const tarefas = JSON.parse(dados) as (novaTarefa & {
        tipo?: "criar" | "editar" | "excluir";
        para?: string;
    })[];
    const acoes: Record<"criar" | "editar" | "excluir", novaTarefa["acao"]> = {
        criar: "Novo Registro",
        editar: "Atualização",
        excluir: "Exclusão de Registro",
    };

    // Converte também as tarefas salvas antes da mudança de formato.
    return tarefas.map(({ tipo, para, ...tarefa }) => ({
        ...tarefa,
        area: tarefa.area ?? (para === "producao" ? "Produção de Leite" : para) ?? "Área não informada",
        acao: tarefa.acao ?? (tipo ? acoes[tipo] : undefined),
    })) as novaTarefa[];
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
