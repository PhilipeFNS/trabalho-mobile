import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./login";
import CadastroScreen from "./cadastro";

// Aqui você adicionará suas telas de Paciente e Profissional
// Por enquanto, vou criar telas de exemplo:

import { View, Text, StyleSheet } from "react-native";

function HomePacienteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Área do Paciente</Text>
    </View>
  );
}

function HomeProfissionalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Área do Profissional</Text>
    </View>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="HomePaciente" component={HomePacienteScreen} />
        <Stack.Screen
          name="HomeProfissional"
          component={HomeProfissionalScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7e9",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
  },
});
