/* ─────────── Configuración ─────────── */

const CAPS_POR_NIVEL = { Facil: 30, Intermedio: 40, Difícil: 50 };

const normalizarNivel = (n) => {
  const s = (n ?? '').toString().toLowerCase();
  if (s === 'facil' || s === 'fácil') return 'Facil';
  if (s === 'intermedio') return 'Intermedio';
  if (s === 'dificil' || s === 'difícil') return 'Difícil';
  return 'Intermedio';
};

const aleatorio = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const mezclar = (arr) => arr.sort(() => Math.random() - 0.5);

function construirOpciones(respuesta, operacion) {
  const opciones = new Set([respuesta]);

  let offsets;
  switch (operacion) {
    case '×':
      offsets = [-12, -6, -3, -2, -1, 1, 2, 3, 6, 12];
      break;
    case '÷':
      offsets = [-2, -1, 1, 2, 3];
      break;
    default:
      offsets = [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10];
  }

  while (opciones.size < 4) {
    const delta = offsets[aleatorio(0, offsets.length - 1)];
    const candidato = respuesta + delta;
    if (operacion === '÷' && candidato < 1) continue;
    opciones.add(candidato);
  }

  return mezclar([...opciones]);
}

const formatearMMSS = (s = 0) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ─────────── Imports ─────────── */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { auth, db } from '../../config/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';

import { useTheme } from '../../context/ContextoTematica';

import { actualizarExperienciaUsuario } from '../../config/sistema_xp';

import { layout } from '../../estilos/baseStyles';

/* ─────────── Constantes ─────────── */

const opcionesAvatar = {
  'Avatar_1.png': require('../../assets/avatares/Avatar_1.png'),
  'Avatar_2.png': require('../../assets/avatares/Avatar_2.png'),
  'Avatar_3.png': require('../../assets/avatares/Avatar_3.png'),
  'Avatar_4.png': require('../../assets/avatares/Avatar_4.png'),
  'Avatar_5.png': require('../../assets/avatares/Avatar_5.png'),
  'Avatar_6.png': require('../../assets/avatares/Avatar_6.png'),
  'Avatar_7.png': require('../../assets/avatares/Avatar_7.png'),
  'Avatar_8.png': require('../../assets/avatares/Avatar_8.png'),
  'Avatar_9.png': require('../../assets/avatares/Avatar_9.png'),
  'Avatar_10.png': require('../../assets/avatares/Avatar_10.png'),
  'Avatar_11.png': require('../../assets/avatares/Avatar_11.png'),
  'Avatar_12.png': require('../../assets/avatares/Avatar_12.png'),
  'Avatar_13.png': require('../../assets/avatares/Avatar_13.png'),
  'Avatar_14.png': require('../../assets/avatares/Avatar_14.png'),
  'Avatar_15.png': require('../../assets/avatares/Avatar_15.png'),
  'Avatar_16.png': require('../../assets/avatares/Avatar_16.png'),
  'Avatar_17.png': require('../../assets/avatares/Avatar_17.png'),
};

const opcionesColorFondo = ['#A8D5BA', '#8EA6AA', '#B58975', '#C46D5F'];
const logo = require('../../assets/imagenes/logo_circular_5.png');

const LEVELS = {
  Facil: {
    operaciones: ['+', '-'],
    puntuacion_maxima: 20,
    tiempo: 10,
  },
  Intermedio: {
    operaciones: ['+', '-', '×'],
    puntuacion_maxima: 50,
    tiempo: 11,
  },
  Difícil: {
    operaciones: ['+', '-', '×', '÷'],
    puntuacion_maxima: 100,
    tiempo: 12,
  },
};

/* ─────────── Componente ─────────── */

