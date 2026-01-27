import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot } from 'firebase/firestore';

import { MobileContainer } from '../../components/layout/MobileContainer';

import { useTheme } from '../../context/ContextoTematica';
import { db, auth } from '../../config/firebase';

export function RankingScreen() {
  const { theme } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'perfil'),
      (snap) => {
        const lista = [];

        snap.forEach((d) => {
          const data = d.data() || {};
          lista.push({
            id: d.id,
            displayName: data.displayName || 'Usuario',
            xp: (data.xpTotal ?? data.experiencia ?? 0) || 0,
          });
        });

        lista.sort((a, b) => {
          const ax = a.xp || 0;
          const bx = b.xp || 0;

          if (ax === 0 && bx !== 0) return 1;
          if (bx === 0 && ax !== 0) return -1;
          if (bx !== ax) return bx - ax;

          return (a.displayName || '').localeCompare(b.displayName || '');
        });

        const ranked = lista.map((u, i) => ({ ...u, rank: i + 1 }));
        const uid = auth.currentUser?.uid || null;
        const miIndice = uid ? ranked.findIndex((u) => u.id === uid) : -1;

        const top10 = ranked.slice(0, 10);

        let finalList;
        if (miIndice === -1) {
          finalList = top10;
        } else if (miIndice < 10) {
          finalList = top10.map((u) => ({
            ...u,
            isCurrent: u.id === uid,
          }));
        } else {
          finalList = [
            ...top10,
            { ...ranked[miIndice], isCurrent: true },
          ];
        }

        setUsuarios(finalList);
        setCargando(false);
        setError(null);
      },
      (err) => {
        setError(err?.message || 'Error leyendo ranking');
        setCargando(false);
      }
    );

    return unsub;
  }, []);

  if (cargando) {
    return (
      <SafeAreaView
        style={[
          styles.containerCentered,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color="#FF8C42" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.containerCentered,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={{ color: theme.text, textAlign: 'center' }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor={theme.headerBg}
        barStyle={
          theme.text === '#000000'
            ? 'dark-content'
            : 'light-content'
        }
      />

      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <LinearGradient
          colors={['#0B66E8', '#0B59D5', '#0A48BC']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradientFondo}
          pointerEvents="none"
        />

        {Platform.OS === 'web' ? (
          <MobileContainer>
            <Text style={[styles.title, { color: theme.text }]}>
              Ranking de usuarios
            </Text>

            <FlatList
              data={usuarios}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.item,
                    { backgroundColor: theme.sectionBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.posicion,
                      { color: theme.text },
                      item.isCurrent && styles.currentHighlight,
                    ]}
                  >
                    {item.rank}.
                  </Text>

                  <Text
                    style={[
                      styles.nombre,
                      { color: theme.text },
                      item.isCurrent && styles.currentHighlight,
                    ]}
                  >
                    {item.displayName}
                  </Text>

                  <Text
                    style={[
                      styles.puntos,
                      { color: theme.text },
                      item.isCurrent && styles.currentHighlight,
                    ]}
                  >
                    {item.xp} 🎖️
                  </Text>
                </View>
              )}
              ListFooterComponent={() => {
                const ultimaFila = usuarios[usuarios.length - 1];
                return ultimaFila?.isCurrent ? (
                  <View style={styles.contenedorPosicion}>
                    <Text
                      style={[
                        styles.footerNote,
                        { color: theme.text },
                      ]}
                    >
                      Tu posición actual
                    </Text>
                  </View>
                ) : null;
              }}
            />
          </MobileContainer>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Ranking de usuarios
            </Text>

            <FlatList
              data={usuarios}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.item,
                    { backgroundColor: theme.sectionBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.posicion,
                      { color: theme.text },
                      item.isCurrent && styles.currentHighlight,
                    ]}
                  >
                    {item.rank}.
                  </Text>

                  <Text
                    style={[
                      styles.nombre,
                      { color: theme.text },
                      item.isCurrent && styles.currentHighlight,
                    ]}
                  >
                    {item.displayName}
                  </Text>

                  <Text
                    style={[
                      styles.puntos,
                      { color: theme.text },
                      item.isCurrent && styles.currentHighlight,
                    ]}
                  >
                    {item.xp} 🎖️
                  </Text>
                </View>
              )}
              ListFooterComponent={() => {
                const ultimaFila = usuarios[usuarios.length - 1];
                return ultimaFila?.isCurrent ? (
                  <View style={styles.contenedorPosicion}>
                    <Text
                      style={[
                        styles.footerNote,
                        { color: theme.text },
                      ]}
                    >
                      Tu posición actual
                    </Text>
                  </View>
                ) : null;
              }}
            />
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 0 : 16,
  },

  gradientFondo: {
    ...StyleSheet.absoluteFillObject,
  },

  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
  },

  posicion: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
    marginRight: 8,
  },

  nombre: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  puntos: {
    fontSize: 14,
    fontWeight: '700',
  },

  currentHighlight: {
    color: '#FF8C42',
    fontWeight: '700',
  },

  contenedorPosicion: {
    position: 'absolute',
    top: 0,
    left: 115,
    zIndex: 1,
  },

  footerNote: {
    textAlign: 'center',
    opacity: 0.8,
    fontSize: 12,
  },
});
