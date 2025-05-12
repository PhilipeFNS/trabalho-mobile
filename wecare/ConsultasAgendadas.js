import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const consultasMock = [
  {
    id: 1,
    pacienteNome: "João Silva",
    pacienteIdade: 35,
    data: "2023-08-15",
    horario: "09:00",
    status: "confirmada",
    online: false,
    telefone: "(11) 98765-4321",
  },
  {
    id: 2,
    pacienteNome: "Maria Oliveira",
    pacienteIdade: 28,
    data: "2023-08-15",
    horario: "10:30",
    status: "confirmada",
    online: true,
    telefone: "(11) 91234-5678",
  },
  {
    id: 3,
    pacienteNome: "Pedro Santos",
    pacienteIdade: 42,
    data: "2023-08-16",
    horario: "14:00",
    status: "pendente",
    online: false,
    telefone: "(11) 99876-5432",
  },
  {
    id: 4,
    pacienteNome: "Ana Ferreira",
    pacienteIdade: 31,
    data: "2023-08-17",
    horario: "11:00",
    status: "confirmada",
    online: true,
    telefone: "(11) 94321-8765",
  },
  {
    id: 5,
    pacienteNome: "Lucas Mendes",
    pacienteIdade: 25,
    data: "2023-08-18",
    horario: "15:30",
    status: "pendente",
    online: false,
    telefone: "(11) 98765-1234",
  },
];

export default function ConsultasAgendadasScreen() {
  const [loading, setLoading] = useState(false);
  const [consultas, setConsultas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("todas");

  useEffect(() => {
    // Simula busca de dados da API
    const fetchConsultas = async () => {
      setLoading(true);
      try {
        // Em uma aplicação real, aqui seria feita uma chamada à API
        // const token = await AsyncStorage.getItem('@WeCare:token');
        // const response = await axios.get(`${API_URL}/consultas`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });

        // Simulando delay de rede
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setConsultas(consultasMock);

        // Obtém a data atual para mostrar as consultas do dia
        const today = new Date().toISOString().split("T")[0];
        setSelectedDate(today);
      } catch (error) {
        console.error("Erro ao buscar consultas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultas();
  }, []);

  const filteredConsultas = consultas.filter((consulta) => {
    if (selectedFilter === "todas") return true;
    if (selectedFilter === "hoje") {
      const today = new Date().toISOString().split("T")[0];
      return consulta.data === today;
    }
    if (selectedFilter === "confirmadas")
      return consulta.status === "confirmada";
    if (selectedFilter === "pendentes") return consulta.status === "pendente";
    return true;
  });

  const showConsultaDetails = (consulta) => {
    setSelectedConsulta(consulta);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const statusColors = {
    confirmada: "#4CAF50",
    pendente: "#FFC107",
    cancelada: "#F44336",
  };

  const renderConsultaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.consultaCard}
      onPress={() => showConsultaDetails(item)}
    >
      <View style={styles.consultaHeader}>
        <View style={styles.consultaInfo}>
          <Text style={styles.pacienteNome}>{item.pacienteNome}</Text>
          <Text style={styles.consultaData}>
            {formatDate(item.data)} • {item.horario}
          </Text>
        </View>

        <View style={styles.consultaStatus}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: statusColors[item.status] },
            ]}
          />
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.consultaDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.detailText}>{item.pacienteIdade} anos</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="call" size={16} color="#666" />
          <Text style={styles.detailText}>{item.telefone}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons
            name={item.online ? "videocam" : "medical"}
            size={16}
            color="#666"
          />
          <Text style={styles.detailText}>
            {item.online ? "Teleconsulta" : "Presencial"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.verDetalhes}>
        <Text style={styles.verDetalhesText}>Ver detalhes</Text>
        <Ionicons name="chevron-forward" size={16} color="#2e7d32" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === "todas" ? styles.filterChipSelected : null,
            ]}
            onPress={() => setSelectedFilter("todas")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === "todas"
                  ? styles.filterChipTextSelected
                  : null,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === "hoje" ? styles.filterChipSelected : null,
            ]}
            onPress={() => setSelectedFilter("hoje")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === "hoje"
                  ? styles.filterChipTextSelected
                  : null,
              ]}
            >
              Hoje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === "confirmadas"
                ? styles.filterChipSelected
                : null,
            ]}
            onPress={() => setSelectedFilter("confirmadas")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === "confirmadas"
                  ? styles.filterChipTextSelected
                  : null,
              ]}
            >
              Confirmadas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === "pendentes" ? styles.filterChipSelected : null,
            ]}
            onPress={() => setSelectedFilter("pendentes")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === "pendentes"
                  ? styles.filterChipTextSelected
                  : null,
              ]}
            >
              Pendentes
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>
            {filteredConsultas.length} consultas encontradas
          </Text>

          <FlatList
            data={filteredConsultas}
            renderItem={renderConsultaItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.consultasList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar" size={50} color="#ccc" />
                <Text style={styles.emptyText}>
                  Nenhuma consulta encontrada
                </Text>
              </View>
            }
          />
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedConsulta && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalhes da Consulta</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Paciente</Text>
                <Text style={styles.patientName}>
                  {selectedConsulta.pacienteNome}
                </Text>
                <Text style={styles.patientDetails}>
                  {selectedConsulta.pacienteIdade} anos |{" "}
                  {selectedConsulta.telefone}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Agendamento</Text>
                <View style={styles.appointmentDetail}>
                  <Ionicons name="calendar" size={18} color="#666" />
                  <Text style={styles.appointmentText}>
                    {formatDate(selectedConsulta.data)}
                  </Text>
                </View>
                <View style={styles.appointmentDetail}>
                  <Ionicons name="time" size={18} color="#666" />
                  <Text style={styles.appointmentText}>
                    {selectedConsulta.horario}
                  </Text>
                </View>
                <View style={styles.appointmentDetail}>
                  <Ionicons
                    name={selectedConsulta.online ? "videocam" : "medical"}
                    size={18}
                    color="#666"
                  />
                  <Text style={styles.appointmentText}>
                    {selectedConsulta.online
                      ? "Consulta Online"
                      : "Consulta Presencial"}
                  </Text>
                </View>
                <View style={[styles.appointmentDetail, styles.statusDetail]}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: statusColors[selectedConsulta.status],
                      },
                    ]}
                  />
                  <Text style={[styles.statusText, { fontSize: 16 }]}>
                    {selectedConsulta.status.charAt(0).toUpperCase() +
                      selectedConsulta.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close-circle" size={18} color="#F44336" />
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  filterContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  filterScroll: {
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: "#2e7d32",
  },
  filterChipText: {
    color: "#333",
    fontWeight: "500",
  },
  filterChipTextSelected: {
    color: "white",
  },
  resultCount: {
    padding: 16,
    paddingBottom: 8,
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  consultasList: {
    padding: 16,
  },
  consultaCard: {
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
  consultaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  consultaInfo: {
    flex: 1,
  },
  pacienteNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  consultaData: {
    fontSize: 14,
    color: "#666",
  },
  consultaStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  consultaDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  verDetalhes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  verDetalhesText: {
    color: "#2e7d32",
    fontWeight: "500",
    marginRight: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  appointmentDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusDetail: {
    marginTop: 4,
  },
  appointmentText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: "#2e7d32",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
  },
  secondaryButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  secondaryButtonText: {
    color: "#F44336",
    fontWeight: "bold",
    marginLeft: 6,
  },
});
