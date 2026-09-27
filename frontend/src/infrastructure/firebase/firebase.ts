import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';

const getEnv = (key: string, fallback: string) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', "AIzaSyDk4iZIu-SxSkpGGNyf4fO0lDgO5cuad98"),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', "partiuinvest.firebaseapp.com"),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', "partiuinvest"),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', "partiuinvest.firebasestorage.app"),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', "874876181201"),
  appId: getEnv('VITE_FIREBASE_APP_ID', "1:874876181201:web:55333eb78c386b703583f0"),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', "G-EB9RCXJE80"),
};

// Inicialização segura
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Inicialização com suporte offline persistente e sincronização multi-abas
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Se já tiver sido inicializado (ex: hot-reload)
    return getFirestore(app);
  }
})();
