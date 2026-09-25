import {
  db,
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
  addDoc
} from './firebase';
import { ArticleItem, CatalogConfig, UserRole, UserApprovalRequest, AccessLogEntry, SecurityConfig } from '../types';

export const ADMIN_EMAIL = 'chakib.45@gmail.com';
export const DEFAULT_PIN = '0045';

// Circuit breaker for Firestore quota exhaustion with persistence across page reloads
function checkInitialQuota(): boolean {
  try {
    const saved = localStorage.getItem('casamadre_firestore_quota_exceeded');
    if (saved) {
      const timestamp = parseInt(saved, 10);
      // Quotas in Firebase Spark reset at midnight PST (~8-12 hours)
      if (Date.now() - timestamp < 12 * 60 * 60 * 1000) {
        return true;
      } else {
        localStorage.removeItem('casamadre_firestore_quota_exceeded');
      }
    }
  } catch {}
  return false;
}

let isWriteQuotaExceeded = checkInitialQuota();
const quotaListeners: Array<(exceeded: boolean) => void> = [];
const pinListeners: Array<(pin: string) => void> = [];

export function isFirestoreQuotaExceeded(): boolean {
  return isWriteQuotaExceeded;
}

export function resetQuotaStatus(): void {
  isWriteQuotaExceeded = false;
  try {
    localStorage.removeItem('casamadre_firestore_quota_exceeded');
  } catch {}
  quotaListeners.forEach(l => l(false));
}

export function subscribeToQuotaStatus(listener: (exceeded: boolean) => void): () => void {
  quotaListeners.push(listener);
  listener(isWriteQuotaExceeded);
  return () => {
    const idx = quotaListeners.indexOf(listener);
    if (idx !== -1) quotaListeners.splice(idx, 1);
  };
}

