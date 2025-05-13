import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.92.16:3000";

export default function ConsultasAgendadasScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [consultas, setConsultas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("todas");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    fetchConsultas();
  }, []);

  const fetchConsultas = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@WeCare:token');
      const userData = JSON.parse(await AsyncStorage.getItem('@WeCare:user'));
      
      if (!token || !userData) {
        Alert.alert("Erro", "Você precisa estar logado para acessar esta função");
        navigation.navigate('Login');
        return;
      }
      
      const profissionalId = userData.id;
      const response = await axios.get(
        `${API_URL}/consultas/profissional/${profissionalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const consultasFormatadas = response.data.map(consulta => ({
        id: consulta.id,
        pacienteNome: consulta.paciente_nome,
        pacienteIdade: consulta.paciente_idade,
        data: consulta.data,
        horario: consulta.horario,
        status: consulta.status,
        online: consulta.online === 1,
        telefone: consulta.paciente_telefone,
        observacoes: consulta.observacoes,
        valor: consulta.valor
      }));
      
      setConsultas(consultasFormatadas);
      
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
      Alert.alert("Erro", "Não foi possível carregar suas consultas. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusConsulta = async (consultaId, novoStatus) => {
    setProcessando(true);
    try {
      const token = await AsyncStorage.getItem('@WeCare:token');
      
      await axios.put(
        `${API_URL}/consultas/${consultaId}/status`, 
        { status: novoStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConsultas(prevConsultas => {
        return prevConsultas.map(consulta => {
          if (consulta.id === consultaId) {
            return { ...consulta, status: novoStatus };
          }
          return consulta;
        });
      });
      
      if (selectedConsulta?.id === consultaId) {
        setSelectedConsulta({
          ...selectedConsulta,
          status: novoStatus
        });
      }
      
      Alert.alert("Sucesso", `Consulta ${novoStatus} com sucesso!`);
      setModalVisible(false);
    } catch (error) {
      console.error("Erro ao atualizar status da consulta:", error);
      Alert.alert("Erro", "Não foi possível atualizar o status da consulta. Tente novamente mais tarde.");
    } finally {
      setProcessando(false);
    }
  };

  const filteredConsultas = consultas.filter((consulta) => {
    if (selectedFilter === "todas") return true;
    if (selectedFilter === "hoje") {
      const today = new Date().toISOString().split("T")[0];
      return consulta.data === today;
    }
    if (selectedFilter === "confirmadas") return consulta.status === "confirmado";
    if (selectedFilter === "pendentes") return consulta.status === "agendado";
    if (selectedFilter === "concluidas") return consulta.status === "concluído";
    return true;
  });

  const showConsultaDetails = (consulta) => {
    setSelectedConsulta(consulta);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const statusColors = {
    confirmado: "#4CAF50",
    agendado: "#FFC107",
    cancelado: "#F44336",
    "concluído": "#2196F3"
  };

  const statusTextos = {
    confirmado: "Confirmada",
    agendado: "Pendente",
    cancelado: "Cancelada",
    "concluído": "Concluída"
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
              { backgroundColor: statusColors[item.status] || "#999" },
            ]}
          />
          <Text style={styles.statusText}>
            {statusTextos[item.status] || item.status}
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
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === "concluidas" ? styles.filterChipSelected : null,
            ]}
            onPress={() => setSelectedFilter("concluidas")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === "concluidas"
                  ? styles.filterChipTextSelected
                  : null,
              ]}
            >
              Concluídas
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
          <View style={styles.actionBar}>
            <Text style={styles.resultCount}>
              {filteredConsultas.length} consultas encontradas
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchConsultas}>
              <Ionicons name="refresh" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>

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
                {selectedConsulta.valor && (
                  <View style={styles.appointmentDetail}>
                    <Ionicons name="cash" size={18} color="#666" />
                    <Text style={styles.appointmentText}>
                      R$ {parseFloat(selectedConsulta.valor).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                )}
                <View style={[styles.appointmentDetail, styles.statusDetail]}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: statusColors[selectedConsulta.status] || "#999",
                      },
                    ]}
                  />
                  <Text style={[styles.statusText, { fontSize: 16 }]}>
                    {statusTextos[selectedConsulta.status] || selectedConsulta.status}
                  </Text>
                </View>
              </View>

              {selectedConsulta.observacoes && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Observações</Text>
                  <Text style={styles.observacoesText}>
                    {selectedConsulta.observacoes}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedConsulta.status === "agendado" && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.primaryButton]}
                    onPress={() => atualizarStatusConsulta(selectedConsulta.id, "confirmado")}
                    disabled={processando}
                  >
                    {processando ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>Confirmar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {selectedConsulta.status === "confirmado" && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.primaryButton, {backgroundColor: "#2196F3"}]}
                    onPress={() => atualizarStatusConsulta(selectedConsulta.id, "concluído")}
                    disabled={processando}
                  >
                    {processando ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>Concluir</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {(selectedConsulta.status === "agendado" || selectedConsulta.status === "confirmado") && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.secondaryButton]}
                    onPress={() => atualizarStatusConsulta(selectedConsulta.id, "cancelado")}
                    disabled={processando}
                  >
                    {processando ? (
                      <ActivityIndicator size="small" color="#F44336" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={18} color="#F44336" />
                        <Text style={styles.secondaryButtonText}>Cancelar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {(selectedConsulta.status === "cancelado" || selectedConsulta.status === "concluído") && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.fullWidthButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.fullWidthButtonText}>Fechar</Text>
                  </TouchableOpacity>
                )}
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
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
  consultasList: {
    padding: 16,
    paddingTop: 0,
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
  observacoesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
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
  fullWidthButton: {
    backgroundColor: "#f5f5f5",
    flex: 1,
  },
  fullWidthButtonText: {
    color: "#333",
    fontWeight: "bold",
  }
});