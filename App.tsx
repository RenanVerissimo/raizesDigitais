import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./src/pages/login/login";

export default function App() {
  return (
    <SafeAreaProvider>
      <LoginScreen />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}