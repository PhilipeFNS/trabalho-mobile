import React, { useState } from 'react';
import {View,Text,TextInput,Button,Switch,StyleSheet,Alert} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const App = () => {
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

            <Button title="Cadastrar" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#e9f5f2',
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
        color: '#007b5f',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        marginBottom: 15,
        paddingLeft: 10,
    },
    label: {
        marginTop: 10,
        marginBottom: 5,
        fontSize: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
});

const pickerSelectStyles = {
    inputIOS: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingLeft: 10,
        marginBottom: 15,
    },
    inputAndroid: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingLeft: 10,
        marginBottom: 15,
    }
};

export default App;