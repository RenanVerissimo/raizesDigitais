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


let sincronizando = false;

export async function sincronizarTarefasOffline(
    usuarioId: number,
    enviarTarefa: (tarefa: novaTarefa) => Promise<void>
): Promise<number> {
    if (sincronizando) {
        throw new Error("Já existe uma sincronização em andamento.");
    }

    sincronizando = true;
    let enviadas = 0;

    try {
        const tarefas = await listaDeTarefasOffline(usuarioId);

        // A lista já mantém a ordem em que as tarefas foram adicionadas.
        for (const tarefa of tarefas) {
            // Só continua quando o servidor confirmar o envio.
            await enviarTarefa(tarefa);

            // Relê a fila para preservar tarefas adicionadas durante o envio.
            const filaAtual = await listaDeTarefasOffline(usuarioId);
            const restantes = filaAtual.filter(
                item => item.id !== tarefa.id
            );

            await AsyncStorage.setItem(
                chaveTarefas(usuarioId),
                JSON.stringify(restantes)
            );

            enviadas++;
        }

        return enviadas;
    } finally {
        sincronizando = false;
    }
}