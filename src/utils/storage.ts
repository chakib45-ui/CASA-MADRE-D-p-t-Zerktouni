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
 * Force synchronization and repair between memory, IndexedDB and localStorage,
 * restoring any items with missing folder, invalid fields, or hidden status.
 */
export async function repairAndSyncLibrary(
  currentMemoryArticles: ArticleItem[],
  defaultArticles: ArticleItem[]
): Promise<{ articles: ArticleItem[]; restoredCount: number; info: string }> {
  const mergedMap = new Map<string, ArticleItem>();

  // 1. Add baseline default articles
  for (const art of defaultArticles) {
    if (art && art.id) {
      mergedMap.set(art.id, { ...art, folder: art.folder || 'Antiquités' });
    }
  }

  // 2. Read all data currently in IndexedDB
  try {
    const idbArticles = await getStoredItem<ArticleItem[]>('casamadre_articles');
    if (Array.isArray(idbArticles)) {
      for (const art of idbArticles) {
        if (art && (art.id || art.name)) {
          const key = art.id || `restored-${Math.random().toString(36).substring(2, 9)}`;
          mergedMap.set(key, { ...art, id: key, folder: art.folder || 'Antiquités' });
        }
      }
    }
  } catch (err) {
    console.warn('Error reading IndexedDB during repair:', err);
  }

  // 3. Check localStorage for any legacy or backup items
  try {
    const keysToCheck = ['casamadre_articles', 'casamadre_articles_backup', 'casamadre_saved_items'];
    for (const k of keysToCheck) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const art of parsed) {
              if (art && (art.id || art.name)) {
                const key = art.id || `restored-local-${Math.random().toString(36).substring(2, 9)}`;
                mergedMap.set(key, { ...art, id: key, folder: art.folder || 'Antiquités' });
              }
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  } catch (err) {
    console.warn('Error checking localStorage during repair:', err);
  }

  // 4. Incorporate current memory articles
  for (const art of currentMemoryArticles) {
    if (art && art.id) {
      mergedMap.set(art.id, { ...art, folder: art.folder || 'Antiquités' });
    }
  }

  // 5. Sanitize and repair every article
  const repairedList: ArticleItem[] = Array.from(mergedMap.values()).map((art, idx) => {
    const id = art.id || `art-${Date.now()}-${idx}`;
    const name = (art.name && art.name.trim()) ? art.name.trim() : `Article sans titre #${idx + 1}`;
    const folder = (art.folder && art.folder.trim()) ? art.folder.trim() : 'Antiquités';
    return {
      ...art,
      id,
      name,
      folder,
      material: art.material || '',
      periodOrStyle: art.periodOrStyle || '',
      condition: art.condition || '',
      dimensions: art.dimensions || '',
      quantity: art.quantity || '1',
      price: art.price || '',
      notes: art.notes || '',
      imageUrl: art.imageUrl || '',
    };
  });

  // 6. Force write to IndexedDB
  await setStoredItem('casamadre_articles', repairedList);

  // 7. Store a lightweight safety copy in localStorage if size permits
  try {
    const miniCopy = repairedList.map(a => ({
      id: a.id,
      name: a.name,
      folder: a.folder,
      ref: a.ref,
      quantity: a.quantity,
      price: a.price,
      // exclude huge image base64 in localStorage to avoid QuotaExceededError
      imageUrl: a.imageUrl?.startsWith('data:') ? '' : a.imageUrl,
    }));
    localStorage.setItem('casamadre_articles_manifest', JSON.stringify(miniCopy));
  } catch {
    // ignore
  }

  const restoredCount = repairedList.length;
  return {
    articles: repairedList,
    restoredCount,
    info: `${restoredCount} articles synchronisés et restaurés dans la base locale (IndexedDB).`,
  };
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
