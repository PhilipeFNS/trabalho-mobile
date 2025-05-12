import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";

const API_URL = "http://192.168.0.36:3000";

export default function CadastroScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    userType: "",
    area: "",
    crm: "", 
    dob: "",
    gender: "",
    terms: false,
  });

  const handleInputChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.cpf ||
      !form.phone ||
      !form.userType ||
      !form.dob ||
      !form.gender ||
      (form.userType === "profissional" && (!form.area || !form.crm))
    ) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
      return;
    }
    if (!validateEmail(form.email)) {
      Alert.alert("Erro", "E-mail inválido.");
      return;
    }
    if (!form.terms) {
      Alert.alert("Erro", "Você deve aceitar os termos de uso.");
      return;
    }

    try {
      setLoading(true);
      const userData = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        cpf: form.cpf.replace(/[^\d]/g, ""),
        userType: form.userType,
        area: form.userType === "profissional" ? form.area : null,
        crm: form.userType === "profissional" ? form.crm : null, 
        dob: form.dob,
        gender: form.gender,
      };
      await axios.post(`${API_URL}/usuarios`, userData);
      Alert.alert("Sucesso", "Cadastro realizado com sucesso!", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      let message = "Erro ao fazer cadastro";
      console.log("Erro:", error.response?.data || error.message);
      if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const userTypes = [
    { label: "Paciente", value: "paciente" },
    { label: "Profissional da Saúde", value: "profissional" },
  ];
  const genders = [
    { label: "Masculino", value: "masculino" },
    { label: "Feminino", value: "feminino" },
    { label: "Outro", value: "outro" },
  ];
  const especialidades = [
    "Clínico Geral",
    "Pediatra",
    "Ginecologista",
    "Cardiologista",
    "Dermatologista",
    "Neurologista",
    "Psiquiatra",
    "Oftalmologista",
    "Otorrinolaringologista",
    "Endocrinologista",
    "Gastroenterologista",
    "Nefrologista",
    "Reumatologista",
    "Infectologista",
    "Médico de Família",
    "Urologista",
    "Alergologista",
    "Pneumologista",
    "Nutrólogo",
    "Homeopata",
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.formBox}>
          <Text style={styles.title}>Cadastro</Text>
          <TextInput
            placeholder="Nome Completo"
            value={form.name}
            onChangeText={(v) => handleInputChange("name", v)}
            style={styles.nameInput}
          />
          <TextInput
            placeholder="E-mail"
            value={form.email}
            onChangeText={(v) => handleInputChange("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.emailInput}
          />
          <View style={styles.row}>
            <MaskedTextInput
              mask="(99) 99999-9999"
              placeholder="Telefone"
              value={form.phone}
              onChangeText={(t) => handleInputChange("phone", t)}
              keyboardType="numeric"
              style={styles.phoneInput}
            />
            <MaskedTextInput
              mask="999.999.999-99"
              placeholder="CPF"
              value={form.cpf}
              onChangeText={(t) => handleInputChange("cpf", t)}
              keyboardType="numeric"
              style={styles.cpfInput}
            />
          </View>
          <View style={styles.row}>
            <MaskedTextInput
              mask="99/99/9999"
              placeholder="Data de Nascimento"
              value={form.dob}
              onChangeText={(t) => handleInputChange("dob", t)}
              keyboardType="numeric"
              style={styles.dobInput}
            />
            <TextInput
              placeholder="Senha"
              value={form.password}
              onChangeText={(v) => handleInputChange("password", v)}
              secureTextEntry
              style={styles.passwordInput}
            />
          </View>
          <View style={{ height: 20 }} />{" "}
          <Text style={styles.label}>Tipo de Usuário:</Text>
          <View style={styles.radioGroupHorizontal}>
            <TouchableOpacity
              style={[
                styles.radioButtonSpecial,
                form.userType === "paciente" && styles.radioButtonSelected,
              ]}
              onPress={() => {
                console.log("Paciente selecionado");
                setForm((prev) => ({
                  ...prev,
                  userType: "paciente",
                  area: "",
                  crm: "",
                }));
              }}
            >
              <Text style={styles.radioLabel}>Paciente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButtonSpecial,
                form.userType === "profissional" && styles.radioButtonSelected,
              ]}
              onPress={() => {
                console.log("Profissional selecionado");
                setForm((prev) => ({
                  ...prev,
                  userType: "profissional",
                }));
              }}
            >
              <Text style={styles.radioLabel}>Profissional da Saúde</Text>
            </TouchableOpacity>
          </View>
          {form.userType === "profissional" && (
            <>
              <Text style={styles.label}>Área de Atuação:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.area}
                  onValueChange={(value) => handleInputChange("area", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione..." value="" />
                  {especialidades.map((esp) => (
                    <Picker.Item key={esp} label={esp} value={esp} />
                  ))}
                </Picker>
              </View>

              <TextInput
                placeholder="CRM"
                value={form.crm}
                onChangeText={(v) => handleInputChange("crm", v)}
                style={styles.crmInput}
              />
            </>
          )}
          <Text style={styles.label}>Gênero:</Text>
          <View style={styles.radioGroupHorizontal}>
            {genders.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.radioButton}
                onPress={() => handleInputChange("gender", item.value)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    form.gender === item.value && styles.radioSelectedOuter,
                  ]}
                >
                  {form.gender === item.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.switchContainer}>
            <Text>Aceito os termos de uso</Text>
            <Switch
              value={form.terms}
              onValueChange={(v) => handleInputChange("terms", v)}
            />
          </View>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#2e7d32"
              style={{ marginTop: 10 }}
            />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ marginTop: 15, alignItems: "center" }}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={{ color: "#2e7d32" }}>
              Já tem uma conta? Faça login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: "#e0f7e9",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  formBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    maxWidth: 400,
    marginVertical: 10,
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
    textAlign: "center",
  },
  nameInput: {
    width: "100%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  emailInput: {
    width: "100%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  phoneInput: {
    width: "48%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  cpfInput: {
    width: "48%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  passwordInput: {
    width: "48%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
    color: "#2e7d32",
  },
  crmInput: {
    width: "100%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  dobInput: {
    width: "48%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    color: "#2e7d32",
    marginBottom: 8,
  },
  radioGroupHorizontal: {
    flexDirection: "row",
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 15,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  radioSelectedOuter: { borderColor: "#2e7d32" },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2e7d32",
  },
  radioLabel: {
    fontSize: 16,
    color: "#2e7d32",
  },
  radioButtonSpecial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#2e7d32",
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 15,
    minWidth: 120,
  },
  radioButtonSelected: {
    backgroundColor: "#e0f7e9",
    borderWidth: 2,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
