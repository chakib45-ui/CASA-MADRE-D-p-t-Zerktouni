import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  User
} from 'firebase/auth';
import { 
  initializeFirestore, 
  memoryLocalCache,
  setLogLevel,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  Firestore
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage
} from 'firebase/storage';
import fileConfig from '../../firebase-applet-config.json';

// Resolves configuration with priority to Vite environment variables, falling back to local JSON
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

export const resolvedFirebaseConfig = {
  apiKey: metaEnv?.VITE_FIREBASE_API_KEY || fileConfig.apiKey,
  authDomain: metaEnv?.VITE_FIREBASE_AUTH_DOMAIN || fileConfig.authDomain,
  projectId: metaEnv?.VITE_FIREBASE_PROJECT_ID || fileConfig.projectId,
  storageBucket: metaEnv?.VITE_FIREBASE_STORAGE_BUCKET || fileConfig.storageBucket,
  messagingSenderId: metaEnv?.VITE_FIREBASE_MESSAGING_SENDER_ID || fileConfig.messagingSenderId,
  appId: metaEnv?.VITE_FIREBASE_APP_ID || fileConfig.appId,
  firestoreDatabaseId: metaEnv?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || fileConfig.firestoreDatabaseId,
  oAuthClientId: metaEnv?.VITE_FIREBASE_OAUTH_CLIENT_ID || fileConfig.oAuthClientId,
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(resolvedFirebaseConfig) : getApp();

// Clean up stale Firestore IndexedDB cache that may retain uncommitted write mutation retries
if (typeof window !== 'undefined' && 'indexedDB' in window) {
  try {
    const dbPrefix = `firestore/[DEFAULT]/${resolvedFirebaseConfig.projectId}`;
    ['main', resolvedFirebaseConfig.firestoreDatabaseId].forEach(sub => {
      try {
        indexedDB.deleteDatabase(`${dbPrefix}/${sub}/main`);
        indexedDB.deleteDatabase(`${dbPrefix}/${sub}`);
      } catch {}
    });
    try {
      indexedDB.deleteDatabase(dbPrefix);
    } catch {}
  } catch {}
}

// Initialize Firestore with in-memory cache to prevent background offline retry storms
const targetDatabaseId = resolvedFirebaseConfig.firestoreDatabaseId && resolvedFirebaseConfig.firestoreDatabaseId !== '(default)'
  ? resolvedFirebaseConfig.firestoreDatabaseId
  : undefined;

export const db: Firestore = targetDatabaseId
  ? initializeFirestore(app, { localCache: memoryLocalCache() }, targetDatabaseId)
  : initializeFirestore(app, { localCache: memoryLocalCache() });

// Suppress internal Firestore connection retry logs and backoff delay warnings
try {
  setLogLevel('silent');
} catch {}

// Initialize Firebase Auth with persistent session storage
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {
  // Graceful fallback in non-browser environments
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

/**
 * Connexion via Google Popup (avec repli redirection en cas de blocage)
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error('Redirect sign in failed:', redirectError);
        throw redirectError;
      }
    }
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Connexion par e-mail et mot de passe
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
};

/**
 * Création de compte par e-mail et mot de passe
 */
export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
};

/**
 * Réinitialisation du mot de passe par e-mail
 */
export const resetUserPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

/**
 * Connexion Invité / Démonstration (Lecture Seule)
 */
export const signInAsGuest = async (): Promise<User> => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err: any) {
    console.warn('Anonymous sign in note:', err?.message || err);
    throw err;
  }
};

/**
 * Vérification du résultat d'une redirection Google Auth
 */
export const checkRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.error('getRedirectResult error:', err);
    return null;
  }
};

export const signOutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export {
  onAuthStateChanged,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  storageRef,
  uploadBytes,
  getDownloadURL
};
export type { User };
