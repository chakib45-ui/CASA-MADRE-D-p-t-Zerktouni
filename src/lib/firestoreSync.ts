import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from './firebase';
import { ArticleItem, CatalogConfig, UserRole, UserApprovalRequest } from '../types';

export const ADMIN_EMAIL = 'chakib.45@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}


/**
 * Saves or updates a single article in Firestore for a given user.
 */
export async function syncArticleToFirestore(userId: string, article: ArticleItem): Promise<void> {
  if (!userId || !article?.id) return;
  const articleRef = doc(db, 'users', userId, 'articles', article.id);
  // Ensure undefined fields are replaced with null or empty string to satisfy Firestore
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
  await setDoc(articleRef, sanitizedArticle, { merge: true });
}

/**
 * Syncs the entire articles array to Firestore (e.g. on initial migration or batch operation).
 */
export async function syncAllArticlesToFirestore(userId: string, articles: ArticleItem[]): Promise<void> {
  if (!userId || !Array.isArray(articles)) return;
  const promises = articles.map(article => syncArticleToFirestore(userId, article));
  await Promise.all(promises);
}

/**
 * Deletes an article from Firestore.
 */
export async function deleteArticleFromFirestore(userId: string, articleId: string): Promise<void> {
  if (!userId || !articleId) return;
  const articleRef = doc(db, 'users', userId, 'articles', articleId);
  await deleteDoc(articleRef);
}

/**
 * Loads all articles for a user from Firestore.
 */
export async function fetchUserArticlesFromFirestore(userId: string): Promise<ArticleItem[]> {
  if (!userId) return [];
  const articlesCol = collection(db, 'users', userId, 'articles');
  const snap = await getDocs(articlesCol);
  const items: ArticleItem[] = [];
  snap.forEach(docSnap => {
    const data = docSnap.data();
    items.push({
      id: data.id || docSnap.id,
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
    });
  });
  return items;
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
      snap.forEach(docSnap => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
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
        });
      });
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
  await setDoc(configRef, payload, { merge: true });
}

/**
 * Fetches user catalog config from Firestore.
 */
export async function fetchUserConfigFromFirestore(userId: string): Promise<CatalogConfig | null> {
  if (!userId) return null;
  const configRef = doc(db, 'users', userId, 'config', 'catalog');
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
  if (!user?.uid) return;
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    lastLoginAt: new Date().toISOString()
  }, { merge: true });
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
    // Also ensure admin doc in approvals is marked admin
    try {
      const approvalRef = doc(db, 'user_approvals', user.uid);
      await setDoc(approvalRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Administrateur',
        photoURL: user.photoURL || '',
        status: 'admin',
        requestedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'system'
      }, { merge: true });
    } catch (e) {
      console.warn('Could not update admin approval record:', e);
    }
    return 'admin';
  }

  // Regular user: check /user_approvals/{uid}
  const approvalRef = doc(db, 'user_approvals', user.uid);
  try {
    const snap = await getDoc(approvalRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentStatus = data.status as UserRole;
      // If user was explicitly rejected by admin, respect rejection
      if (currentStatus === 'rejected') return 'rejected';
      // If marked admin, grant admin
      if (currentStatus === 'admin') return 'admin';
      // Otherwise active approved reader
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
        reviewedBy: 'auto-approval'
      };
      await setDoc(approvalRef, newRequest, { merge: true });
      return 'approved';
    }
  } catch (err) {
    console.warn('Note in checkOrCreateUserApproval, defaulting to approved reader:', err);
    return 'approved';
  }
}

/**
 * Subscribes to real-time status changes for a specific user.
 * Allows instant unlocking when admin clicks 'Approuver'.
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
        onUpdate((data.status as UserRole) || 'pending');
      } else {
        onUpdate('pending');
      }
    },
    err => {
      console.warn('Approval snapshot error:', err);
    }
  );
}

/**
 * Subscribes to all approval requests (for Admin dashboard).
 */
export function subscribeToAllApprovals(
  onUpdate: (requests: UserApprovalRequest[]) => void
): () => void {
  const colRef = collection(db, 'user_approvals');
  return onSnapshot(
    colRef,
    snap => {
      const list: UserApprovalRequest[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.uid) {
          list.push({
            uid: data.uid,
            email: data.email || '',
            displayName: data.displayName || '',
            photoURL: data.photoURL || '',
            status: (data.status as UserRole) || 'pending',
            requestedAt: data.requestedAt || '',
            reviewedAt: data.reviewedAt || '',
            reviewedBy: data.reviewedBy || ''
          });
        }
      });
      // Sort newest requested first
      list.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
      onUpdate(list);
    },
    err => {
      console.warn('subscribeToAllApprovals error:', err);
    }
  );
}

/**
 * Admin action to approve or reject a user request.
 */
export async function updateUserApproval(
  targetUid: string,
  newStatus: UserRole,
  adminEmail: string
): Promise<void> {
  if (!targetUid) return;
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
}

