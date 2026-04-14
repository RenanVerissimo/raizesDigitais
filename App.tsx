import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProducaoRegistro from "./src/pages/producao/producao_registro";
import ProducaoHistorico from "./src/pages/producao/producao_historico";
import Dashboard from "./src/pages/dashboard/dashboard";
import LoginScreen from "./src/pages/login/login";

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
                </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
        </SafeAreaProvider>
    );
}