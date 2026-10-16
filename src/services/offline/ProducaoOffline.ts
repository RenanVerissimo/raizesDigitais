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

export async function salvarProducoesLocal(usuarioId: number, producoes: Producao[]): Promise<void> {
    const chave = chaveProducoes(usuarioId);
    await AsyncStorage.setItem(chave, JSON.stringify(producoes));
    console.log("salvarProducoesLocal :", JSON.stringify(producoes));
}