export function handleQuotaExceeded(err: any): boolean {
  const msg = err?.message || String(err);
  const code = err?.code;
  if (
    code === 'resource-exhausted' ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota')
  ) {
    if (!isWriteQuotaExceeded) {
      isWriteQuotaExceeded = true;
      try {
        localStorage.setItem('casamadre_firestore_quota_exceeded', String(Date.now()));
      } catch {}
      console.warn('⚡ Quota quotidien d’écriture Firestore atteint. Bascule transparente en mode persistance locale ultra-rapide.');
      quotaListeners.forEach(l => l(true));
    }
    return true;
  }
  return false;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Saves or updates a single article in Firestore for a given user and the shared inventory.
 */
export async function syncArticleToFirestore(userId: string, article: ArticleItem): Promise<void> {
  if (!userId || !article?.id || isWriteQuotaExceeded) return;
  try {
    const sanitizedArticle = {
      id: article.id,
      ref: article.ref || '',
      name: article.name || '',
      imageUrl: article.imageUrl || '',
      imageFit: article.imageFit || 'contain',
      folder: article.folder || 'Antiquités',
      category: article.category || '',
      material: article.material || '',
      periodOrStyle: article.periodOrStyle || '',
      condition: article.condition || '',
      dimensions: article.dimensions || '',
      quantity: article.quantity || '1 unit.',
      price: article.price || '',
      notes: article.notes || '',
      userId,
      updatedAt: new Date().toISOString()
    };

    // 1. Enregistrement dans l'espace utilisateur
    const articleRef = doc(db, 'users', userId, 'articles', article.id);
    await setDoc(articleRef, sanitizedArticle, { merge: true });

    // 2. Enregistrement miroir dans la collection d'inventaire globale pour tous les lecteurs
    try {
      const invRef = doc(db, 'inventory', article.id);
      await setDoc(invRef, sanitizedArticle, { merge: true });
    } catch {
      // Tolérance si inventaire global indisponible
    }
  } catch (err) {
    if (handleQuotaExceeded(err)) {
      return; // Handled gracefully, local DB will preserve data
    }
    console.warn('syncArticleToFirestore error:', err);
  }
}

/**
 * Syncs the entire articles array to Firestore (e.g. on initial migration or batch operation).
 */
export async function syncAllArticlesToFirestore(userId: string, articles: ArticleItem[]): Promise<void> {
  if (!userId || !Array.isArray(articles) || isWriteQuotaExceeded) return;
  try {
    const promises = articles.map(article => syncArticleToFirestore(userId, article));
    await Promise.all(promises);
  } catch (err) {
    if (handleQuotaExceeded(err)) {
      return;
    }
    console.warn('syncAllArticlesToFirestore error:', err);
  }
}

/**
 * Deletes an article from Firestore.
 */
export async function deleteArticleFromFirestore(userId: string, articleId: string): Promise<void> {
  if (!userId || !articleId || isWriteQuotaExceeded) return;
  try {
    const articleRef = doc(db, 'users', userId, 'articles', articleId);
    await deleteDoc(articleRef);

    try {
      const invRef = doc(db, 'inventory', articleId);
      await deleteDoc(invRef);
    } catch {}
  } catch (err) {
    if (handleQuotaExceeded(err)) {
      return;
    }
    console.warn('deleteArticleFromFirestore error:', err);
  }
}

/**
 * Helper to parse an article document snapshot into ArticleItem
 */
function parseArticleDoc(docId: string, data: any): ArticleItem {
  return {
    id: data.id || docId,
    ref: data.ref || '',
    name: data.name || '',
    imageUrl: data.imageUrl || '',
    imageFit: data.imageFit || 'contain',
    folder: data.folder || 'Antiquités',
    category: data.category || '',
    material: data.material || '',
    periodOrStyle: data.periodOrStyle || '',
    condition: data.condition || '',
    dimensions: data.dimensions || '',
    quantity: data.quantity || '1 unit.',
    price: data.price || '',
    notes: data.notes || ''
  };
}

/**
 * Loads all articles for a user from Firestore.
 * If user has no articles, seamlessly pulls from shared inventory or admin account
 * so all authenticated users (readers, colleagues, clients) access the full catalog.
 */
export async function fetchUserArticlesFromFirestore(userId: string): Promise<ArticleItem[]> {
  if (!userId) return [];

  // 1. Charger la collection personnelle de l'utilisateur
  try {
    const articlesCol = collection(db, 'users', userId, 'articles');
    const snap = await getDocs(articlesCol);
    if (!snap.empty) {
      const items: ArticleItem[] = [];
      snap.forEach(docSnap => items.push(parseArticleDoc(docSnap.id, docSnap.data())));
      if (items.length > 0) return items;
    }
  } catch (e) {
    handleQuotaExceeded(e);
  }

  // 2. Si vide, vérifier la collection partagée 'inventory'
  try {
    const invCol = collection(db, 'inventory');
    const invSnap = await getDocs(invCol);
    if (!invSnap.empty) {
      const items: ArticleItem[] = [];
      invSnap.forEach(docSnap => items.push(parseArticleDoc(docSnap.id, docSnap.data())));
      if (items.length > 0) return items;
    }
  } catch (e) {
    handleQuotaExceeded(e);
  }

  // 3. Si toujours vide, chercher la collection du compte Administrateur
  try {
    const approvalsSnap = await getDocs(collection(db, 'user_approvals'));
    let adminUid: string | null = null;
    approvalsSnap.forEach(d => {
      const data = d.data();
      if (data?.email && isAdminEmail(data.email)) {
        adminUid = d.id || data.uid;
      }
    });

    if (!adminUid) {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(d => {
        const data = d.data();
        if (data?.email && isAdminEmail(data.email)) {
          adminUid = d.id || data.uid;
        }
      });
    }

    if (adminUid && adminUid !== userId) {
      const adminArticlesCol = collection(db, 'users', adminUid, 'articles');
      const adminSnap = await getDocs(adminArticlesCol);
      if (!adminSnap.empty) {
        const items: ArticleItem[] = [];
        adminSnap.forEach(docSnap => items.push(parseArticleDoc(docSnap.id, docSnap.data())));
        if (items.length > 0) return items;
      }
    }
  } catch (e) {
    handleQuotaExceeded(e);
  }

  return [];
}

/**
 * Real-time listener for user articles.
 */
export function subscribeToUserArticles(
  userId: string,
  onUpdate: (articles: ArticleItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) return () => {};
  const articlesCol = collection(db, 'users', userId, 'articles');
  return onSnapshot(
    articlesCol,
    snap => {
      const items: ArticleItem[] = [];
      snap.forEach(docSnap => items.push(parseArticleDoc(docSnap.id, docSnap.data())));
      onUpdate(items);
    },
    err => {
      console.error('Firestore articles snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Saves catalog config to Firestore.
 */
export async function syncConfigToFirestore(userId: string, config: CatalogConfig): Promise<void> {
  if (!userId || !config) return;
  const configRef = doc(db, 'users', userId, 'config', 'catalog');
  const payload = {
    userId,
    mainTitle: config.mainTitle || 'CASA MADRE',
    subtitle: config.subtitle || 'Dépôt Zerktouni',
    collection: config.collection || '',
    activeFolder: config.activeFolder || 'Antiquités',
    folders: config.folders || ['Antiquités', 'Halloween'],
    contactInfo: config.contactInfo || '',
    dateStr: config.dateStr || '',
    catalogRef: config.catalogRef || '',
    layoutMode: config.layoutMode || '2-per-page',
    themeId: config.themeId || 'clair',
    showPrices: !!config.showPrices,
    showDimensions: !!config.showDimensions,
    showReference: !!config.showReference,
    headerEveryPage: config.headerEveryPage !== false,
    notesFooter: config.notesFooter || '',
    cleanScanEffect: config.cleanScanEffect !== false,
    uiDarkMode: !!config.uiDarkMode,
    updatedAt: new Date().toISOString()
  };
  if (isWriteQuotaExceeded) return;
  try {
    await setDoc(configRef, payload, { merge: true });
  } catch (err) {
    if (handleQuotaExceeded(err)) return;
    console.warn('syncConfigToFirestore remote write note:', err);
  }
}

/**
 * Fetches user catalog config from Firestore.
 */
export async function fetchUserConfigFromFirestore(userId: string): Promise<CatalogConfig | null> {
  if (!userId) return null;
  const configRef = doc(db, 'users', userId, 'config', 'catalog');
  try {
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        mainTitle: data.mainTitle || 'CASA MADRE',
        subtitle: data.subtitle || 'Dépôt Zerktouni',
        collection: data.collection || '',
        activeFolder: data.activeFolder || 'Antiquités',
        folders: Array.isArray(data.folders) && data.folders.length > 0 ? data.folders : ['Antiquités', 'Halloween'],
        contactInfo: data.contactInfo || '',
        dateStr: data.dateStr || '',
        catalogRef: data.catalogRef || '',
        layoutMode: data.layoutMode || '2-per-page',
        themeId: data.themeId || 'clair',
        showPrices: !!data.showPrices,
        showDimensions: !!data.showDimensions,
        showReference: !!data.showReference,
        headerEveryPage: data.headerEveryPage !== false,
        notesFooter: data.notesFooter || '',
        cleanScanEffect: data.cleanScanEffect !== false,
        uiDarkMode: !!data.uiDarkMode
      };
    }
  } catch (e) {
    handleQuotaExceeded(e);
  }
  return null;
}

/**
 * Real-time listener for user catalog config.
 */
export function subscribeToUserConfig(
  userId: string,
  onUpdate: (config: CatalogConfig) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) return () => {};
  const configRef = doc(db, 'users', userId, 'config', 'catalog');
  return onSnapshot(
    configRef,
    snap => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          mainTitle: data.mainTitle || 'CASA MADRE',
          subtitle: data.subtitle || 'Dépôt Zerktouni',
          collection: data.collection || '',
          activeFolder: data.activeFolder || 'Antiquités',
          folders: Array.isArray(data.folders) && data.folders.length > 0 ? data.folders : ['Antiquités', 'Halloween'],
          contactInfo: data.contactInfo || '',
          dateStr: data.dateStr || '',
          catalogRef: data.catalogRef || '',
          layoutMode: data.layoutMode || '2-per-page',
          themeId: data.themeId || 'clair',
          showPrices: !!data.showPrices,
          showDimensions: !!data.showDimensions,
          showReference: !!data.showReference,
          headerEveryPage: data.headerEveryPage !== false,
          notesFooter: data.notesFooter || '',
          cleanScanEffect: data.cleanScanEffect !== false,
          uiDarkMode: !!data.uiDarkMode
        });
      }
    },
    err => {
      console.error('Firestore config snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Ensures user doc exists in /users/{userId}
 */
export async function syncUserProfile(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }): Promise<void> {
  if (!user?.uid || isWriteQuotaExceeded) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      lastLoginAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    if (handleQuotaExceeded(err)) return;
    console.warn('syncUserProfile note:', err);
  }
}

