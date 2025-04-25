import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { MaskedTextInput } from "react-native-mask-text";

export default function CadastroScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    userType: "",
    area: "",
    dob: "",
    age: "",
    gender: "",
    terms: false,
  });

  const handleInputChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.cpf ||
      !form.phone ||
      !form.userType ||
      !form.dob ||
      !form.age ||
      !form.gender
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
    Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
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

  return (
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
        <TextInput
          placeholder="Senha"
          value={form.password}
          onChangeText={(v) => handleInputChange("password", v)}
          secureTextEntry
          style={styles.passwordInput}
        />

        <Text style={styles.label}>Tipo de Usuário:</Text>
        <View style={styles.radioGroupHorizontal}>
          {userTypes.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.radioButton}
              onPress={() => handleInputChange("userType", item.value)}
            >
              <View
                style={[
                  styles.radioOuter,
                  form.userType === item.value && styles.radioSelectedOuter,
                ]}
              >
                {form.userType === item.value && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.userType === "profissional" && (
          <TextInput
            placeholder="Área de Atuação"
            value={form.area}
            onChangeText={(v) => handleInputChange("area", v)}
            style={styles.areaInput}
          />
        )}

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
              placeholder="Idade"
              value={form.age}
              onChangeText={(v) => handleInputChange("age", v)}
              keyboardType="numeric"
              style={styles.ageInput}
            />
          </View>

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
                {form.gender === item.value && <View style={styles.radioInner} />}
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

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7e9",
    justifyContent: "center",
    alignItems: "center",
  },
  formBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "90%",
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  cpfInput: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  passwordInput: {
    width: "50%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  areaInput: {
    width: "85%",
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
  dobInput: {
    width: "48%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  ageInput: {
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
  radioGroup: {
    flexDirection: "column",
    marginBottom: 10,
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
  radioSelectedOuter: {
    borderColor: "#2e7d32",
  },
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