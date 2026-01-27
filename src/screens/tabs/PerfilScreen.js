import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Keyboard,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { auth, db } from '../../config/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, runTransaction } from 'firebase/firestore';

import { useTheme } from '../../context/ContextoTematica';
import localizaciones from '../../json/localizaciones.json';

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

/* ───────── helpers ───────── */

const opcionesAvatar = [
  require('../../assets/avatares/Avatar_1.png'),
  require('../../assets/avatares/Avatar_2.png'),
  require('../../assets/avatares/Avatar_3.png'),
  require('../../assets/avatares/Avatar_4.png'),
  require('../../assets/avatares/Avatar_5.png'),
  require('../../assets/avatares/Avatar_6.png'),
  require('../../assets/avatares/Avatar_7.png'),
  require('../../assets/avatares/Avatar_8.png'),
  require('../../assets/avatares/Avatar_9.png'),
  require('../../assets/avatares/Avatar_10.png'),
  require('../../assets/avatares/Avatar_11.png'),
  require('../../assets/avatares/Avatar_12.png'),
  require('../../assets/avatares/Avatar_13.png'),
  require('../../assets/avatares/Avatar_14.png'),
  require('../../assets/avatares/Avatar_15.png'),
  require('../../assets/avatares/Avatar_16.png'),
  require('../../assets/avatares/Avatar_17.png'),
];

const opcionesColorFondo = ['#A8D5BA', '#8EA6AA', '#B58975', '#C46D5F'];

const ESTADISTICAS_BASE = {
  partidasJugadas: 0,
  partidasSinErrores: 0,
  porcentajeSinErrores: 0,
  mediaTiemposPartidas: 0,
  mejorTiempo: 0,
};

const avatarRequireFromKey = (key) => {
  const match = key?.match(/Avatar_(\d+)\.png$/);
  const idx = match ? Number(match[1]) - 1 : 0;
  return opcionesAvatar[idx] ?? opcionesAvatar[0];
};

const avatarKeyFromRequire = (img) => {
  const i = opcionesAvatar.indexOf(img);
  return i >= 0 ? `Avatar_${i + 1}.png` : 'Avatar_1.png';
};

const normalizeNivelKey = (k) => {
  const map = {
    facil: 'Facil',
    fácil: 'Facil',
    intermedio: 'Intermedio',
    dificil: 'Difícil',
    difícil: 'Difícil',
  };
  return map[String(k || '').toLowerCase()] ?? 'Facil';
};

const getStatsDeNivel = (niveles, nivelKey) => {
  const nk = normalizeNivelKey(nivelKey);
  return { ...ESTADISTICAS_BASE, ...(niveles?.[nk] ?? {}) };
};

const formatearMMSS = (s = 0) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ───────── componente ───────── */

