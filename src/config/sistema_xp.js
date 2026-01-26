import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';


// ==========================
// 🔢 Utilidades de experiencia
// ==========================

const limitar = (valor, minimo, maximo) =>
  Math.max(minimo, Math.min(maximo, valor));

const multiplicadoresNivel = {
  Facil: 0.2,
  Intermedio: 0.3,
  Difícil: 0.4,
};

function aNumeroSeguro(valor, nombreCampo) {
  let n = typeof valor === 'number' ? valor : Number(valor);

  if (!Number.isFinite(n)) {
    console.warn(
      `⚠️ Valor no numérico en "${nombreCampo}", usando 0. Valor recibido:`,
      valor
    );
    return 0;
  }

  return n;
}

function normalizarTiempo(tiempo) {
  if (typeof tiempo === 'number') {
    if (!Number.isFinite(tiempo)) return 0;
    return Math.max(0, tiempo);
  }

  if (typeof tiempo === 'string' && tiempo.includes(':')) {
    const [mmRaw, ssRaw] = tiempo.split(':');
    const mm = aNumeroSeguro(mmRaw, 'minutos');
    const ss = aNumeroSeguro(ssRaw, 'segundos');
    return Math.max(0, mm * 60 + ss);
  }

  return 0;
}

// ==========================
// 🔢 Calcular experiencia
// ==========================

export function calcularExperiencia({
  nivel,
  aciertos,
  errores,
  tiempoTotalSegundos,
}) {
  const nivelNormalizado = nivel || 'Facil';
  const multiplicador =
    multiplicadoresNivel[nivelNormalizado] ?? 1;

  const aciertosNum = aNumeroSeguro(aciertos, 'aciertos');
  const erroresNum = aNumeroSeguro(errores, 'errores');
  const tiempoSeg = normalizarTiempo(tiempoTotalSegundos);

  const puntosBase = aciertosNum * 10;
  const bonusSinErrores = erroresNum === 0 ? 40 : 0;
  const penalizacionErrores = erroresNum * 6;

  const bonusRapidez = limitar(
    1000 / (tiempoSeg + 1),
    0,
    25
  );

  let xpTotal =
    (puntosBase +
      bonusSinErrores -
      penalizacionErrores +
      bonusRapidez) *
    multiplicador;

  if (!Number.isFinite(xpTotal)) xpTotal = 0;

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
// 🧍 Actualizar experiencia
// ==========================

export async function actualizarExperienciaUsuario(uid, partida) {
  const resultado = calcularExperiencia(partida);
  const { xp } = resultado;

  const perfilRef = doc(db, 'perfil', uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(perfilRef);
    const data = snap.exists() ? snap.data() : {};

    const xpActual = Number(data.xpTotal ?? 0);
    const nuevoTotal = xpActual + xp;

    tx.set(
      perfilRef,
      {
        xpTotal: nuevoTotal,
        experiencia: nuevoTotal,
        lastXP: xp,
      },
      { merge: true }
    );
  });

  return resultado;
}
