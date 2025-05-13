import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

<<<<<<< HEAD
const API_URL = "http://192.168.0.36:3000";
=======
const API_URL = "http://192.168.0.36:3000";
>>>>>>> 58aa0e640ba9b001ac23d0fe906f80602caa81e2

export default function AgendarConsulta({ navigation }) {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agendado');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('@WeCare:user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserId(userData.id);
          fetchConsultas(userData.id);
        } else {
          setLoading(false);
          Alert.alert('Erro', 'Usuário não encontrado. Tente fazer login novamente.');
        }
      } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const fetchConsultas = async (id) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('@WeCare:token');
      
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      const response = await axios.get(`${API_URL}/consultas/paciente/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConsultas(response.data);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas consultas.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataStr) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const handleCancelConsulta = (id) => {
    Alert.alert(
      'Cancelar Consulta',
      'Tem certeza que deseja cancelar esta consulta?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim', 
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('@WeCare:token');
              
              await axios.put(`${API_URL}/consultas/${id}/cancelar`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              fetchConsultas(userId);
              Alert.alert('Sucesso', 'Consulta cancelada com sucesso!');
            } catch (error) {
              console.error('Erro ao cancelar consulta:', error);
              setLoading(false);
              Alert.alert('Erro', 'Não foi possível cancelar a consulta.');
            }
          }
        }
      ]
    );
  };

  const filteredConsultas = consultas.filter(c => c.status === activeTab);

  const renderConsulta = ({ item }) => (
    <View style={styles.consultaCard}>
      <View style={styles.consultaHeader}>
        <Text style={styles.consultaData}>
          {formatarData(item.data)} - {item.horario}
        </Text>
        {item.status === 'agendado' && (
          <TouchableOpacity 
            onPress={() => handleCancelConsulta(item.id)}
            style={styles.cancelButton}
          >
            <Ionicons name="close-circle" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.consultaInfo}>
        <View style={styles.medicoInfo}>
          <Text style={styles.medicoNome}>{item.profissional_nome}</Text>
          <Text style={styles.medicoEspecialidade}>{item.especialidade}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            item.status === 'agendado' ? styles.statusAgendado : styles.statusConcluido
          ]} />
          <Text style={styles.statusText}>
            {item.status === 'agendado' ? 'Agendado' : 'Concluído'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Consultas</Text>
        <TouchableOpacity 
          style={styles.agendarButton}
          onPress={() => navigation.navigate('BuscarMedicos')} 
        >
          <Text style={styles.agendarButtonText}>Nova Consulta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'agendado' && styles.activeTab]}
          onPress={() => setActiveTab('agendado')}
        >
          <Text style={[styles.tabText, activeTab === 'agendado' && styles.activeTabText]}>
            Agendadas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'concluído' && styles.activeTab]}
          onPress={() => setActiveTab('concluído')}
        >
          <Text style={[styles.tabText, activeTab === 'concluído' && styles.activeTabText]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : filteredConsultas.length > 0 ? (
        <FlatList
          data={filteredConsultas}
          renderItem={renderConsulta}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.consultasList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={70} color="#cccccc" />
          <Text style={styles.emptyText}>
            {activeTab === 'agendado' 
              ? 'Você não tem consultas agendadas' 
              : 'Seu histórico de consultas está vazio'}
          </Text>
          {activeTab === 'agendado' && (
            <TouchableOpacity 
              style={styles.emptyAgendarButton}
              onPress={() => navigation.navigate('BuscarMedicos')}
            >
              <Text style={styles.emptyAgendarButtonText}>Agendar Consulta</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  agendarButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  agendarButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2e7d32',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  consultasList: {
    padding: 16,
  },
  consultaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  consultaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  consultaData: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    padding: 4,
  },
  consultaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicoInfo: {
    flex: 1,
  },
  medicoNome: {
    fontSize: 15,
    color: '#444',
  },
  medicoEspecialidade: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusAgendado: {
    backgroundColor: '#2e7d32',
  },
  statusConcluido: {
    backgroundColor: '#2196f3',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  emptyAgendarButton: {
    marginTop: 20,
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyAgendarButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});