export function PerfilScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const user = auth.currentUser;

  const [nickName, setNickname] = useState('Usuario');
  const [ubicacion, setUbicacion] = useState('');
  const [avatarStatic, setAvatarStatic] = useState(opcionesAvatar[0]);
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarAsset, setAvatarAsset] = useState(null);
  const [colorFondo, setColorFondo] = useState(opcionesColorFondo[0]);

  const [listaLocalizaciones, setListaLocalizaciones] = useState([]);
  const [queryProv, setQueryProv] = useState('');

  const [nivelesStats, setNivelesStats] = useState({});
  const [estadisticas, setEstadisticas] = useState(ESTADISTICAS_BASE);
  const [nivel, setNivel] = useState('facil');

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const NIVELES = ['facil', 'intermedio', 'dificil'];

  useEffect(() => {
    ImagePicker.requestMediaLibraryPermissionsAsync();
  }, []);

  useEffect(() => {
    if (!user) return;

    const ref = doc(db, 'perfil', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() || {};
      setNickname(data.displayName || user.displayName || 'Usuario');
      setUbicacion(data.ubicacion || '');
      setAvatarStatic(avatarRequireFromKey(data.avatar));
      setAvatarUri(data.photoURL || null);
      setColorFondo(data.colorFondo || opcionesColorFondo[0]);

      const niveles = data?.estadisticas?.niveles ?? {};
      setNivelesStats(niveles);
      setEstadisticas(getStatsDeNivel(niveles, nivel));

      if (Array.isArray(localizaciones.provincias_españolas)) {
        setListaLocalizaciones(
          localizaciones.provincias_españolas
            .map((p) => p.nombre_localizacion)
            .sort((a, b) => a.localeCompare(b))
        );
      }
    });

    return unsub;
  }, [user, nivel]);

  const provinciasFiltradas = useMemo(() => {
    const norm = (s) =>
      (s ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return listaLocalizaciones.filter((p) =>
      norm(p).includes(norm(queryProv))
    );
  }, [listaLocalizaciones, queryProv]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    setAvatarAsset(asset);
    setAvatarUri(asset.uri);
  };

  const uploadToCloudinary = async ({ base64, localUri }) => {
    const data = new FormData();
    data.append(
      'file',
      base64
        ? `data:image/jpeg;base64,${base64}`
        : { uri: localUri, type: 'image/jpeg', name: 'avatar.jpg' }
    );
    data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: data }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'Upload error');
    return json.secure_url;
  };

  const guardarCambios = async () => {
    if (saving) return;
    setSaving(true);
    Keyboard.dismiss();

    try {
      const nick = nickName.trim();

      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'nicks', nick);
        const snap = await tx.get(ref);
        if (snap.exists() && snap.data().uid !== user.uid) {
          throw new Error('Nick en uso');
        }
        tx.set(ref, { uid: user.uid, nick });
      });

      let photoURL = avatarUri;
      if (avatarUri?.startsWith('file://') || avatarUri?.startsWith('content://')) {
        photoURL = await uploadToCloudinary({
          base64: avatarAsset?.base64,
          localUri: avatarUri,
        });
      }

      await setDoc(
        doc(db, 'perfil', user.uid),
        {
          displayName: nick,
          ubicacion,
          colorFondo,
          avatar: photoURL ? null : avatarKeyFromRequire(avatarStatic),
          photoURL: photoURL || null,
        },
        { merge: true }
      );

      await updateProfile(user, {
        displayName: nick,
        photoURL: photoURL || null,
      });

      setModalVisible(false);
      Alert.alert('Perfil actualizado');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const reseteoEstadisticas = (nivelActual) => {
    const nk = normalizeNivelKey(nivelActual);

    Alert.alert(
      'Reiniciar estadísticas',
      `¿Reiniciar ${nk}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            await setDoc(
              doc(db, 'perfil', user.uid),
              { estadisticas: { niveles: { [nk]: ESTADISTICAS_BASE } } },
              { merge: true }
            );
            setNivelesStats((p) => ({ ...p, [nk]: ESTADISTICAS_BASE }));
          },
        },
      ]
    );
  };

  return (
    <>
      <StatusBar
        backgroundColor={theme.headerBg}
        barStyle={theme.text === '#000000' ? 'dark-content' : 'light-content'}
      />

      <SafeAreaView style={[styles.contenedor, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={['#0B66E8', '#0B59D5', '#0A48BC']}
          style={styles.gradientFondo}
        />

        <View style={styles.pantalla}>
          {/* CABECERA */}
          <View style={styles.cabecera}>
            <View style={[styles.avatarContainer, { backgroundColor: colorFondo }]}>
              <Image
                source={avatarUri ? { uri: avatarUri } : avatarStatic}
                style={styles.avatar}
              />
            </View>

            <View style={styles.infoUsuario}>
              <Text style={[styles.nick, { color: theme.text }]}>{nickName}</Text>
              <Text style={[styles.parrafo, { color: theme.text }]}>{ubicacion}</Text>
            </View>

            <TouchableOpacity
              style={styles.botonEditarPerfilContainer}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.botonEditarPerfilTexto}>Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* ESTADÍSTICAS */}
          <View style={styles.estadisticasContenedor}>
            <Text style={[styles.seccionTitulo, { color: theme.text }]}>
              Estadísticas
            </Text>

            <View style={styles.nivelesDisponibles}>
              {NIVELES.map((n) => (
                <Pressable key={n} onPress={() => setNivel(n)}>
                  <Text
                    style={[
                      styles.tituloDificultad,
                      nivel === n && { opacity: 1 },
                    ]}
                  >
                    {n.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.tablaEstadisticas}>
              <Text style={styles.celdaLabel}>
                Partidas jugadas: {estadisticas.partidasJugadas}
              </Text>
              <Text style={styles.celdaLabel}>
                Sin errores: {estadisticas.partidasSinErrores}
              </Text>
              <Text style={styles.celdaLabel}>
                Porcentaje: {estadisticas.porcentajeSinErrores}%
              </Text>
              <Text style={styles.celdaLabel}>
                Tiempo medio: {formatearMMSS(estadisticas.mediaTiemposPartidas)}
              </Text>
              <Text style={styles.celdaLabel}>
                Mejor tiempo: {formatearMMSS(estadisticas.mejorTiempo)}
              </Text>
            </View>

            <TouchableOpacity onPress={() => reseteoEstadisticas(nivel)}>
              <LinearGradient
                colors={['#FF9C52', '#FF6C22']}
                style={styles.reinicioEstadisticas}
              >
                <Text style={styles.textoReinicioEstadisticas}>
                  Reiniciar estadísticas
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.contenedorModal}>
            <View style={styles.contenidoModal}>
              <Text style={styles.tituloModal}>Editar perfil</Text>

              <TextInput
                style={styles.input}
                value={nickName}
                onChangeText={setNickname}
              />

              <ScrollView horizontal>
                {opcionesAvatar.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => setAvatarStatic(img)}>
                    <Image source={img} style={styles.avatarSmall} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={pickImage}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#FFF" />
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.botonesModal}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={guardarCambios} disabled={saving}>
                  <Text>{saving ? 'Guardando...' : 'Confirmar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

/* ───────── styles ───────── */

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  gradientFondo: { ...StyleSheet.absoluteFillObject },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 30,
  },

  pantalla: {
    width: '100%',
    maxWidth: 390,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatar: { width: 50, height: 50, borderRadius: 25 },

  infoUsuario: { flex: 1, marginLeft: 12 },

  nick: { fontSize: 18, fontWeight: 'bold' },
  parrafo: { fontSize: 14 },

  botonEditarPerfilContainer: {
    backgroundColor: '#FF8C42',
    padding: 8,
    borderRadius: 8,
  },

  botonEditarPerfilTexto: { color: '#FFF', fontWeight: 'bold' },

  estadisticasContenedor: {
    marginTop: 40,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#1C2B4A',
  },

  seccionTitulo: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },

  nivelesDisponibles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },

  tituloDificultad: { color: '#FFF', opacity: 0.6 },

  tablaEstadisticas: { marginVertical: 8 },
  celdaLabel: { color: '#FFF', marginVertical: 2 },

  reinicioEstadisticas: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  textoReinicioEstadisticas: { color: '#FFF', fontWeight: 'bold' },

  contenedorModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  contenidoModal: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 12,
    width: '90%',
  },

  tituloModal: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#FFF',
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
  },

  avatarSmall: { width: 50, height: 50, borderRadius: 25, marginRight: 8 },

  botonesModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
