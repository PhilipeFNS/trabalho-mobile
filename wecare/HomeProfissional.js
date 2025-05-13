import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.92.16:3000";

export default function HomeProfissionalScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    consultasHoje: 0,
    consultasSemana: 0,
    novosAgendamentos: 0,
  });

  const carregarEstatisticas = async (userId, token) => {
    try {
      const response = await axios.get(
        `${API_URL}/profissionais/${userId}/estatisticas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Estatísticas recebidas:", response.data);
      setStats(response.data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      
      setStats({
        consultasHoje: 0,
        consultasSemana: 0,
        novosAgendamentos: 0,
      });
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("@WeCare:user");
        const token = await AsyncStorage.getItem("@WeCare:token");
        
        if (!userDataString || !token) {
          Alert.alert(
            "Sessão expirada",
            "Sua sessão expirou, por favor faça login novamente.",
            [
              {
                text: "OK",
                onPress: () => navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                }),
              },
            ]
          );
          return;
        }
        
        const userObj = JSON.parse(userDataString);
        setUserData(userObj);
        
        await carregarEstatisticas(userObj.id, token);
      } catch (error) {
        console.error("Erro ao obter dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
    
    const intervalId = setInterval(async () => {
      try {
        const userDataString = await AsyncStorage.getItem("@WeCare:user");
        const token = await AsyncStorage.getItem("@WeCare:token");
        
        if (userDataString && token) {
          const userObj = JSON.parse(userDataString);
          carregarEstatisticas(userObj.id, token);
        }
      } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error);
      }
    }, 300000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const refreshOnFocus = navigation.addListener('focus', async () => {
      try {
        const userDataString = await AsyncStorage.getItem("@WeCare:user");
        const token = await AsyncStorage.getItem("@WeCare:token");
        
        if (userDataString && token) {
          const userObj = JSON.parse(userDataString);
          carregarEstatisticas(userObj.id, token);
        }
      } catch (error) {
        console.error("Erro ao atualizar ao focar:", error);
      }
    });
    
    return refreshOnFocus;
  }, [navigation]);

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
              {userData?.nome ? userData.nome.charAt(0).toUpperCase() : "D"}
            </Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo(a),</Text>
            <Text style={styles.userName}>
              Dr(a). {userData?.nome || "Profissional"}
            </Text>
            <Text style={styles.specialtyText}>
              {userData?.area_atuacao || "Especialidade"}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.consultasHoje}</Text>
          <Text style={styles.statLabel}>Consultas Hoje</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.consultasSemana}</Text>
          <Text style={styles.statLabel}>Consultas na Semana</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.novosAgendamentos}</Text>
          <Text style={styles.statLabel}>Novos Agendamentos</Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Cadastrar Consulta")}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="add-circle" size={40} color="#2e7d32" />
          </View>
          <Text style={styles.cardTitle}>Cadastrar Horários</Text>
          <Text style={styles.cardDescription}>
            Defina horários disponíveis para atendimento
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Consultas Agendadas")}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="calendar" size={40} color="#2e7d32" />
          </View>
          <Text style={styles.cardTitle}>Consultas Agendadas</Text>
          <Text style={styles.cardDescription}>
            Visualize todas as suas consultas e pacientes agendados
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acesso Rápido</Text>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people" size={24} color="#2e7d32" />
            <Text style={styles.actionButtonText}>Pacientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={24} color="#2e7d32" />
            <Text style={styles.actionButtonText}>Prontuários</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart" size={24} color="#2e7d32" />
            <Text style={styles.actionButtonText}>Estatísticas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings" size={24} color="#2e7d32" />
            <Text style={styles.actionButtonText}>Configurações</Text>
          </TouchableOpacity>
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
  specialtyText: {
    fontSize: 14,
    color: "#2e7d32",
    fontStyle: "italic",
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  cardsContainer: {
    padding: 16,
    paddingTop: 0,
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
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    width: "23%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#333",
    marginTop: 6,
    textAlign: "center",
  },
});
