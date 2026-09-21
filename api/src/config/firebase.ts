import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { env } from './env.js';

const firebaseConfig = {
  apiKey: "AIzaSyDk4iZIu-SxSkpGGNyf4fO0lDgO5cuad98",
  authDomain: "partiuinvest.firebaseapp.com",
  projectId: env.FIREBASE_PROJECT_ID || "partiuinvest",
  storageBucket: "partiuinvest.firebasestorage.app",
  messagingSenderId: "874876181201",
  appId: "1:874876181201:web:55333eb78c386b703583f0",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
