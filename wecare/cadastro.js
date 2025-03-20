import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

export default function App() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    userType: '',
    area: '',
    dob: '',
    age: '',
    gender: '',
    terms: false,
  });

  const handleInputChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.password || !form.cpf || !form.userType || !form.dob || !form.age || !form.gender) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (!validateEmail(form.email)) {
      Alert.alert('Erro', 'E-mail inválido.');
      return;
    }

    if (!form.terms) {
      Alert.alert('Erro', 'Você deve aceitar os termos de uso.');
      return;
    }

    Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.title}>Cadastro</Text>

        <TextInput
          placeholder="Nome Completo"
          value={form.name}
          onChangeText={(value) => handleInputChange('name', value)}
          style={styles.input}
        />

        <TextInput
          placeholder="E-mail"
          value={form.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          placeholder="Senha"
          value={form.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          placeholder="CPF"
          value={form.cpf}
          onChangeText={(value) => handleInputChange('cpf', value)}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Tipo de Usuário:</Text>
        <RNPickerSelect
          onValueChange={(value) => handleInputChange('userType', value)}
          items={[
            { label: "Paciente", value: "paciente" },
            { label: "Profissional da Saúde", value: "profissional" }
          ]}
          style={pickerSelectStyles}
        />

        {form.userType === 'profissional' && (
          <TextInput
            placeholder="Área de Atuação"
            value={form.area}
            onChangeText={(value) => handleInputChange('area', value)}
            style={styles.input}
          />
        )}

        <TextInput
          placeholder="Data de Nascimento"
          value={form.dob}
          onChangeText={(value) => handleInputChange('dob', value)}
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          placeholder="Idade"
          value={form.age}
          onChangeText={(value) => handleInputChange('age', value)}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Gênero:</Text>
        <RNPickerSelect
          onValueChange={(value) => handleInputChange('gender', value)}
          items={[
            { label: "Masculino", value: "masculino" },
            { label: "Feminino", value: "feminino" },
            { label: "Outro", value: "outro" }
          ]}
          style={pickerSelectStyles}
        />

        <View style={styles.switchContainer}>
          <Text>Aceito os termos de uso</Text>
          <Switch
            value={form.terms}
            onValueChange={(value) => handleInputChange('terms', value)}
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
    backgroundColor: '#e0f7e9', // Verde claro
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '40%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    color: '#2e7d32', // Verde escuro
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    color: '#2e7d32', // Verde escuro
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  button: {
    backgroundColor: '#2e7d32', // Verde escuro
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    color: '#2e7d32', // Verde escuro
  },
  inputAndroid: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    color: '#2e7d32', // Verde escuro
  }
};