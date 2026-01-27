import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
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

import { SwitchModoOscuro } from '../../components/switches/SwitchModoOscuro';
import { SwitchNotificaciones } from '../../components/switches/SwitchNotificaciones';

import { layout } from '../../estilos/baseStyles';

export function Ajustes() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [notificacionesActivas, setNotificacionesActivas] = useState(false);

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('@nick');
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={[layout.contenedor, layout.paddingWeb]}>
        <LinearGradient
          colors={['#0B66E8', '#0B59D5', '#0A48BC']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={layout.pantalla}>
          {/* HEADER */}
          <View style={styles.header}>
            <Ionicons
              name="chevron-back-outline"
              size={28}
              color="#FFF"
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.title}>Configuración</Text>
          </View>

          {/* SWITCHES */}
          <View style={styles.seccion}>
            <SwitchModoOscuro label="Modo oscuro" />

            <SwitchNotificaciones
              label="Notificaciones"
              value={notificacionesActivas}
              onToggle={setNotificacionesActivas}
            />
          </View>

          {/* OPCIONES */}
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Ayuda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Privacidad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.logout]}
            onPress={logout}
          >
            <Text style={styles.btnText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    color: '#FFF',
    fontSize: 18,
    marginLeft: 12,
  },

  seccion: {
    width: '100%',
    marginBottom: 24,
  },

  btn: {
    width: '100%',
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },

  logout: {
    backgroundColor: '#EF4444',
  },

  btnText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
