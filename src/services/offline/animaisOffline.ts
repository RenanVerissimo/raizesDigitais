import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Animal } from "../../interfaces/interfaces";

function chaveAnimais(usuarioId: number): string {
    return `@raizes_digitais:usuario:${usuarioId}:animais`;
}


export async function salvarAnimaisLocal(
    usuarioId: number,
    animais: Animal[]
): Promise<void> {


    const chave = chaveAnimais(usuarioId);

    await AsyncStorage.setItem(chave, JSON.stringify(animais));

    console.log(
        "Animais salvos localmente:",
        JSON.stringify(animais)
    );
}

export async function listarAnimaisOffline(usuarioId: number): Promise<Animal[]> {

    const chave = chaveAnimais(usuarioId);
    const dados = await AsyncStorage.getItem(chave);

    if (!dados) {
        return [];
    }

    const animais: unknown = JSON.parse(dados);

    return animais as Animal[];
}

