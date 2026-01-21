import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_REMINDER_ID_KEY = 'DAILY_REMINDER_ID';

export async function pedirPermisosNotificaciones() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.getPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Punto de extensión para configuración específica de Android
 */
export async function configurarCanalAndroid() {
  // Implementación futura si se requiere personalización de canales
}

function parseHora(horaString) {
  if (!horaString || typeof horaString !== 'string') {
    return { hour: 12, minute: 0 };
  }

  const [hStr, mStr] = horaString.split(':');
  const hour = Number(hStr);
  const minute = Number(mStr);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return { hour: 12, minute: 0 };
  }

  return { hour, minute };
}

export async function cancelarRecordatorioDiario() {
  const idGuardado = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);

  if (!idGuardado) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(idGuardado);
  } catch (err) {
    console.warn('Error cancelando recordatorio diario:', err);
  }

  await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
}

export async function programarRecordatorioDiario(horaString) {
  const tienePermisos = await pedirPermisosNotificaciones();
  if (!tienePermisos) return;

  await cancelarRecordatorioDiario();

  const { hour, minute } = parseHora(horaString);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '¡Hora de practicar! 🧠',
      body: 'Vuelve a la app y hazte un desafío rápido.',
      sound: 'default',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: 'default',
    },
  });

  await AsyncStorage.setItem(DAILY_REMINDER_ID_KEY, notificationId);
}

export async function aplicarPreferenciasNotificaciones(perfil) {
  if (!perfil) return;

  if (perfil.quiereRecordatorioDiario) {
    await programarRecordatorioDiario(perfil.horaRecordatorio || '20:00');
  } else {
    await cancelarRecordatorioDiario();
  }
}
