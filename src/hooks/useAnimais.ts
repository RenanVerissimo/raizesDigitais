import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Animal } from "../interfaces/interfaces";
import { getUsuarioLogado, listarAnimais } from "../services/api";

export function useAnimais() {
    const [animais, setAnimais] = useState<Animal[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useFocusEffect(useCallback(() => {
        let ativo = true;
        setAnimais([]);
        setCarregando(true);
        setErro("");

        async function carregar() {
            try {
                const usuario = await getUsuarioLogado();
                if (!usuario || !ativo) return;
                const dados = await listarAnimais();
                if (ativo && (await getUsuarioLogado())?.id === usuario.id) setAnimais(dados);
            } catch (error) {
                if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar os animais.");
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        void carregar();
        return () => { ativo = false; };
    }, []));

    return { animais, setAnimais, carregando, erro };
}
