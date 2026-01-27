import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { layout } from '../../estilos/baseStyles';

export function RankingScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'perfil'), (snap) => {
      const lista = [];
      snap.forEach((d) =>
        lista.push({
          id: d.id,
          displayName: d.data().displayName || 'Usuario',
          xp: d.data().xpTotal ?? 0,
        })
      );
      lista.sort((a, b) => b.xp - a.xp);
      setUsuarios(lista.slice(0, 10));
      setCargando(false);
    });
  }, []);

  if (cargando) {
    return (
      <SafeAreaView style={layout.contenedor}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={[layout.contenedor, layout.paddingWeb]}>
        <LinearGradient
          colors={['#0B66E8', '#0B59D5', '#0A48BC']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={layout.pantalla}>
          <Text style={styles.title}>Ranking</Text>

          <FlatList
            data={usuarios}
            keyExtractor={(i) => i.id}
            renderItem={({ item, index }) => (
              <View style={styles.item}>
                <Text style={styles.text}>
                  {index + 1}. {item.displayName}
                </Text>
                <Text style={styles.text}>{item.xp}</Text>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  title: { color: '#FFF', fontSize: 22, textAlign: 'center', marginBottom: 16 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  text: { color: '#FFF' },
});
