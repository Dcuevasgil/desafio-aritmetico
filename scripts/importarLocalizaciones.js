require('dotenv').config();
const admin = require('firebase-admin');
const localizaciones = require('../src/json/localizaciones.json');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function importar() {
  const datos = localizaciones.provincias_españolas;

  if (!Array.isArray(datos)) {
    throw new Error('El JSON de localizaciones no tiene el formato esperado');
  }

  const batch = db.batch();

  datos.forEach((provincia) => {
    const ref = db.collection('localizaciones').doc(provincia.nombre_localizacion);
    batch.set(ref, provincia);
  });

  await batch.commit();
  console.log('✅ Importación completada con éxito.');
}

importar().catch((err) => {
  console.error('❌ Error al importar:', err);
  process.exit(1);
});
