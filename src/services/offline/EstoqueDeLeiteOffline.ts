import AsyncStorage from "@react-native-async-storage/async-storage";
import { Producao } from "../../interfaces/interfaces";
import { Tanque } from "../../pages/controle_de_estoque/estoque";


function chaveTanques(usuarioId: number): string {
    return `@raizes_digitais:usuario:${usuarioId}:tanques`;
}

export async function salvarTanquesLocal(
    usuarioId: number,
    tanques: Tanque[]
): Promise<void> {
    const chave = chaveTanques(usuarioId);

    await AsyncStorage.setItem(
        chave,
        JSON.stringify(tanques)
    );

    console.log(
        "Tanques salvos localmente:",
        JSON.stringify(tanques)
    );
}

export async function listarTanquesLocal(
    usuarioId: number
): Promise<Tanque[]> {
    const chave = chaveTanques(usuarioId);

    const dados = await AsyncStorage.getItem(chave);

    if (!dados) {
        return [];
    }

    return JSON.parse(dados) as Tanque[];
}