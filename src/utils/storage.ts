import { ArticleItem, CatalogConfig } from '../types';

const DB_NAME = 'CasaMadreAntiquesDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result : null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB, trying localStorage fallback', err);
    try {
      const fallback = localStorage.getItem(key);
      return fallback ? JSON.parse(fallback) : null;
    } catch {
      return null;
    }
  }
}

export async function setStoredItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not write to IndexedDB, trying localStorage fallback', err);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (localErr) {
      console.warn('Storage quota reached in localStorage fallback too', localErr);
    }
  }
}

/**
 * Migrates data from localStorage to IndexedDB and cleans up localStorage to free quota.
 */
export async function migrateFromLocalStorage(): Promise<ArticleItem[] | null> {
  try {
    const localArticles = localStorage.getItem('casamadre_articles');
    if (localArticles) {
      const parsed = JSON.parse(localArticles) as ArticleItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        await setStoredItem('casamadre_articles', parsed);
        // Safely remove the large payload from localStorage to free browser storage quota
        try {
          localStorage.removeItem('casamadre_articles');
        } catch {
          // ignore
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error migrating from localStorage', err);
  }
  return null;
}
