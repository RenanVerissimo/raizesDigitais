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
    producao_manha: number;
    producao_tarde: number;
    producao_total: number;
    qualidade: string;
    observacoes: string | null;
    criado_em: string;
}

export interface Animal {
    id: number;
    nome: string;
    identificador: string;
    producao_media_diaria: number;
    raca?: string;
    idade?: string;
}