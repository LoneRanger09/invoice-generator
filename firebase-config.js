// Client-Side Firebase Configuration (v9+ Modular SDK)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyCU8bnMbt_RWoGoOmg-YvVnXhw09Pq1evs",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "invoice-gen09.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "invoice-gen09",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "invoice-gen09.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "117492567938377508734",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:117492567938377508734:web:730334f064c1af9bc8230c"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
