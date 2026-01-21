import { auth, db } from '../config/firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export const isValidNick = (n) =>
  /^[a-zA-Z0-9._-]{3,20}$/.test((n || '').trim());

const nickToId = (n) => (n || '').trim().toLowerCase();

export async function registrarSoloNick(nick) {
  const nickTrim = (nick || '').trim();

  if (!isValidNick(nickTrim)) {
    throw new Error(
      'Nick inválido. Usa 3–20 caracteres: letras, números, ., _ o -'
    );
  }

  const cred = await signInAnonymously(auth);
  const uid = cred.user?.uid;

  if (!uid) {
    throw new Error('No se pudo iniciar sesión anónima');
  }

  const nickId = nickToId(nickTrim);
  const nickRef = doc(db, 'nicks', nickId);
  const perfilRef = doc(db, 'perfil', uid);

  await runTransaction(db, async (tx) => {
    const nickSnap = await tx.get(nickRef);

    if (nickSnap.exists()) {
      throw new Error('nick_en_uso');
    }

    tx.set(nickRef, {
      uid,
      nick: nickTrim,
      createdAt: serverTimestamp(),
    });

    tx.set(perfilRef, {
      uid,
      displayName: nickTrim,
      nick: nickTrim,
      xpTotal: 0,
      createdAt: serverTimestamp(),
      authProvider: 'anonymous',
    });
  });

  await updateProfile(cred.user, { displayName: nickTrim });

  return { uid, nick: nickTrim };
}
