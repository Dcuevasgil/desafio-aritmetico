// ==========================
// 🔢 Utilidades de experiencia
// ==========================

/**
 * Limita un valor entre un mínimo y un máximo.
 * Ejemplo: limitar(120, 0, 100) → 100
 */
const limitar = (valor, minimo, maximo) =>
  Math.max(minimo, Math.min(maximo, valor));

/**
 * Multiplicadores de XP según dificultad.
 * Se aplican al total calculado para ajustar la progresión.
 */
const multiplicadoresNivel = {
  Facil: 0.2,
  Intermedio: 0.3,
  Dificil: 0.4,
};

/**
 * Convierte cualquier valor a número seguro.
 * - Si no es numérico o es NaN / Infinity → devuelve 0
 * - Loggea warning para detectar errores de datos
 */
function aNumeroSeguro(valor, nombreCampo) {
  let n;

  if (typeof valor === 'number') {
    n = valor;
  } else {
    n = Number(valor);
  }

  if (!Number.isFinite(n)) {
    console.warn(
      `⚠️ Valor no numérico en "${nombreCampo}", usando 0. Valor recibido:`,
      valor
    );
    return 0;
  }

  return n;
}

/**
 * Normaliza el tiempo total de una partida a segundos.
 * Acepta:
 * - number → segundos
 * - string "mm:ss"
 * - string "ss"
 * Cualquier formato inválido devuelve 0.
 */
function normalizarTiempo(tiempo) {
  // Ya es número
  if (typeof tiempo === 'number') {
    if (!Number.isFinite(tiempo)) {
      console.warn(
        '⚠️ tiempoTotalSegundos no numérico, usando 0. Valor:',
        tiempo
      );
      return 0;
    }
    return Math.max(0, tiempo);
  }

  // String tipo "mm:ss"
  if (typeof tiempo === 'string') {
    if (tiempo.includes(':')) {
      const [mmRaw, ssRaw] = tiempo.split(':');

      const mm = aNumeroSeguro(mmRaw, 'tiempoTotalSegundos:minutos');
      const ss = aNumeroSeguro(ssRaw, 'tiempoTotalSegundos:segundos');

      return Math.max(0, mm * 60 + ss);
    }

    // String no interpretable
    console.warn(
      '⚠️ tiempoTotalSegundos no numérico, usando 0. Valor:',
      tiempo
    );
  }

  return 0;
}

// ==========================
// 🔢 Calcular experiencia obtenida en una partida
// ==========================

/**
 * Calcula la experiencia obtenida en una partida completa.
 *
 * Entrada esperada:
 * {
 *   nivel,
 *   aciertos,
 *   errores,
 *   tiempoTotalSegundos
 * }
 *
 * Devuelve TODOS los datos normalizados + XP final:
 * {
 *   nivel,
 *   aciertos,
 *   errores,
 *   tiempoTotalSegundos,
 *   xp
 * }
 */
export function calcularExperiencia({
  nivel,
  aciertos,
  errores,
  tiempoTotalSegundos,
}) {
  // Normalización de nivel y multiplicador
  const nivelNormalizado = nivel || 'Facil';
  const multiplicadorBase = multiplicadoresNivel[nivelNormalizado];
  const multiplicador = Number.isFinite(multiplicadorBase)
    ? multiplicadorBase
    : 1;

  // Normalización de valores numéricos
  const aciertosNum = aNumeroSeguro(aciertos, 'aciertos');
  const erroresNum = aNumeroSeguro(errores, 'errores');
  const tiempoSeg = normalizarTiempo(tiempoTotalSegundos);

  // Log de depuración para trazabilidad
  console.log('DEBUG XP INPUT', {
    nivelOriginal: nivel,
    nivelUsado: nivelNormalizado,
    multiplicador,
    aciertosOriginal: aciertos,
    erroresOriginal: errores,
    tiempoOriginal: tiempoTotalSegundos,
    normalizados: {
      aciertosNum,
      erroresNum,
      tiempoSeg,
    },
  });

  // === Cálculo de XP ===

  // XP base por aciertos
  const puntosBase = aciertosNum * 10;

  // Bonus por partida perfecta
  const bonusSinErrores = erroresNum === 0 ? 40 : 0;

  // Penalización por errores
  const penalizacionErrores = erroresNum * 6;

  // Bonus por rapidez (más rápido → más XP)
  let bonusRapidez = 0;
  if (tiempoSeg >= 0) {
    const bruto = 1000 / (tiempoSeg + 1);
    bonusRapidez = limitar(bruto, 0, 25);
  }

  // XP total antes de límites
  let xpTotal =
    (puntosBase +
      bonusSinErrores -
      penalizacionErrores +
      bonusRapidez) *
    multiplicador;

  // Seguridad ante NaN o Infinity
  if (!Number.isFinite(xpTotal)) {
    console.warn('⚠️ xpTotal inválida, forzando a 0', {
      puntosBase,
      bonusSinErrores,
      penalizacionErrores,
      bonusRapidez,
      multiplicador,
    });
    xpTotal = 0;
  }

  // Límite final de XP por partida
  const xpFinal = limitar(Math.round(xpTotal), 0, 400);

  return {
    nivel: nivelNormalizado,
    aciertos: aciertosNum,
    errores: erroresNum,
    tiempoTotalSegundos: tiempoSeg,
    xp: xpFinal,
  };
}

// ==========================
// 🧍 Actualizar experiencia global del usuario
// ==========================

/**
 * Aplica la experiencia de una partida al usuario en Firestore.
 * - Calcula XP
 * - Incrementa el campo experiencia
 * - Devuelve el resumen de la partida
 */
export async function actualizarExperienciaUsuario(uid, partida) {
  // Calculamos la experiencia de la partida
  const resultado = calcularExperiencia(partida);
  const { xp, aciertos, errores, tiempoTotalSegundos, nivel } = resultado;

  const perfilRef = doc(db, 'perfil', uid);

  try {
    // Incrementa la experiencia global del usuario
    await setDoc(
      perfilRef,
      { experiencia: increment(xp) },
      { merge: true }
    );

    // Log resumen de la partida
    console.log('🧮 Partida finalizada');
    console.log(`Nivel: ${nivel}`);
    console.log(`Aciertos: ${aciertos}`);
    console.log(`Errores: ${errores}`);
    console.log(`Tiempo total (segundos): ${tiempoTotalSegundos}`);
    console.log(`+${xp} XP añadidos al usuario ${uid}`);
  } catch (error) {
    console.error('❌ Error al actualizar experiencia:', error);
  }

  // Útil para pantallas de resumen o animaciones de XP
  return resultado;
}
