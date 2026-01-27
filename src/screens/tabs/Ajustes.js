import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

import { useTheme } from '../../context/ContextoTematica';
import { MobileContainer } from '../../components/layout/MobileContainer';

import { SwitchModoOscuro } from '../../components/switches/SwitchModoOscuro';
import { SwitchNotificaciones } from '../../components/switches/SwitchNotificaciones';

export function Ajustes() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('@nick');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const Contenido = (
    <>
      <View style={styles.cabecera}>
        <Ionicons
          name="chevron-back-outline"
          size={30}
          color={theme.text}
          style={styles.icono}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.titulo, { color: theme.text }]}>
          Configuración
        </Text>
      </View>

      <View
        style={[
          styles.configuraciones,
          { backgroundColor: theme.sectionBg },
        ]}
      >
        <SwitchModoOscuro label="Modo oscuro" />
        <SwitchNotificaciones label="Notificaciones" />
      </View>

      <TouchableOpacity style={styles.accionBtn}>
        <Text style={styles.accionText}>Ayuda</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.accionBtn}>
        <Text style={styles.accionText}>Privacidad</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.accionBtn}>
        <Text style={styles.accionText}>Términos y condiciones</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <>
      <StatusBar
        backgroundColor={theme.headerBg}
        barStyle={theme.text === '#000000' ? 'dark-content' : 'light-content'}
      />

      <SafeAreaView
        style={[styles.contenedor, { backgroundColor: theme.headerBg }]}
      >
        <LinearGradient
          colors={['#0B66E8', '#0B59D5', '#0A48BC']}
          style={styles.gradientFondo}
          pointerEvents="none"
        />

        {Platform.OS === 'web' ? (
          <MobileContainer>{Contenido}</MobileContainer>
        ) : (
          Contenido
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },

  gradientFondo: {
    ...StyleSheet.absoluteFillObject,
  },

  cabecera: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingBottom: 8,
    marginTop: 16,
  },

  icono: {
    position: 'absolute',
    left: Platform.OS === 'web' ? 0 : 16,
  },

  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  configuraciones: {
    marginTop: 30,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 12,
    alignItems: 'center',
  },

  accionBtn: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: Platform.OS === 'web' ? 0 : 24,
  },

  accionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  logoutBtn: {
    marginTop: 30,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: Platform.OS === 'web' ? 0 : 24,
    marginBottom: 24,
  },

  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
