import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../config/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, runTransaction } from 'firebase/firestore';

import { useTheme } from '../../context/ContextoTematica';
import localizaciones from '../../json/localizaciones.json';

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

import { layout } from '../../estilos/baseStyles';

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
const opcionesColorAro = ['#FF8C42', '#FFFFFF', '#22C55E', '#60A5FA', '#F43F5E'];

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
  const { theme } = useTheme();
  const user = auth.currentUser;

  const [nickName, setNickname] = useState('Usuario');
  const [ubicacion, setUbicacion] = useState('');
  const [avatarStatic, setAvatarStatic] = useState(opcionesAvatar[0]);
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarAsset, setAvatarAsset] = useState(null);

  const [colorFondo, setColorFondo] = useState(opcionesColorFondo[0]);
  const [colorAro, setColorAro] = useState(opcionesColorAro[0]);

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
    // precargar lista provincias
    if (Array.isArray(localizaciones.provincias_españolas)) {
      setListaLocalizaciones(
        localizaciones.provincias_españolas
          .map((p) => p.nombre_localizacion)
          .sort((a, b) => a.localeCompare(b))
      );
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const ref = doc(db, 'perfil', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() || {};

      setNickname(data.displayName || user.displayName || 'Usuario');
      setUbicacion(data.ubicacion || '');

      // Avatar: si hay photoURL, se usa; si no, se usa avatar estático
      setAvatarUri(data.photoURL || user.photoURL || null);
      setAvatarStatic(avatarRequireFromKey(data.avatar || 'Avatar_1.png'));

      setColorFondo(data.colorFondo || opcionesColorFondo[0]);
      setColorAro(data.colorAro || opcionesColorAro[0]);

      const niveles = data?.estadisticas?.niveles ?? {};
      setNivelesStats(niveles);
      setEstadisticas(getStatsDeNivel(niveles, nivel));
    });

    return unsub;
  }, [user, nivel]);

  const provinciasFiltradas = useMemo(() => {
    const norm = (s) =>
      (s ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    if (!queryProv.trim()) return [];
    return listaLocalizaciones
      .filter((p) => norm(p).includes(norm(queryProv)))
      .slice(0, 10); // top 10 para no petar el modal
  }, [listaLocalizaciones, queryProv]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });

    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    setAvatarAsset(asset);
    setAvatarUri(asset.uri); // previsualización
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
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado');
      return;
    }
    if (saving) return;

    setSaving(true);
    Keyboard.dismiss();

    try {
      const nick = nickName.trim();
      if (!nick) throw new Error('El nick no puede estar vacío');

      // Reservar nick (colección nicks)
      await runTransaction(db, async (tx) => {
        const refNick = doc(db, 'nicks', nick);
        const snap = await tx.get(refNick);

        if (snap.exists() && snap.data().uid !== user.uid) {
          throw new Error('Nick en uso');
        }
        tx.set(refNick, { uid: user.uid, nick }, { merge: true });
      });

      // Subir imagen si es local
      let finalPhotoURL = avatarUri;
      const isLocal =
        finalPhotoURL?.startsWith('file://') || finalPhotoURL?.startsWith('content://');

      if (isLocal) {
        finalPhotoURL = await uploadToCloudinary({
          base64: avatarAsset?.base64,
          localUri: avatarUri,
        });
      }

      // Si hay photoURL (cloudinary), guardamos avatarKey como null (opcional)
      // Si NO hay photoURL, guardamos avatarKey y photoURL null
      const avatarKey = finalPhotoURL ? null : avatarKeyFromRequire(avatarStatic);

      await setDoc(
        doc(db, 'perfil', user.uid),
        {
          displayName: nick,
          ubicacion: ubicacion || '',
          colorFondo,
          colorAro,
          avatar: avatarKey,
          photoURL: finalPhotoURL || null,
        },
        { merge: true }
      );

      await updateProfile(user, {
        displayName: nick,
        photoURL: finalPhotoURL || null,
      });

      setModalVisible(false);
      Alert.alert('Perfil actualizado');
    } catch (e) {
      Alert.alert('Error', e.message || 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const reseteoEstadisticas = (nivelActual) => {
    if (!user) return;
    const nk = normalizeNivelKey(nivelActual);

    Alert.alert('Reiniciar estadísticas', `¿Reiniciar ${nk}?`, [
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
          setEstadisticas(ESTADISTICAS_BASE);
        },
      },
    ]);
  };

  return (
    <>
      <StatusBar
        backgroundColor={theme.headerBg}
        barStyle={theme.text === '#000000' ? 'dark-content' : 'light-content'}
      />

      <SafeAreaView
        style={[
          styles.contenedor,
          layout.contenedor,
          layout.paddingWeb,
          { backgroundColor: theme.background }
        ]}
      >
        <LinearGradient
          colors={['#0B66E8', '#0B59D5', '#0A48BC']}
          style={styles.gradientFondo}
        />

        <View style={layout.pantalla}>
          {/* CABECERA */}
          <View style={styles.cabecera}>
            <View style={[styles.avatarContainer, { backgroundColor: colorFondo, borderColor: colorAro }]}>
              <Image
                source={avatarUri ? { uri: avatarUri } : avatarStatic}
                style={styles.avatar}
              />
            </View>

            <View style={styles.infoUsuario}>
              <Text style={[styles.nick, { color: '#FFF' }]}>{nickName}</Text>
              <Text style={[styles.parrafo, { color: '#E5E7EB' }]}>
                {ubicacion ? ubicacion : 'Sin ubicación'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonEditarPerfilContainer}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.botonEditarPerfilTexto}>Editar</Text>
            </TouchableOpacity>
          </View>

          {/* ESTADÍSTICAS */}
          <View style={styles.estadisticasContenedor}>
            <Text style={styles.seccionTitulo}>Estadísticas</Text>

            <View style={styles.nivelesDisponibles}>
              {NIVELES.map((n) => (
                <Pressable key={n} onPress={() => setNivel(n)} style={styles.pillWrap}>
                  <View style={[styles.pill, nivel === n && styles.pillActiva]}>
                    <Text style={[styles.pillText, nivel === n && styles.pillTextActiva]}>
                      {n.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={styles.tablaEstadisticas}>
              <Text style={styles.celdaLabel}>Partidas jugadas: {estadisticas.partidasJugadas}</Text>
              <Text style={styles.celdaLabel}>Sin errores: {estadisticas.partidasSinErrores}</Text>
              <Text style={styles.celdaLabel}>Porcentaje: {estadisticas.porcentajeSinErrores}%</Text>
              <Text style={styles.celdaLabel}>
                Tiempo medio: {formatearMMSS(estadisticas.mediaTiemposPartidas)}
              </Text>
              <Text style={styles.celdaLabel}>
                Mejor tiempo: {formatearMMSS(estadisticas.mejorTiempo)}
              </Text>

              {estadisticas.partidasJugadas === 0 && (
                <Text style={styles.hint}>
                  Juega una partida para empezar a ver estadísticas.
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={() => reseteoEstadisticas(nivel)}>
              <LinearGradient colors={['#FF9C52', '#FF6C22']} style={styles.reinicioEstadisticas}>
                <Text style={styles.textoReinicioEstadisticas}>Reiniciar estadísticas</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />

          <View style={styles.contenedorModal}>
            <View style={styles.contenidoModal}>
              <Text style={styles.tituloModal}>Editar perfil</Text>

              {/* Nick */}
              <Text style={styles.label}>Nick</Text>
              <TextInput
                style={styles.input}
                value={nickName}
                onChangeText={setNickname}
                placeholder="Tu nick"
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoCapitalize="none"
              />

              {/* Ubicación */}
              <Text style={styles.label}>Ubicación</Text>
              <TextInput
                style={styles.input}
                value={queryProv}
                onChangeText={(t) => {
                  setQueryProv(t);
                  if (!t) return;
                }}
                placeholder="Busca tu provincia..."
                placeholderTextColor="rgba(255,255,255,0.6)"
              />

              {provinciasFiltradas.length > 0 && (
                <View style={styles.sugerencias}>
                  {provinciasFiltradas.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => {
                        setUbicacion(p);
                        setQueryProv('');
                      }}
                      style={styles.sugerenciaItem}
                    >
                      <Text style={styles.sugerenciaText}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.seleccionActual}>
                Seleccionada: {ubicacion ? ubicacion : '—'}
              </Text>

              {/* Avatar */}
              <View style={styles.rowHeader}>
                <Text style={styles.label}>Avatar</Text>
                <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
                  <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
                  <Text style={styles.uploadText}>Subir</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {opcionesAvatar.map((img, i) => {
                  const selected = img === avatarStatic && !avatarUri;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        setAvatarUri(null);
                        setAvatarStatic(img);
                      }}
                      style={[styles.avatarChoice, selected && styles.avatarChoiceSel]}
                    >
                      <Image source={img} style={styles.avatarSmall} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Color fondo */}
              <Text style={styles.label}>Color de fondo (avatar)</Text>
              <View style={styles.coloresRow}>
                {opcionesColorFondo.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColorFondo(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      colorFondo === c && styles.colorDotSel,
                    ]}
                  />
                ))}
              </View>

              {/* Color aro */}
              <Text style={styles.label}>Color del aro</Text>
              <View style={styles.coloresRow}>
                {opcionesColorAro.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColorAro(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      colorAro === c && styles.colorDotSel,
                    ]}
                  />
                ))}
              </View>

              {/* Acciones */}
              <View style={styles.botonesModal}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={guardarCambios} disabled={saving} style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>
                    {saving ? 'Guardando...' : 'Confirmar'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.note}>
                Nota: en web algunas cosas (notificaciones, etc.) no funcionan igual que en móvil.
              </Text>
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

  pantalla: {
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 20 : 0,
  },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
  },

  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatar: { width: 50, height: 50, borderRadius: 25 },

  infoUsuario: { flex: 1, marginLeft: 12 },
  nick: { fontSize: 18, fontWeight: 'bold' },
  parrafo: { fontSize: 14 },

  botonEditarPerfilContainer: {
    backgroundColor: '#FF8C42',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  botonEditarPerfilTexto: { color: '#FFF', fontWeight: 'bold' },

  estadisticasContenedor: {
    marginTop: 26,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#1C2B4A',
  },

  seccionTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFF',
  },

  nivelesDisponibles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },

  pillWrap: { flex: 1, alignItems: 'center' },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillActiva: {
    backgroundColor: 'rgba(255,140,66,0.25)',
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  pillText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 12 },
  pillTextActiva: { color: '#FFF' },

  tablaEstadisticas: { marginTop: 8 },
  celdaLabel: { color: '#FFF', marginVertical: 2, fontSize: 14 },

  hint: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  reinicioEstadisticas: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoReinicioEstadisticas: { color: '#FFF', fontWeight: 'bold' },

  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  contenedorModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  contenidoModal: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    maxWidth: 420,
  },

  tituloModal: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  label: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 10, marginBottom: 6 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#FFF',
    padding: 10,
    borderRadius: 10,
  },

  sugerencias: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },

  sugerenciaItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  sugerenciaText: { color: '#FFF' },

  seleccionActual: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },

  rowHeader: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  uploadText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  rowScroll: { marginTop: 10, marginBottom: 6 },
  avatarChoice: {
    marginRight: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  avatarChoiceSel: {
    borderWidth: 2,
    borderColor: '#FF8C42',
  },
  avatarSmall: { width: 46, height: 46, borderRadius: 23 },

  coloresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },

  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorDotSel: {
    borderColor: '#FFF',
    transform: [{ scale: 1.15 }],
  },

  botonesModal: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
  },
  btnGhostText: { color: '#FFF', fontWeight: '800' },

  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FF8C42',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFF', fontWeight: '800' },

  note: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
});
