import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registrarSoloNick, isValidNick } from '../services/registrarSoloNick';

import { MobileContainer } from '../components/layout/MobileContainer';

const logo = require('../assets/imagenes/logo_circular_5.png');

export function RegisterScreen() {
  const [nick, setNick] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    try {
      setErrorMessage('');
      const n = (nick || '').trim();

      if (!isValidNick(n)) {
        Alert.alert(
          'Nick inválido',
          'Usa 3–20 caracteres: letras, números, ., _ o -'
        );
        return;
      }

      const { nick: savedNick } = await registrarSoloNick(n);
      await AsyncStorage.setItem('@nick', savedNick);
    } catch (e) {
      if (e.message === 'nick_en_uso') {
        Alert.alert('Nick en uso', 'Elige otro nick, por favor.');
      } else {
        Alert.alert(
          'No se pudo registrar',
          e?.message ?? 'Inténtalo de nuevo'
        );
      }
      setErrorMessage(e?.message ?? 'Error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedorRegistro}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MobileContainer>
        <Image
          source={logo}
          style={styles.logo}
          contentFit="contain"
          priority="low"
          cachePolicy="disk"
          placeholder="LKO2?U%2Tw=w]~RBVZRi"
          transition={200}
        />

        <Text style={styles.title}>Desafío Aritmético</Text>
        <Text style={styles.slogan}>¡Entrena tu agilidad mental!</Text>

        {!!errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <View style={styles.formulario}>
          <TextInput
            placeholder="Pon tu nick"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            value={nick}
            onChangeText={(t) => {
              setNick(t);
              setErrorMessage('');
            }}
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </MobileContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedorRegistro: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },

  mobileContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  logo: {
    width: 170,
    height: 170,
    marginBottom: 12,
    marginTop: 45,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },

  slogan: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
  },

  formulario: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 25,
  },

  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
    color: '#374151',
  },

  button: {
    height: 48,
    backgroundColor: '#FF8C42',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  errorText: {
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
});
