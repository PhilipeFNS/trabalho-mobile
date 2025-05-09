import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configuração do servidor - substitua pelo IP da sua máquina
const API_URL = "http://localhost:3000"; // Ajuste para o seu IP local

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      console.log(`Tentando login em: ${API_URL}/login`);

      // Aqui está a correção: enviando email em vez de username
      const response = await axios.post(`${API_URL}/login`, {
        email: username, // Alterado para corresponder ao que o servidor espera
        password: password,
      });

      console.log("Resposta do servidor:", response.data);

      // Guardar token e usuário
      await AsyncStorage.setItem("@WeCare:token", response.data.token);
      await AsyncStorage.setItem(
        "@WeCare:user",
        JSON.stringify(response.data.user)
      );

      // Mensagem de sucesso e redirecionamento
      Alert.alert("Sucesso", "Login realizado com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            // Redireciona para a tela correspondente ao tipo de usuário
            if (response.data.user.tipo === "paciente") {
              navigation.navigate("HomePaciente");
            } else {
              navigation.navigate("HomeProfissional");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Erro no login:", error.response?.data || error.message);

      let message = "Erro ao fazer login";

      if (error.response) {
        if (error.response.status === 401) {
          message = error.response.data.error || "Usuário ou senha incorretos";
        } else {
          message = error.response.data.error || "Erro no servidor";
        }
      }

      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={username}
          onChangeText={setUsername}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={{ marginTop: 10 }}
          />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
          <Text style={styles.forgotPassword}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7e9",
    justifyContent: "center",
    alignItems: "center",
  },
  loginBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    color: "#2e7d32",
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPassword: {
    color: "#2e7d32",
    marginTop: 10,
    fontSize: 14,
  },
});