/**
 * Checks or registers a user approval status.
 * If user is chakib.45@gmail.com -> immediately 'admin'.
 * Otherwise, creates or retrieves request in /user_approvals/{uid}, defaulting to 'approved' reader.
 */
export async function checkOrCreateUserApproval(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<UserRole> {
  if (!user?.uid) return 'approved';

  // Admin bypass
  if (isAdminEmail(user.email)) {
    if (!isWriteQuotaExceeded) {
      try {
        const approvalRef = doc(db, 'user_approvals', user.uid);
        await setDoc(approvalRef, {
          uid: user.uid,
          email: user.email || ADMIN_EMAIL,
          displayName: user.displayName || 'Chakib (Admin)',
          photoURL: user.photoURL || '',
          status: 'admin',
          requestedAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Système',
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        if (!handleQuotaExceeded(e)) {
          console.warn('Could not update admin approval record:', e);
        }
      }
    }
    return 'admin';
  }

  if (isWriteQuotaExceeded) {
    return 'approved';
  }

  // Regular user: check /user_approvals/{uid}
  const approvalRef = doc(db, 'user_approvals', user.uid);
  try {
    const snap = await getDoc(approvalRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentStatus = data.status as UserRole;
      if (!isWriteQuotaExceeded) {
        try {
          await setDoc(approvalRef, {
            lastLoginAt: new Date().toISOString(),
            loginCount: ((data.loginCount || 0) + 1)
          }, { merge: true });
        } catch (e) {
          handleQuotaExceeded(e);
        }
      }

      if (currentStatus === 'rejected') return 'rejected';
      if (currentStatus === 'admin') return 'admin';
      return 'approved';
    } else {
      // First time sign-in: create approved reader record so login never blocks
      const newRequest: UserApprovalRequest = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Lecteur'),
        photoURL: user.photoURL || '',
        status: 'approved',
        requestedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'auto-approval',
        lastLoginAt: new Date().toISOString(),
        loginCount: 1
      };
      if (!isWriteQuotaExceeded) {
        try {
          await setDoc(approvalRef, newRequest, { merge: true });
        } catch (e) {
          handleQuotaExceeded(e);
        }
      }
      return 'approved';
    }
  } catch (err) {
    handleQuotaExceeded(err);
    console.warn('Note in checkOrCreateUserApproval, defaulting to approved reader:', err);
    return 'approved';
  }
}

/**
 * Subscribes to real-time status changes for a specific user.
 * Guarantees that users are NOT falsely placed into 'pending' if the document hasn't been created yet.
 */
export function subscribeToUserApproval(
  uid: string,
  userEmail: string | null | undefined,
  onUpdate: (status: UserRole) => void
): () => void {
  if (!uid) return () => {};
  if (isAdminEmail(userEmail)) {
    onUpdate('admin');
    return () => {};
  }

  const approvalRef = doc(db, 'user_approvals', uid);
  return onSnapshot(
    approvalRef,
    snap => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate((data.status as UserRole) || 'approved');
      } else {
        // Essential fix: default to 'approved' reader so users are not blocked!
        onUpdate('approved');
      }
    },
    err => {
      console.warn('Approval snapshot note, keeping active access:', err?.message || err);
      onUpdate('approved');
    }
  );
}

