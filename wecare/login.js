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
  Image,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.36:3000";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("@WeCare:token", token);
      await AsyncStorage.setItem("@WeCare:user", JSON.stringify(user));

      if (user.tipo === "paciente") {
        navigation.reset({
          index: 0,
          routes: [{ name: "HomePaciente" }],
        });
      } else if (user.tipo === "profissional") {
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeProfissional" }],
        });
      }
    } catch (error) {
      console.error("Erro no login:", error);

      let message = "Erro ao fazer login";
      if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>

      <View style={styles.loginBox}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
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
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
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