import React from 'react';
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

export function Ajustes() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('@nick');
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.contenedor}>
        <LinearGradient
          colors={['#0B66E8', '#0B59D5', '#0A48BC']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.pantalla}>
          <View style={styles.header}>
            <Ionicons
              name="chevron-back-outline"
              size={28}
              color="#FFF"
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.title}>Configuración</Text>
          </View>

          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Ayuda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Privacidad</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.logout]} onPress={logout}>
            <Text style={styles.btnText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  pantalla: {
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { color: '#FFF', fontSize: 18, marginLeft: 12 },
  btn: {
    width: '100%',
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  logout: { backgroundColor: '#EF4444' },
  btnText: { color: '#FFF', textAlign: 'center', fontWeight: '600' },
});