/**
 * Subscribes to all approval requests (for Admin dashboard).
 * Combines both /user_approvals and /users collections, and guarantees Admin is always listed.
 */
export function subscribeToAllApprovals(
  onUpdate: (requests: UserApprovalRequest[]) => void
): () => void {
  const colRef = collection(db, 'user_approvals');

  const ensureAdmin = (list: UserApprovalRequest[]): UserApprovalRequest[] => {
    const hasAdmin = list.some(r => isAdminEmail(r.email));
    if (!hasAdmin) {
      list.unshift({
        uid: 'admin-chakib-fixed',
        email: ADMIN_EMAIL,
        displayName: 'Chakib (Admin)',
        photoURL: '',
        status: 'admin',
        requestedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Système',
        lastLoginAt: new Date().toISOString(),
        loginCount: 1
      });
    }
    return list;
  };

  return onSnapshot(
    colRef,
    async snap => {
      const map = new Map<string, UserApprovalRequest>();

      // 1. Process user_approvals
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const uid = data.uid || docSnap.id;
        if (uid) {
          map.set(uid, {
            uid,
            email: data.email || '',
            displayName: data.displayName || '',
            photoURL: data.photoURL || '',
            status: (data.status as UserRole) || 'approved',
            requestedAt: data.requestedAt || '',
            reviewedAt: data.reviewedAt || '',
            reviewedBy: data.reviewedBy || '',
            lastLoginAt: data.lastLoginAt || '',
            loginCount: data.loginCount || 1
          });
        }
      });

      // 2. Also check /users to ensure all registered accounts appear
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(uDoc => {
          const uData = uDoc.data();
          const uid = uDoc.id;
          if (!map.has(uid) && (uData.email || uData.displayName)) {
            const isUserAdmin = isAdminEmail(uData.email);
            map.set(uid, {
              uid,
              email: uData.email || '',
              displayName: uData.displayName || (uData.email ? uData.email.split('@')[0] : 'Utilisateur'),
              photoURL: uData.photoURL || '',
              status: isUserAdmin ? 'admin' : ((uData.role as UserRole) || 'approved'),
              requestedAt: uData.lastLoginAt || new Date().toISOString(),
              lastLoginAt: uData.lastLoginAt || '',
              loginCount: 1
            });
          }
        });
      } catch {
        // Continue if secondary query fails
      }

      let list = ensureAdmin(Array.from(map.values()));

      // Sort: Admin first, then newest
      list.sort((a, b) => {
        if (a.status === 'admin' && b.status !== 'admin') return -1;
        if (b.status === 'admin' && a.status !== 'admin') return 1;
        return (b.requestedAt || '').localeCompare(a.requestedAt || '');
      });

      onUpdate(list);
    },
    err => {
      console.warn('subscribeToAllApprovals error, falling back with admin:', err);
      onUpdate(ensureAdmin([]));
    }
  );
}

