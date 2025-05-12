import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaskedTextInput } from "react-native-mask-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";

const API_URL = "http://192.168.0.36:3000"; // Ajuste para o seu IP

export default function CadastrarConsultaScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    data: new Date(),
    horaInicio: "08:00",
    horaFim: "17:00",
    intervalo: 30, // minutos
    valor: "",
    endereco: "",
    observacoes: "",
    online: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [horarios, setHorarios] = useState([]);

  const onChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm({ ...form, data: selectedDate });
      gerarHorarios(
        selectedDate,
        form.horaInicio,
        form.horaFim,
        form.intervalo
      );
    }
  };

  const handleInputChange = (key, value) => {
    const newForm = { ...form, [key]: value };
    setForm(newForm);

    if (["horaInicio", "horaFim", "intervalo"].includes(key)) {
      gerarHorarios(
        form.data,
        key === "horaInicio" ? value : form.horaInicio,
        key === "horaFim" ? value : form.horaFim,
        key === "intervalo" ? parseInt(value) : form.intervalo
      );
    }
  };

  const gerarHorarios = (data, horaInicio, horaFim, intervalo) => {
    if (!horaInicio || !horaFim || !intervalo) return;

    const [horaInicioHour, horaInicioMinute] = horaInicio
      .split(":")
      .map(Number);
    const [horaFimHour, horaFimMinute] = horaFim.split(":").map(Number);

    // Converter para minutos desde meia-noite
    let inicioMinutos = horaInicioHour * 60 + horaInicioMinute;
    const fimMinutos = horaFimHour * 60 + horaFimMinute;

    const slots = [];

    while (inicioMinutos < fimMinutos) {
      const hora = Math.floor(inicioMinutos / 60);
      const minuto = inicioMinutos % 60;

      const horaFinal = Math.floor((inicioMinutos + intervalo) / 60);
      const minutoFinal = (inicioMinutos + intervalo) % 60;

      const horaFormatada = `${hora.toString().padStart(2, "0")}:${minuto
        .toString()
        .padStart(2, "0")}`;
      const horaFinalFormatada = `${horaFinal
        .toString()
        .padStart(2, "0")}:${minutoFinal.toString().padStart(2, "0")}`;

      slots.push({
        id: horaFormatada,
        horario: `${horaFormatada} - ${horaFinalFormatada}`,
        disponivel: true,
      });

      inicioMinutos += intervalo;
    }

    setHorarios(slots);
  };

  const handleSubmit = async () => {
    if (!form.data || !form.horaInicio || !form.horaFim || !form.valor) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    if (form.intervalo < 15) {
      Alert.alert("Erro", "O intervalo mínimo deve ser de 15 minutos");
      return;
    }

    if (horarios.length === 0) {
      Alert.alert("Erro", "Não foi possível gerar horários de consulta");
      return;
    }

    try {
      setLoading(true);

      // Aqui você enviaria os dados para a API
      // Em uma implementação real:

      // const token = await AsyncStorage.getItem('@WeCare:token');
      // const response = await axios.post(`${API_URL}/consultas/disponibilidade`, {
      //   data: form.data.toISOString().split('T')[0],
      //   horarios: horarios,
      //   valor: parseFloat(form.valor),
      //   endereco: form.endereco,
      //   observacoes: form.observacoes,
      //   online: form.online
      // }, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      // Simulando sucesso
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          "Sucesso",
          "Horários de consulta cadastrados com sucesso!",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }, 1500);
    } catch (error) {
      console.error("Erro ao cadastrar consultas:", error);
      setLoading(false);
      Alert.alert("Erro", "Não foi possível cadastrar os horários de consulta");
    }
  };

  const formatarData = (data) => {
    if (!data) return "";
    return data.toLocaleDateString("pt-BR");
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Cadastrar Horários de Consulta</Text>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.label}>Data das consultas:</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={20} color="#2e7d32" />
              <Text style={styles.dateText}>{formatarData(form.data)}</Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={form.data || new Date()}
              mode="date"
              display="default"
              onChange={onChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Hora início:</Text>
              <MaskedTextInput
                mask="99:99"
                placeholder="08:00"
                keyboardType="numeric"
                value={form.horaInicio}
                onChangeText={(t) => handleInputChange("horaInicio", t)}
                style={styles.input}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Hora fim:</Text>
              <MaskedTextInput
                mask="99:99"
                placeholder="17:00"
                keyboardType="numeric"
                value={form.horaFim}
                onChangeText={(t) => handleInputChange("horaFim", t)}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Intervalo (minutos):</Text>
              <TextInput
                placeholder="30"
                keyboardType="numeric"
                value={form.intervalo.toString()}
                onChangeText={(t) =>
                  handleInputChange("intervalo", parseInt(t) || 30)
                }
                style={styles.input}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Valor (R$):</Text>
              <TextInput
                placeholder="150,00"
                keyboardType="decimal-pad"
                value={form.valor}
                onChangeText={(t) => handleInputChange("valor", t)}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informações Adicionais</Text>

          <Text style={styles.label}>Endereço:</Text>
          <TextInput
            placeholder="Endereço de atendimento"
            value={form.endereco}
            onChangeText={(t) => handleInputChange("endereco", t)}
            style={styles.input}
          />

          <Text style={styles.label}>Observações:</Text>
          <TextInput
            placeholder="Instruções adicionais para o paciente"
            value={form.observacoes}
            onChangeText={(t) => handleInputChange("observacoes", t)}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Consulta online:</Text>
            <Switch
              value={form.online}
              onValueChange={(v) => handleInputChange("online", v)}
              trackColor={{ false: "#c5c5c5", true: "#a5d6a7" }}
              thumbColor={form.online ? "#2e7d32" : "#f4f3f4"}
            />
          </View>
        </View>

        {horarios.length > 0 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
            <Text style={styles.subtitle}>{formatarData(form.data)}</Text>

            <View style={styles.horariosContainer}>
              {horarios.map((horario) => (
                <View key={horario.id} style={styles.horarioBox}>
                  <Text style={styles.horarioText}>{horario.horario}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.info}>
              Total: {horarios.length} horários disponíveis
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loading}
          />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Cadastrar Horários</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 20,
    textAlign: "center",
  },
  formSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  dateButton: {
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfField: {
    width: "48%",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  horariosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  horarioBox: {
    backgroundColor: "#e0f7e9",
    padding: 10,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: "#c5e1c5",
  },
  horarioText: {
    color: "#2e7d32",
    fontWeight: "500",
  },
  info: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loading: {
    marginVertical: 20,
  },
});
