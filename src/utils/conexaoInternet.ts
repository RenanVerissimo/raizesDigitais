import NetInfo from "@react-native-community/netinfo";

/** Retorna true quando o aparelho está desconectado ou sem acesso à internet. */
export async function estaSemInternet(): Promise<boolean> {
    const rede = await NetInfo.fetch();
    return rede.isConnected === false || rede.isInternetReachable === false;
}