/**
 * Admin action to approve or reject a user request.
 */
export async function updateUserApproval(
  targetUid: string,
  newStatus: UserRole,
  adminEmail: string,
  targetEmail?: string
): Promise<void> {
  if (!targetUid) return;
  if (!isWriteQuotaExceeded) {
    try {
      const approvalRef = doc(db, 'user_approvals', targetUid);
      await setDoc(
        approvalRef,
        {
          status: newStatus,
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminEmail
        },
        { merge: true }
      );
    } catch (err) {
      handleQuotaExceeded(err);
    }
  }

  // Log action
  await logAccessEvent({
    uid: targetUid,
    email: targetEmail || 'utilisateur',
    displayName: targetEmail ? targetEmail.split('@')[0] : 'Utilisateur',
    role: newStatus,
    action: 'approval_change',
    details: `Statut modifié à [${newStatus}] par l'administrateur (${adminEmail})`
  });
}

/**
 * Records an access or security event in Firestore and local history.
 */
export async function logAccessEvent(event: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: UserRole;
  action: 'login' | 'approval_change' | 'pin_unlock' | 'pin_change' | 'logout' | 'demo_access';
  details?: string;
}): Promise<void> {
  const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const entry: AccessLogEntry = {
    id: logId,
    uid: event.uid || 'anonyme',
    email: event.email || 'visiteur@casamadre.fr',
    displayName: event.displayName || (event.email ? event.email.split('@')[0] : 'Visiteur'),
    role: event.role || 'approved',
    action: event.action,
    details: event.details || '',
    timestamp: new Date().toISOString()
  };

  // Cache locally
  try {
    const raw = localStorage.getItem('casamadre_access_logs');
    const existing: AccessLogEntry[] = raw ? JSON.parse(raw) : [];
    existing.unshift(entry);
    localStorage.setItem('casamadre_access_logs', JSON.stringify(existing.slice(0, 150)));
  } catch {
    // Ignore local storage quota errors
  }

  // Save to Firestore only if quota permits
  if (!isWriteQuotaExceeded) {
    try {
      const logDoc = doc(db, 'access_logs', logId);
      await setDoc(logDoc, entry);
    } catch (e) {
      if (!handleQuotaExceeded(e)) {
        console.warn('logAccessEvent firestore write note:', e);
      }
    }
  }
}

/**
 * Subscribes to the real-time access history log (combining Firestore & local cache).
 */