export function HomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState('Usuario');
  const [avatarKey, setAvatarKey] = useState('Avatar_1.png');
  const [avatarUri, setAvatarUri] = useState(null);
  const [colorFondo, setColorFondo] = useState(opcionesColorFondo[0]);
  const [colorAro, setColorAro] = useState('#FFFFFF');

  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [resumenPartida, setResumenPartida] = useState(null);

  const [nivel, setNivel] = useState(null);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState({ correct: 0, answered: 0 });
  const [roundTimes, setRoundTimes] = useState([]);

  const [opcionesRespuesta, setOpcionesRespuesta] = useState([]);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [estadoRespuesta, setEstadoRespuesta] = useState(null);
  const [mensajeRespuesta, setMensajeRespuesta] = useState('');

  const [xpTotal, setXpTotal] = useState(0);
  const [loadingXP, setLoadingXP] = useState(true);

  const timerRef = useRef(null);
  const finalizacion = useRef(false);
  const partidaRef = useRef({
    correct: 0,
    wrong: 0,
    totalTime: 0,
    round: 0,
    lastLevelTime: 0,
  });

  useEffect(() => {
    if (!user) {
      setXpTotal(0);
      setLoadingXP(false);
      return;
    }

    const ref = doc(db, 'perfil', user.uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const datosUsuario = snap.data();

        setDisplayName(datosUsuario.displayName || 'Usuario');
        setAvatarKey(datosUsuario.avatar || 'Avatar_1.png');
        setAvatarUri(datosUsuario.photoURL || null);
        setColorFondo(datosUsuario.colorFondo || opcionesColorFondo[0]);
        setColorAro(datosUsuario.colorAro || '#FFFFFF');

        const xp = Number(datosUsuario.xpTotal ?? 0);
        setXpTotal(xp);
      } else {
        setXpTotal(0);
      }

      setLoadingXP(false);
    });

    return () => unsub();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setNivel(null);
      setRound(0);
      setQuestion(null);
      setTimeLeft(0);
      setScore({ correct: 0, answered: 0 });
      setRoundTimes([]);
    }, [])
  );

  const generarPregunta = () => {
    const nivelN = normalizarNivel(nivel);
    const cfg = LEVELS[nivelN];
    const op = cfg.operaciones[Math.floor(Math.random() * cfg.operaciones.length)];

    if (op === '÷') {
      const b = aleatorio(1, 9);
      const coc = aleatorio(2, 10);
      return {
        a: coc * b,
        b,
        operacion: op,
        respuesta: coc,
        opciones: construirOpciones(coc, op),
      };
    }

    const a = aleatorio(1, cfg.puntuacion_maxima);
    const b = aleatorio(1, cfg.puntuacion_maxima);
    const resp = op === '+' ? a + b : op === '-' ? a - b : a * b;

    return {
      a,
      b,
      operacion: op,
      respuesta: resp,
      opciones: construirOpciones(resp, op),
    };
  };

  useEffect(() => {
    if (!nivel) return;

    const nivelN = normalizarNivel(nivel);
    partidaRef.current = {
      correct: 0,
      wrong: 0,
      totalTime: 0,
      round: 0,
      lastLevelTime: LEVELS[nivelN].tiempo,
    };

    setScore({ correct: 0, answered: 0 });
    setRound(0);
    setRoundTimes([]);

    startRound();
  }, [nivel]);

  const startRound = () => {
    clearInterval(timerRef.current);

    const q = generarPregunta();
    setQuestion(q);
    setOpcionesRespuesta(q.opciones);
    setOpcionSeleccionada(null);
    setEstadoRespuesta(null);
    setMensajeRespuesta('');
    finalizacion.current = false;

    const nivelN = normalizarNivel(nivel);
    const t = LEVELS[nivelN].tiempo;

    setTimeLeft(t);

    partidaRef.current.round += 1;
    setRound(partidaRef.current.round);
  };

  useEffect(() => {
    if (round > 0 && round <= 10) {
      timerRef.current = setInterval(
        () => setTimeLeft((t) => Math.max(0, t - 1)),
        1000
      );
      return () => clearInterval(timerRef.current);
    }
  }, [round]);

  useEffect(() => {
    if (
      timeLeft === 0 &&
      nivel &&
      question &&
      !finalizacion.current
    ) {
      finalizarRespuesta(false);
    }
  }, [timeLeft, nivel, question]);

  const finalizarRespuesta = (ok) => {
    if (finalizacion.current) return;
    finalizacion.current = true;
    clearInterval(timerRef.current);

    if (ok) partidaRef.current.correct += 1;
    else partidaRef.current.wrong += 1;

    // por si quieres mantenerlo en UI (opcional)
    setScore({
      correct: partidaRef.current.correct,
      answered: partidaRef.current.correct + partidaRef.current.wrong,
    });

    setEstadoRespuesta(ok ? 'ok' : 'ko');
    setMensajeRespuesta(ok ? '¡Correcto!' : `Respuesta: ${question.respuesta}`);

    setTimeout(() => next(ok), 450);
  };

  const elegirOpcion = (op) => {
    if (!question || finalizacion.current) return;
    setOpcionSeleccionada(op);
    finalizarRespuesta(op === question.respuesta);
  };

  const ESTADISTICAS_BASE = {
    partidasJugadas: 0,
    partidasSinErrores: 0,
    porcentajeSinErrores: 0,
    mediaTiemposPartidas: 0,
    mejorTiempo: 0,
  };

  const next = async () => {
    const nivelN = normalizarNivel(nivel);
    const tiempoRondaMax = LEVELS[nivelN].tiempo;

    const gastado = Math.max(0, tiempoRondaMax - timeLeft);
    partidaRef.current.totalTime += gastado;

    const answered = partidaRef.current.correct + partidaRef.current.wrong;

    // ───── sigue la partida ─────
    if (answered < 10) {
      startRound();
      return;
    }

    // ───── final de partida ─────
    clearInterval(timerRef.current);
    setQuestion(null);
    setEstadoRespuesta(null);

    const partida = {
      nivel: nivelN,
      aciertos: partidaRef.current.correct,
      errores: partidaRef.current.wrong,
      tiempoTotalSegundos: partidaRef.current.totalTime,
    };

    // 1) ───── guardar estadísticas (aislado) ─────
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'perfil', user.uid);
        const snap = await tx.get(ref);

        const data = snap.exists() ? snap.data() : {};
        const niveles = data.estadisticas?.niveles ?? {};

        // OJO: aseguramos base + prev
        const prev = { ...ESTADISTICAS_BASE, ...(niveles[nivelN] ?? {}) };

        const partidasJugadas = (prev.partidasJugadas ?? 0) + 1;
        const partidasSinErrores =
          (prev.partidasSinErrores ?? 0) + (partida.errores === 0 ? 1 : 0);

        const mediaTiemposPartidas = Math.round(
          ((prev.mediaTiemposPartidas ?? 0) * (prev.partidasJugadas ?? 0) +
            partida.tiempoTotalSegundos) / partidasJugadas
        );

        const mejorTiempo =
          !prev.mejorTiempo || prev.mejorTiempo === 0
            ? partida.tiempoTotalSegundos
            : Math.min(prev.mejorTiempo, partida.tiempoTotalSegundos);

        const porcentajeSinErrores = Math.round(
          (partidasSinErrores / partidasJugadas) * 100
        );

        tx.set(
          ref,
          {
            estadisticas: {
              niveles: {
                ...niveles,
                [nivelN]: {
                  partidasJugadas,
                  partidasSinErrores,
                  porcentajeSinErrores,
                  mediaTiemposPartidas,
                  mejorTiempo,
                },
              },
            },
          },
          { merge: true }
        );
      });
    } catch (err) {
      console.error('❌ ERROR GUARDANDO ESTADÍSTICAS:', err);
      alert(`Error guardando estadísticas: ${err?.message ?? String(err)}`);
      return; // cortamos aquí para no seguir
    }

    // 2) ───── XP (aislado para que si falla no rompa todo) ─────
    let xp = 0;
    try {
      const resultadoXP = await actualizarExperienciaUsuario(user.uid, partida);
      xp = Number(resultadoXP?.xp ?? 0);
      setXpTotal((prev) => prev + xp);
    } catch (err) {
      console.error('⚠️ ERROR ACTUALIZANDO XP:', err);
      // NO hacemos return: la partida y stats ya están guardadas
    }

    // ───── resumen ─────
    setResumenPartida({
      aciertos: partida.aciertos,
      errores: partida.errores,
      tiempo: partida.tiempoTotalSegundos,
      xp,
    });
    setMostrarResumen(true);
  };


  /* ─────────── Render ─────────── */

  return (
    <>
      <StatusBar
        backgroundColor={theme.headerBg}
        barStyle={theme.text === '#000000' ? 'dark-content' : 'light-content'}
      />

      <SafeAreaView 
        style={[
          styles.container,
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
          {!nivel && (
            <>
              <TouchableOpacity
                style={styles.header}
                onPress={() => navigation.navigate('Perfil')}
              >
                <Image
                  source={avatarUri ? { uri: avatarUri } : opcionesAvatar[avatarKey]}
                  style={[
                    styles.avatar, 
                    { 
                      backgroundColor: colorFondo,
                      borderColor: colorAro
                    }
                  ]}
                />
                <Text style={[styles.nick, { color: theme.text }]}>
                  {displayName}
                </Text>
                <View style={styles.experienciaUsuario}>
                  {loadingXP ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.numeroExperiencia}>
                      ⭐ {Number.isFinite(xpTotal) ? xpTotal : 0}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <Image source={logo} style={styles.logo} />
              <Text style={[styles.title, { color: theme.text }]}>
                Desafío Aritmético
              </Text>

              {Object.keys(LEVELS).map((lv) => (
                <TouchableOpacity key={lv} onPress={() => setNivel(lv)}>
                  <LinearGradient
                    colors={['#FFA142', '#FF6C22']}
                    style={styles.levelButton}
                  >
                    <Text style={styles.levelText}>{lv}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </>
          )}

          {nivel && question && (
            <View style={styles.content}>
              <Text style={styles.tiempo}>
                ⏱ {timeLeft}s
              </Text>
      
              <Text style={styles.question}>
                {question.a} {question.operacion} {question.b} = ?
              </Text>

              <View style={styles.cajaOpciones}>
                {opcionesRespuesta.map((op, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.botonOpcion,
                      opcionSeleccionada === op && styles.opcionSeleccionada,
                    ]}
                    onPress={() => elegirOpcion(op)}
                  >
                    <Text style={styles.textoOpcion}>{op}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {estadoRespuesta && (
                <Text style={styles.feedbackText}>{mensajeRespuesta}</Text>
              )}
            </View>
          )}
        </View>

        {/* ─────────── MODAL RESUMEN PARTIDA ─────────── */}
        <Modal
          visible={mostrarResumen}
          transparent
          animationType="fade"
          onRequestClose={() => setMostrarResumen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Resumen de la partida</Text>

              <Text>Aciertos: {resumenPartida?.aciertos}</Text>
              <Text>Errores: {resumenPartida?.errores}</Text>
              <Text>Tiempo: {formatearMMSS(resumenPartida?.tiempo)}</Text>
              <Text>XP ganada: ⭐ {resumenPartida?.xp}</Text>

              <TouchableOpacity
                onPress={() => {
                  setMostrarResumen(false);
                  setNivel(null); // volver a home
                }}
              >
                <Text style={styles.modalButton}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
      </SafeAreaView>
    </>
  );
}

/* ─────────── Styles ─────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 0 : 24,
  },
  gradientFondo: { ...StyleSheet.absoluteFillObject },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },

  nick: { marginLeft: 12, fontSize: 16, fontWeight: '600' },

  experienciaUsuario: { marginLeft: 'auto' },
  numeroExperiencia: { color: '#FFF', fontWeight: '700' },

  logo: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 24,
  },

  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },

  levelButton: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },

  levelText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  content: {},

  tiempo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },

  question: {
    fontSize: 40,
    fontWeight: '600',
    marginVertical: 24,
    textAlign: 'center',
  },

  cajaOpciones: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  botonOpcion: {
    width: '48%',
    height: Platform.OS === 'web' ? 96 : 88,
    borderRadius: 14,
    backgroundColor: '#FF8C42',
    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 8, // ⬅️ CONTROLA EL GAP VERTICAL AQUÍ
  },

  textoOpcion: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  opcionSeleccionada: {
    backgroundColor: '#DBEAFE',
  },

  feedbackText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    width: 320,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  modalButton: {
    marginTop: 16,
    fontWeight: 'bold',
  },
});
