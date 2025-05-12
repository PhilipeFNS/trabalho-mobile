import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomePacienteScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("@WeCare:user");
        if (userDataString) {
          const userObj = JSON.parse(userDataString);
          setUserData(userObj);
        }
      } catch (error) {
        console.error("Erro ao obter dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("@WeCare:token");
      await AsyncStorage.removeItem("@WeCare:user");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userData?.nome ? userData.nome.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo(a),</Text>
            <Text style={styles.userName}>{userData?.nome || "Paciente"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Buscar Médicos")}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="search" size={40} color="#2e7d32" />
          </View>
          <Text style={styles.cardTitle}>Buscar Médicos</Text>
          <Text style={styles.cardDescription}>
            Encontre médicos especialistas disponíveis para consulta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Agendar")}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="calendar" size={40} color="#2e7d32" />
          </View>
          <Text style={styles.cardTitle}>Minhas Consultas</Text>
          <Text style={styles.cardDescription}>
            Visualize suas consultas agendadas e histórico
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Saúde em Destaque</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={30} color="#2e7d32" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Dicas de Saúde</Text>
            <Text style={styles.infoText}>
              Mantenha uma alimentação balanceada e pratique exercícios
              regularmente para ter uma vida saudável.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="medkit" size={30} color="#2e7d32" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Prevenção</Text>
            <Text style={styles.infoText}>
              Realizar check-ups periódicos é essencial para detectar problemas
              de saúde precocemente.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0f7e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#2e7d32",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  logoutButton: {
    padding: 8,
  },
  cardsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIconContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 8,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  infoSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoIconContainer: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