export function subscribeToAccessLogs(onUpdate: (logs: AccessLogEntry[]) => void): () => void {
  let localLogs: AccessLogEntry[] = [];
  try {
    const raw = localStorage.getItem('casamadre_access_logs');
    if (raw) localLogs = JSON.parse(raw);
  } catch {
    localLogs = [];
  }

  if (localLogs.length > 0) {
    onUpdate(localLogs);
  }

  const logsCol = collection(db, 'access_logs');
  return onSnapshot(
    logsCol,
    snap => {
      const remoteLogs: AccessLogEntry[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.action && data.timestamp) {
          remoteLogs.push({
            id: docSnap.id,
            uid: data.uid || '',
            email: data.email || '',
            displayName: data.displayName || '',
            role: (data.role as UserRole) || 'approved',
            action: data.action,
            details: data.details || '',
            timestamp: data.timestamp
          });
        }
      });

      // Merge remote and local
      const map = new Map<string, AccessLogEntry>();
      localLogs.forEach(l => map.set(l.id, l));
      remoteLogs.forEach(l => map.set(l.id, l));

      const merged = Array.from(map.values()).sort(
        (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
      );

      try {
        localStorage.setItem('casamadre_access_logs', JSON.stringify(merged.slice(0, 150)));
      } catch {}

      onUpdate(merged);
    },
    err => {
      console.warn('subscribeToAccessLogs error, using local fallback:', err);
      onUpdate(localLogs);
    }
  );
}

/**
 * Fetches the current authorization PIN code.
 */
export async function fetchSecurityPin(): Promise<string> {
  try {
    const pinDoc = await getDoc(doc(db, 'app_config', 'security'));
    if (pinDoc.exists()) {
      const data = pinDoc.data();
      if (data?.pinCode) {
        localStorage.setItem('casamadre_admin_pin', data.pinCode);
        return data.pinCode;
      }
    }
  } catch (err) {
    console.warn('fetchSecurityPin firestore fallback:', err);
  }
  return localStorage.getItem('casamadre_admin_pin') || DEFAULT_PIN;
}

/**
 * Updates the authorization PIN code (Admin action).
 */
export async function updateSecurityPin(newPin: string, adminEmail: string): Promise<boolean> {
  const cleanPin = newPin.trim();
  if (!cleanPin || cleanPin.length < 4 || cleanPin.length > 8 || !/^\d+$/.test(cleanPin)) {
    throw new Error('Le code PIN doit comporter entre 4 et 8 chiffres numériques.');
  }

  if (!isWriteQuotaExceeded) {
    try {
      const secRef = doc(db, 'app_config', 'security');
      await setDoc(
        secRef,
        {
          pinCode: cleanPin,
          updatedAt: new Date().toISOString(),
          updatedBy: adminEmail
        },
        { merge: true }
      );
    } catch (err) {
      if (!handleQuotaExceeded(err)) {
        console.warn('updateSecurityPin remote error, saved locally:', err);
      }
    }
  }

  localStorage.setItem('casamadre_admin_pin', cleanPin);
  pinListeners.forEach(fn => fn(cleanPin));

  await logAccessEvent({
    uid: 'admin',
    email: adminEmail,
    displayName: 'Administrateur',
    role: 'admin',
    action: 'pin_change',
    details: `Nouveau code PIN d'autorisation configuré (${cleanPin.replace(/./g, '•')})`
  });

  return true;
}

/**
 * Subscribes to real-time updates for authorization PIN code.
 */
export function subscribeToSecurityPin(onUpdate: (pin: string) => void): () => void {
  pinListeners.push(onUpdate);
  const initialPin = localStorage.getItem('casamadre_admin_pin') || DEFAULT_PIN;
  onUpdate(initialPin);

  const secRef = doc(db, 'app_config', 'security');
  const unsubscribeFirestore = onSnapshot(
    secRef,
    snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.pinCode) {
          localStorage.setItem('casamadre_admin_pin', data.pinCode);
          onUpdate(data.pinCode);
          return;
        }
      }
      onUpdate(localStorage.getItem('casamadre_admin_pin') || DEFAULT_PIN);
    },
    err => {
      console.warn('subscribeToSecurityPin listener note:', err?.message || err);
      onUpdate(localStorage.getItem('casamadre_admin_pin') || DEFAULT_PIN);
    }
  );

  return () => {
    const idx = pinListeners.indexOf(onUpdate);
    if (idx !== -1) pinListeners.splice(idx, 1);
    unsubscribeFirestore();
  };
}
