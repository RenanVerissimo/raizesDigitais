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
import producao_edicao from "./src/pages/producao/producao_edicao";
import Animais from "./src/pages/animais/animais";
import CadastrarAnimais from "./src/pages/animais/cadastrar_animais";
import cadastrar_compras from "./src/pages/compras_e_pedidos/cadastrar_compras";
import compras_e_pedidos from "./src/pages/compras_e_pedidos/compras_e_pedidos";
import cadastar_tanque from "./src/pages/controle_de_estoque/cadastar_tanque";
import estoque from "./src/pages/controle_de_estoque/estoque";
import registrar_movimentacao from "./src/pages/controle_de_estoque/registrar_movimentacao";
import financeiro from "./src/pages/financeiro/financeiro";
import cadastrar_receita from "./src/pages/financeiro/cadastrar_receita";
import Graficos from "./src/pages/graficos/graficos";
import graficos from "./src/pages/graficos/graficos";


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
                    <Stack.Screen name="ProducaoEdicao" component={producao_edicao} />
                    <Stack.Screen name="Animais" component={Animais} />
                    <Stack.Screen name="CadastrarAnimais" component={CadastrarAnimais} />
                    <Stack.Screen name="compras_e_pedidos" component={compras_e_pedidos} />
                    <Stack.Screen name="cadastrar_compras" component={cadastrar_compras} />
                    <Stack.Screen name="cadastar_tanque" component={cadastar_tanque} />
                    <Stack.Screen name="estoque" component={estoque} />
                    <Stack.Screen name="registrar_movimentacao" component={registrar_movimentacao} />
                    <Stack.Screen name="financeiro" component={financeiro} />
                    <Stack.Screen name="cadastrar_receita" component={cadastrar_receita} />
                    <Stack.Screen name="graficos" component={graficos} />

                </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
            <Toast />
        </SafeAreaProvider>
    );
}