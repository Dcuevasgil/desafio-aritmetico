import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLlr5FlHwQELUynsIPvJRx8gwCr-I9LL0",
  authDomain: "operaciones-aritmeticas.firebaseapp.com",
  projectId: "operaciones-aritmeticas",
  storageBucket: "operaciones-aritmeticas.firebasestorage.app",
  messagingSenderId: "88817606631",
  appId: "1:88817606631:web:6365ec61a1803b62656742",
  measurementId: "G-E3BCSL0PGD"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
