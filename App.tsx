import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProducaoRegistro from "./src/pages/producao/producao_registro";
import ProducaoHistorico from "./src/pages/producao/producao_historico";
import Dashboard from "./src/pages/dashboard/dashboard";
import LoginScreen from "./src/pages/login/login";

import Toast from "react-native-toast-message";
import ProducaoEdicao from "./src/pages/producao/producao_edicao";
import Animais from "./src/pages/animais/animais";
import CadastrarAnimais from "./src/pages/animais/cadastrar_animais";
import CadastrarCompras from "./src/pages/compras_e_pedidos/cadastrar_compras";
import ComprasEPedidos from "./src/pages/compras_e_pedidos/compras_e_pedidos";
import CadastrarTanque from "./src/pages/controle_de_estoque/cadastar_tanque";
import Estoque from "./src/pages/controle_de_estoque/estoque";
import EstoqueRacao from "./src/pages/controle_de_estoque/estoque_racao";
import RegistrarMovimentacao from "./src/pages/controle_de_estoque/registrar_movimentacao";
import TodasMovimentacoes from "./src/pages/controle_de_estoque/todas_movimentacoes";
import EditarMovimentacao from "./src/pages/controle_de_estoque/editar_movimentacao";
import Financeiro from "./src/pages/financeiro/financeiro";
import CadastrarReceita from "./src/pages/financeiro/cadastrar_receita";
import VerTodasReceitas from "./src/pages/financeiro/ver_todas_receitas";
import Graficos from "./src/pages/graficos/graficos";
import EditarAnimais from "./src/pages/animais/editar_animais";
import VerTodosAnimais from "./src/pages/animais/ver_todos_animais";
import EditarCompras from "./src/pages/compras_e_pedidos/editar_compras";
import EditarReceita from "./src/pages/financeiro/editar_receitas";
import Alertas from "./src/pages/alertas/alertas";


const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Dashboard" component={Dashboard} />
                    <Stack.Screen name="ProducaoRegistro" component={ProducaoRegistro} />
                    <Stack.Screen name="ProducaoHistorico" component={ProducaoHistorico} />
                    <Stack.Screen name="ProducaoEdicao" component={ProducaoEdicao} />
                    <Stack.Screen name="Animais" component={Animais} />
                    <Stack.Screen name="CadastrarAnimais" component={CadastrarAnimais} />
                    <Stack.Screen name="compras_e_pedidos" component={ComprasEPedidos} />
                    <Stack.Screen name="cadastrar_compras" component={CadastrarCompras} />
                    <Stack.Screen name="cadastar_tanque" component={CadastrarTanque} />
                    <Stack.Screen name="estoque" component={Estoque} />
                    <Stack.Screen name="estoque_racao" component={EstoqueRacao} />
                    <Stack.Screen name="registrar_movimentacao" component={RegistrarMovimentacao} />
                    <Stack.Screen name="todas_movimentacoes" component={TodasMovimentacoes} />
                    <Stack.Screen name="editar_movimentacao" component={EditarMovimentacao} />
                    <Stack.Screen name="financeiro" component={Financeiro} />
                    <Stack.Screen name="cadastrar_receita" component={CadastrarReceita} />
                    <Stack.Screen name="ver_todas_receitas" component={VerTodasReceitas} />
                    <Stack.Screen name="graficos" component={Graficos} />
                    <Stack.Screen name="editar_animais" component={EditarAnimais} />
                    <Stack.Screen name="ver_todos_animais" component={VerTodosAnimais} />
                    <Stack.Screen name="editar_compras" component={EditarCompras} />
                    <Stack.Screen name="editar_receita" component={EditarReceita} />
                    <Stack.Screen name="Alertas" component={Alertas} />

                </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
            <Toast />
        </SafeAreaProvider>
    );
}
