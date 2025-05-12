import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Substitua pelo seu IP
const API_URL = "http://192.168.0.36:3000";

export default function AgendarHorarioScreen({ route, navigation }) {
  const { medicoId } = route.params;
  const [loading, setLoading] = useState(true);
  const [detalhes, setDetalhes] = useState(null);
  const [horarios, setHorarios] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHorario, setSelectedHorario] = useState(null);
  const [agendando, setAgendando] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
  try {
    // Carregar dados do usuário
    const userDataString = await AsyncStorage.getItem('@WeCare:user');
    if (userDataString) {
      setUserData(JSON.parse(userDataString));
    }

    try {
      // Carregar detalhes do médico
      console.log(`Buscando dados do profissional ID: ${medicoId}`);
      const response = await axios.get(`${API_URL}/profissionais/${medicoId}`);
      console.log("Dados do profissional recebidos com sucesso");
      setDetalhes(response.data);
    } catch (profErr) {
      console.error("Erro ao carregar dados do profissional:", profErr);
      Alert.alert('Aviso', 'Não foi possível carregar todos os detalhes do profissional.');
      // Continue mesmo com erro - podemos mostrar horários mesmo sem os detalhes completos
    }

    try {
      // Carregar horários disponíveis
      console.log(`Buscando horários do profissional ID: ${medicoId}`);
      const horariosResponse = await axios.get(
        `${API_URL}/horarios-disponiveis/profissional/${medicoId}`
      );
      console.log("Horários recebidos com sucesso");
      
      setHorarios(horariosResponse.data || {});

      // Selecionar primeira data disponível, se houver
      const datasDisponiveis = Object.keys(horariosResponse.data || {});
      if (datasDisponiveis.length > 0) {
        setSelectedDate(datasDisponiveis[0]);
      }
    } catch (horariosErr) {
      console.error('Erro ao carregar horários:', horariosErr);
      setHorarios({});
      Alert.alert('Erro', 'Não foi possível carregar os horários disponíveis.');
    }
  } catch (error) {
    console.error('Erro geral ao carregar dados:', error);
    Alert.alert('Erro', 'Ocorreu um problema ao carregar os dados.');
  } finally {
    setLoading(false);
  }
};

    carregarDados();
  }, [medicoId]);

  const formatarData = (dataStr) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const handleSelectHorario = (horario) => {
    setSelectedHorario(horario);
  };

  const handleConfirmarAgendamento = async () => {
  if (!selectedDate || !selectedHorario || !userData) {
    Alert.alert('Erro', 'Selecione um horário para continuar.');
    return;
  }

  try {
    setAgendando(true);
    const token = await AsyncStorage.getItem('@WeCare:token');

    if (!token) {
      Alert.alert('Erro', 'Sessão expirada. Por favor, faça login novamente.');
      return;
    }

    // Certifique-se de que o valor é tratado como número
    const valorNumerico = parseFloat(selectedHorario.valor || 0);
    
    console.log("Enviando agendamento:", {
      paciente_id: userData.id,
      profissional_id: medicoId,
      data: selectedDate,
      horario: selectedHorario.horario_inicio,
      horario_id: selectedHorario.id,
      valor: valorNumerico,
      online: selectedHorario.online === 1
    });

    // Enviar solicitação de agendamento
    const response = await axios.post(
      `${API_URL}/consultas`,
      {
        paciente_id: userData.id,
        profissional_id: medicoId,
        data: selectedDate,
        horario: selectedHorario.horario_inicio,
        horario_id: selectedHorario.id,
        valor: valorNumerico,
        online: selectedHorario.online === 1
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log("Resposta do servidor:", response.data);

    Alert.alert(
      'Sucesso',
      'Consulta agendada com sucesso!',
      [{ 
        text: 'OK', 
        onPress: () => {
          // Remover o horário selecionado da lista
          const novaListaHorarios = {...horarios};
          novaListaHorarios[selectedDate] = horarios[selectedDate].filter(
            h => h.id !== selectedHorario.id
          );
          setHorarios(novaListaHorarios);
          setSelectedHorario(null);
          
          // Navegar para a tela HomePaciente (tela principal)
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomePaciente' }],
          });
        } 
      }]
    );
  } catch (error) {
    console.error('Erro ao agendar consulta:', error);
    
    let mensagemErro = 'Não foi possível agendar a consulta.';
    if (error.response && error.response.data && error.response.data.error) {
      mensagemErro = error.response.data.error;
    }
    
    Alert.alert('Erro', mensagemErro);
  } finally {
    setAgendando(false);
  }
};

  // Agrupamento de datas por mês para o calendário
  const agruparDatasPorMes = () => {
    const meses = {};
    Object.keys(horarios).forEach(data => {
      const [ano, mes] = data.split('-');
      const chave = `${mes}/${ano}`;
      if (!meses[chave]) {
        meses[chave] = [];
      }
      meses[chave].push(data);
    });
    return meses;
  };

  const mesesAgrupados = agruparDatasPorMes();

  // Renderizar a tela de carregamento
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  // Renderizar mensagem quando não há horários disponíveis
  if (Object.keys(horarios).length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {detalhes?.nome || 'Profissional'}
          </Text>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={70} color="#cccccc" />
          <Text style={styles.emptyText}>
            Este profissional não possui horários disponíveis no momento.
          </Text>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonSecondaryText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{detalhes?.nome}</Text>
      </View>

      <ScrollView>
        <View style={styles.profissionalInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {detalhes?.nome?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.profissionalNome}>{detalhes?.nome}</Text>
          <Text style={styles.profissionalEspecialidade}>
            {detalhes?.area_atuacao}
          </Text>
          <Text style={styles.profissionalCRM}>CRM: {detalhes?.crm}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Selecione uma data</Text>
          
          {Object.keys(mesesAgrupados).map((mesAno) => (
            <View key={mesAno} style={styles.mesContainer}>
              <Text style={styles.mesTitle}>{mesAno}</Text>
              <View style={styles.diasContainer}>
                {mesesAgrupados[mesAno].map((data) => (
                  <TouchableOpacity
                    key={data}
                    style={[
                      styles.diaButton,
                      selectedDate === data && styles.diaButtonSelected
                    ]}
                    onPress={() => setSelectedDate(data)}
                  >
                    <Text
                      style={[
                        styles.diaButtonText,
                        selectedDate === data && styles.diaButtonTextSelected
                      ]}
                    >
                      {data.split('-')[2]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {selectedDate && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              Horários disponíveis para {formatarData(selectedDate)}
            </Text>
            
            <View style={styles.horariosContainer}>
              {horarios[selectedDate]?.map((horario) => (
                <TouchableOpacity
                  key={horario.id}
                  style={[
                    styles.horarioButton,
                    selectedHorario?.id === horario.id && styles.horarioButtonSelected
                  ]}
                  onPress={() => handleSelectHorario(horario)}
                >
                  <Text
                    style={[
                      styles.horarioButtonText,
                      selectedHorario?.id === horario.id && styles.horarioButtonTextSelected
                    ]}
                  >
                    {horario.horario_inicio}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedHorario && (
          <View style={styles.resumoContainer}>
            <Text style={styles.resumoTitle}>Resumo do Agendamento</Text>
            
            <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Valor:</Text>
                <Text style={styles.resumoValor}>
                    R$ {parseFloat(selectedHorario.valor || 0).toFixed(2).replace('.', ',')}
                </Text>
            </View>
            
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Especialidade:</Text>
              <Text style={styles.resumoValue}>{detalhes?.area_atuacao}</Text>
            </View>
            
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Data:</Text>
              <Text style={styles.resumoValue}>{formatarData(selectedDate)}</Text>
            </View>
            
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Horário:</Text>
              <Text style={styles.resumoValue}>{selectedHorario.horario_inicio}</Text>
            </View>
            
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Tipo:</Text>
              <Text style={styles.resumoValue}>
                {selectedHorario.online ? 'Consulta Online' : 'Consulta Presencial'}
              </Text>
            </View>
            
            {selectedHorario.endereco && !selectedHorario.online && (
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Endereço:</Text>
                <Text style={styles.resumoValue}>{selectedHorario.endereco}</Text>
              </View>
            )}
            
            
            
            {selectedHorario.observacoes && (
              <View style={styles.resumoItem}>
                <Text style={styles.resumoLabel}>Observações:</Text>
                <Text style={styles.resumoValue}>{selectedHorario.observacoes}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonSecondaryText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.buttonPrimary, !selectedHorario && styles.buttonDisabled]}
          onPress={handleConfirmarAgendamento}
          disabled={!selectedHorario || agendando}
        >
          {agendando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonPrimaryText}>Confirmar Agendamento</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profissionalInfo: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f7e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  profissionalNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profissionalEspecialidade: {
    fontSize: 16,
    color: '#2e7d32',
    marginBottom: 4,
  },
  profissionalCRM: {
    fontSize: 14,
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mesContainer: {
    marginBottom: 16,
  },
  mesTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  diaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  diaButtonSelected: {
    backgroundColor: '#2e7d32',
  },
  diaButtonText: {
    fontSize: 14,
    color: '#333',
  },
  diaButtonTextSelected: {
    color: 'white',
  },
  horariosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  horarioButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 4,
  },
  horarioButtonSelected: {
    backgroundColor: '#2e7d32',
  },
  horarioButtonText: {
    fontSize: 14,
    color: '#333',
  },
  horarioButtonTextSelected: {
    color: 'white',
  },
  resumoContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resumoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  resumoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  resumoValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonSecondary: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 8,
    marginRight: 8,
  },
  buttonSecondaryText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  buttonPrimary: {
    flex: 2,
    backgroundColor: '#2e7d32',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonPrimaryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#a5a5a5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  }
});