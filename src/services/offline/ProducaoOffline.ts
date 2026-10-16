import AsyncStorage from "@react-native-async-storage/async-storage";
import { Producao } from "../../interfaces/interfaces";


function chaveProducoes(usuarioId: number): string {
    return `@raizes_digitais:usuario:${usuarioId}:producoes`;
}

export async function listarProducoesLocal(usuarioId: number): Promise<Producao[]> {
    const chave = chaveProducoes(usuarioId);
    const dados = await AsyncStorage.getItem(chave);

    if (!dados) {
        return [];
    }

    return JSON.parse(dados) as Producao[];

}

/** Substitui a cópia local pelas 50 produções mais recentes recebidas da API. */
export async function salvarProducoesLocal(
    usuarioId: number,
    producoes: Producao[]
): Promise<void> {
    const chave = chaveProducoes(usuarioId);

    const ultimas50 = producoes.slice(0, 50);

    await AsyncStorage.setItem(
        chave,
        JSON.stringify(ultimas50)
    );


    console.log("quantidade:", ultimas50.length);
    
    console.log(
        "Produções salvas localmente:\n",
        JSON.stringify(ultimas50, null, 2)
    );
}

/** Acrescenta uma produção sem apagar os registros já salvos no dispositivo. */
export async function salvarNovaProducaoLocal(
    usuarioId: number,
    producao: Producao
): Promise<void> {
    const producoes = await listarProducoesLocal(usuarioId);

    await AsyncStorage.setItem(
        chaveProducoes(usuarioId),
        JSON.stringify([producao, ...producoes])
    );
}

