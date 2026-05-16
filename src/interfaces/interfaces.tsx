import { Feather } from "@expo/vector-icons";

export interface FloatingIconProps {
    name: React.ComponentProps<typeof Feather>["name"];
    size: number;
    top?: number | `${number}%`;
    left?: number | `${number}%`;
    right?: number | `${number}%`;
    bottom?: number | `${number}%`;
    delay?: number;
    duration?: number;
}

export interface InputFieldProps {
    label: string;
    icon: React.ComponentProps<typeof Feather>["name"];
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
    secureTextEntry?: boolean;
    rightIcon?: React.ComponentProps<typeof Feather>["name"];
    onRightIconPress?: () => void;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export interface Producao {
    id: number;
    data: string;
    producao_diaria: number | string;
    observacoes: string | null;
    criado_em: string;
}

export interface Animal {
    id: number;
    nome: string;
    identificador: string;
    status?: "ativo" | "inativo" | "vendido" | null;

    producao_media_diaria?: number | null;
    raca?: string | null;
    peso?: number | null;
    descricao?: string | null;

    data_nascimento: string;
    data_ultimo_parto?: string | null;

    // Novos campos
    prenha: boolean;
    em_cio: boolean;
    abortou: boolean;
    nao_emprenha: boolean;
    mastite: boolean;
    tratamento_mastite?: string | null;
    doente?: boolean | number | null;
    doenca?: "mastite" | "outra" | null;
    descricao_doenca?: string | null;

    data_cobertura?: string | null;
    data_inseminacao?: string | null;
    data_confirmacao_prenhez?: string | null;
    data_prevista_parto?: string | null;
    data_prevista_secagem?: string | null;

}

export type CategoriaCompra = "racao" | "medicamento" | "equipamento" | "manutencao" | "outros";
export type FinalidadeTratamento = "mastite" | "outro_tratamento" | "uso_geral";
export type StatusCompra = "pendente" | "concluido" | "cancelado";
export type TipoRacaoCompra = "milho" | "farelo_soja" | "nucleo_mineral";
export type UnidadeCompraRacao = "kg" | "saco" | "saca" | "fardo" | "unidade";

export interface Compra {
    id: number;                  // 👈 era string, agora number (vem do MySQL)
    categoria: CategoriaCompra;
    item: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
    fornecedor: string;
    data: string;                // formato "YYYY-MM-DD"
    status: StatusCompra;
    tipoRacao?: TipoRacaoCompra | null;
    unidadeCompra?: UnidadeCompraRacao | null;
    pesoPorUnidadeKg?: number | null;
    quantidadeEstoqueKg?: number | null;
    finalidadeTratamento?: FinalidadeTratamento | null;
    finalidadeDescricao?: string | null;
    observacoes?: string | null;
}

export interface Receita {
    id: number;
    data: string;
    litros: number;
    precoPorLitro: number;
    valorTotal: number;
    comprador: string;
    tipoReceita?: "leite" | "animal";
    animalId?: number | null;
    animalNome?: string | null;
    animalIdentificador?: string | null;
    animalPeso?: number | null;
    valorAnimal?: number | null;
    observacoes?: string | null;
}
