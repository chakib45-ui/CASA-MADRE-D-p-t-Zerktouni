// firebase.js - Configuration Firebase réutilisable pour CASA MADRE - Dépôt Zerktouni
// Compatible ES Modules & Vanilla JS / Netlify Functions
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialisation unique de l'application Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialisation de Firebase Authentication
export const auth = getAuth(app);

// Provider Google configuré pour la sélection de compte
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialisation de la base de données Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Connexion avec Google via popup (avec fallback redirect)
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
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot
};
