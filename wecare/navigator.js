import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "./login";
import CadastroScreen from "./cadastro";
import HomePacienteScreen from "./HomePaciente";
import BuscarMedicosScreen from "./BuscarMedicos";
import AgendarConsultaScreen from "./AgendarConsulta";
import HomeProfissionalScreen from "./HomeProfissional";
import CadastrarConsultaScreen from "./CadastrarConsulta";
import ConsultasAgendadasScreen from "./ConsultasAgendadas";
import AgendarHorarioScreen from './AgendarHorario';


const Stack = createStackNavigator();
const PacienteTab = createBottomTabNavigator();
const ProfissionalTab = createBottomTabNavigator();

function PacienteTabNavigator() {
  return (
    <PacienteTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Buscar Médicos") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Agendar") {
            iconName = focused ? "calendar" : "calendar-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#2e7d32",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <PacienteTab.Screen
        name="Home"
        component={HomePacienteScreen}
        options={{ title: "Início" }}
      />
      <PacienteTab.Screen
        name="Buscar Médicos"
        component={BuscarMedicosScreen}
      />
      <PacienteTab.Screen
        name="Agendar"
        component={AgendarConsultaScreen}
        options={{ title: "Minhas Consultas" }}
      />
    </PacienteTab.Navigator>
  );
}

function ProfissionalTabNavigator() {
  return (
    <ProfissionalTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Cadastrar Consulta") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Consultas Agendadas") {
            iconName = focused ? "calendar" : "calendar-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#2e7d32",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <ProfissionalTab.Screen
        name="Home"
        component={HomeProfissionalScreen}
        options={{ title: "Início" }}
      />
      <ProfissionalTab.Screen
        name="Cadastrar Consulta"
        component={CadastrarConsultaScreen}
      />
      <ProfissionalTab.Screen
        name="Consultas Agendadas"
        component={ConsultasAgendadasScreen}
      />
    </ProfissionalTab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="AgendarHorario" component={AgendarHorarioScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HomePaciente" component={PacienteTabNavigator} />
        <Stack.Screen
          name="HomeProfissional"
          component={ProfissionalTabNavigator}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
