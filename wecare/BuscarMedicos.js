import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.36:3000";

export default function BuscarMedicosScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [medicos, setMedicos] = useState([]);
  const [filteredMedicos, setFilteredMedicos] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState("");

  useEffect(() => {
    fetchMedicos();
  }, []);

  const fetchMedicos = async () => {
    setLoading(true);
    try {
      console.log("Buscando profissionais no endpoint:", `${API_URL}/profissionais`);
      
      const response = await axios.get(`${API_URL}/profissionais`);
      console.log(`Recebidos ${response.data.length} profissionais da API`);
      
      const medicosData = response.data.map(prof => ({
        id: prof.id,
        nome: prof.nome,
        especialidade: prof.area_atuacao,
        crm: prof.crm || "Sem CRM",
        telefone: prof.telefone || "Não informado"
      }));
      
      setMedicos(medicosData);
      setFilteredMedicos(medicosData);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      console.log("Error response:", error.response ? error.response.data : "Sem resposta");
      console.log("Error status:", error.response ? error.response.status : "Sem status");
      
      Alert.alert(
        "Erro",
        `Não foi possível carregar a lista de profissionais. ${error.message}`
      );
      
      setMedicos([]);
      setFilteredMedicos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchText || especialidadeFiltro) {
      const filtered = medicos.filter((medico) => {
        const matchNome = medico.nome
          .toLowerCase()
          .includes(searchText.toLowerCase());
        const matchEspecialidade =
          !especialidadeFiltro ||
          medico.especialidade.toLowerCase() ===
            especialidadeFiltro.toLowerCase();
        return matchNome && matchEspecialidade;
      });
      setFilteredMedicos(filtered);
    } else {
      setFilteredMedicos(medicos);
    }
  }, [searchText, especialidadeFiltro, medicos]);

  const renderMedicoItem = ({ item }) => (
  <TouchableOpacity
    style={styles.medicoCard}
    onPress={() => navigation.navigate("AgendarHorario", { medicoId: item.id })}
  >
    <View style={styles.medicoHeader}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.nome.charAt(0)}</Text>
      </View>

      <View style={styles.medicoInfo}>
        <Text style={styles.medicoNome}>{item.nome}</Text>
        <Text style={styles.medicoEspecialidade}>{item.especialidade}</Text>
        <Text style={styles.medicoCRM}>CRM: {item.crm}</Text>
      </View>
    </View>

    <View style={styles.medicoActions}>
      <TouchableOpacity
        style={styles.agendarButton}
        onPress={() => navigation.navigate("AgendarHorario", { medicoId: item.id })}
      >
        <Ionicons name="calendar" size={16} color="#fff" />
        <Text style={styles.agendarButtonText}>Agendar Consulta</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.verPerfilButton}
        onPress={() => navigation.navigate("PerfilProfissional", { profissionalId: item.id })}
      >
        <Text style={styles.verPerfilText}>Ver Perfil</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

  const especialidades = [...new Set(medicos.map((m) => m.especialidade))].filter(Boolean);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#2e7d32"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou especialidade..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filtrosContainer}>
        <Text style={styles.filtrosLabel}>Filtrar por especialidade:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosScroll}
        >
          <TouchableOpacity
            style={[
              styles.filtroChip,
              !especialidadeFiltro ? styles.filtroChipSelected : null,
            ]}
            onPress={() => setEspecialidadeFiltro("")}
          >
            <Text
              style={[
                styles.filtroChipText,
                !especialidadeFiltro ? styles.filtroChipTextSelected : null,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {especialidades.map((esp, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filtroChip,
                especialidadeFiltro === esp ? styles.filtroChipSelected : null,
              ]}
              onPress={() =>
                setEspecialidadeFiltro(esp === especialidadeFiltro ? "" : esp)
              }
            >
              <Text
                style={[
                  styles.filtroChipText,
                  especialidadeFiltro === esp
                    ? styles.filtroChipTextSelected
                    : null,
                ]}
              >
                {esp}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        <>
          <View style={styles.actionBar}>
            <Text style={styles.resultCount}>
              {filteredMedicos.length} profissionais encontrados
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchMedicos}>
              <Ionicons name="refresh" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredMedicos}
            renderItem={renderMedicoItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.medicosList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="medical" size={50} color="#ccc" />
                <Text style={styles.emptyText}>
                  Nenhum profissional encontrado
                </Text>
                <Text style={styles.emptySubtext}>
                  Tente cadastrar um profissional primeiro
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 4,
  },
  filtrosContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtrosLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  filtrosScroll: {
    paddingBottom: 16,
  },
  filtroChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filtroChipSelected: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  filtroChipText: {
    color: "#333",
  },
  filtroChipTextSelected: {
    color: "white",
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultCount: {
    fontSize: 14,
    color: "#666",
  },
  refreshButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  medicosList: {
    padding: 16,
    paddingTop: 8,
  },
  medicoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicoHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0f7e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  medicoInfo: {
    flex: 1,
  },
  medicoNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  medicoEspecialidade: {
    fontSize: 14,
    color: "#2e7d32",
    marginBottom: 4,
  },
  medicoCRM: {
    fontSize: 12,
    color: "#666",
  },
  medicoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agendarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  agendarButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  verPerfilButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  verPerfilText: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  }
});