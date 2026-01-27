import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './src/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import * as Notifications from 'expo-notifications';
import {
  aplicarPreferenciasNotificaciones,
  cancelarRecordatorioDiario,
} from './src/services/notificationService';

import { MobileContainer } from './src/components/layout/MobileContainer';

import { ContextoTematicaProvider } from './src/context/ContextoTematica';
import { RegisterScreen } from './src/screens/RegisterScreen';
import NavegacionTabs from './src/navegacion/NavegacionTabs';

const Stack = createStackNavigator();

/**
 * Configuración global del comportamiento de notificaciones
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Main">
      <Stack.Screen name="Main" component={NavegacionTabs} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Register">
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [hasNick, setHasNick] = useState(false);
  const [perfil, setPerfil] = useState(null);

  /**
   * Listener de autenticación
   * Controla cuándo Firebase está listo y si hay usuario activo
   */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  /**
   * Lectura inicial de datos locales necesarios para arrancar la app
   */
  useEffect(() => {
    (async () => {
      try {
        const nick = await AsyncStorage.getItem('@nick');
        setHasNick(!!nick);
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  /**
   * Sin usuario activo:
   * - limpiamos estado
   * - cancelamos notificaciones programadas
   */
  useEffect(() => {
    if (!user) {
      setPerfil(null);
      cancelarRecordatorioDiario();
      return;
    }

    const ref = doc(db, 'perfil', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setPerfil(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });

    return () => unsub();
  }, [user]);

  /**
   * Aplica preferencias de notificación cuando cambian los datos relevantes
   */
  useEffect(() => {
    if (!perfil) return;
    aplicarPreferenciasNotificaciones(perfil);
  }, [perfil?.quiereRecordatorioDiario, perfil?.horaRecordatorio]);

  if (!authReady || !storageReady) return null;

  const isInApp = !!user;

  return (
    <ContextoTematicaProvider>
      <NavigationContainer>
        {Platform.OS === 'web' ? (
          <MobileContainer>
            {isInApp ? <AppStack /> : <AuthStack />}
          </MobileContainer>
        ) : (
          isInApp ? <AppStack /> : <AuthStack />
        )}
      </NavigationContainer>
    </ContextoTematicaProvider>
  );
}
