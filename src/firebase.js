// firebase.js - Configuration Firebase robuste et réutilisable pour CASA MADRE - Dépôt Zerktouni
// Compatible ES Modules, Vite, SSR & Netlify Functions
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import fileConfig from '../firebase-applet-config.json';

// Configuration dynamique fusionnant les variables d'environnement Vite et le fichier JSON
export const resolvedFirebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || fileConfig.apiKey,
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || fileConfig.authDomain,
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || fileConfig.projectId,
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || fileConfig.storageBucket,
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || fileConfig.messagingSenderId,
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || fileConfig.appId,
  firestoreDatabaseId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || fileConfig.firestoreDatabaseId,
  oAuthClientId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_OAUTH_CLIENT_ID) || fileConfig.oAuthClientId,
};

// Initialisation unique du singleton Firebase
export const app = !getApps().length ? initializeApp(resolvedFirebaseConfig) : getApp();

// Initialisation de Firebase Authentication avec persistance de session locale
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {
  // Ignore en environnement hors navigateur
}

// Provider Google configuré
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialisation de la base de données Firestore (avec base de données dédiée)
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);

// Initialisation de Firebase Storage pour les images et documents
export const storage = getStorage(app);

/**
 * Connexion avec Google via popup (avec repli redirect)
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    console.error('Erreur de connexion Google:', error);
    throw error;
  }
};

/**
 * Connexion par e-mail et mot de passe
 */
export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
};

/**
 * Inscription par e-mail et mot de passe
 */
export const signUpWithEmail = async (email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
};

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email.trim());
};

/**
 * Déconnexion de l'utilisateur
 */
export const logOut = async () => {
  await signOut(auth);
};

export {
  onAuthStateChanged,
  getRedirectResult,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  storageRef,
  uploadBytes,
  getDownloadURL
};
export default app;
