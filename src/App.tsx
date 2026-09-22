import React, { useState, useEffect, useRef } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { ArticleItem, CatalogConfig, UserProfile, UserRole, UserApprovalRequest } from './types';
import { INITIAL_ARTICLES, DEFAULT_CONFIG } from './data/defaultCatalog';
import { Header } from './components/Header';
import { FolderControlBar } from './components/FolderControlBar';
import { FolderCreateModal } from './components/FolderCreateModal';
import { FolderEditModal } from './components/FolderEditModal';
import { ExportChoiceModal } from './components/ExportChoiceModal';
import { CatalogControls } from './components/CatalogControls';
import { InventorySidebar } from './components/InventorySidebar';
import { CatalogPreview } from './components/CatalogPreview';
import { ArticleEditorModal } from './components/ArticleEditorModal';
import { BatchUploadModal } from './components/BatchUploadModal';
import { HeaderSettingsModal } from './components/HeaderSettingsModal';
import { PrintModal } from './components/PrintModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { LockScreen } from './components/LockScreen';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { PinModal } from './components/PinModal';
import { UserManagementModal } from './components/UserManagementModal';
import { exportCatalogToPDF, printCatalogViaBrowser } from './utils/pdfExport';
import { exportCatalogToExcel } from './utils/excelExport';
import { getStoredItem, setStoredItem, migrateFromLocalStorage, repairAndSyncLibrary } from './utils/storage';
import { isImageFile, extractFilesFromDataTransfer } from './utils/imageOptimizer';
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChanged 
} from './lib/firebase';
import { 
  syncUserProfile, 
  syncArticleToFirestore, 
  syncAllArticlesToFirestore, 
  deleteArticleFromFirestore, 
  syncConfigToFirestore, 
  fetchUserArticlesFromFirestore, 
  fetchUserConfigFromFirestore,
  checkOrCreateUserApproval,
  subscribeToUserApproval,
  subscribeToAllApprovals,
  isAdminEmail,
  ADMIN_EMAIL
} from './lib/firestoreSync';


export default function App() {
  const [articles, setArticles] = useState<ArticleItem[]>(INITIAL_ARTICLES);
  const [config, setConfig] = useState<CatalogConfig>(DEFAULT_CONFIG);
  const isLoadedRef = useRef(false);

  // Firebase Auth state & Sync status
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const userRef = useRef<UserProfile | null>(null);
  userRef.current = currentUser;

  // Roles & Security state
  const [userRole, setUserRole] = useState<UserRole>('pending');
  const [approvalRequests, setApprovalRequests] = useState<UserApprovalRequest[]>([]);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // PIN 0045 Security for modifications
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinActionTitle, setPinActionTitle] = useState('Modification du catalogue');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  const isAdmin = userRole === 'admin' || (currentUser?.email ? isAdminEmail(currentUser.email) : false);

  const executeWithPinProtection = (action: () => void, title = 'Modification') => {
    if (isAdmin || isPinUnlocked) {
      action();
    } else {
      setPinActionTitle(title);
      setPendingAction(() => action);
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsPinUnlocked(true);
    showToast('Code 0045 validé : Mode modification déverrouillé');
    if (pendingAction) {
      const act = pendingAction;
      setPendingAction(null);
      act();
    }
  };

  // Folder modals state
  const [isFolderCreateOpen, setIsFolderCreateOpen] = useState(false);
  const [isFolderEditOpen, setIsFolderEditOpen] = useState(false);

  // Export choice modal
  const [isExportChoiceOpen, setIsExportChoiceOpen] = useState(false);
  const [exportChoiceType, setExportChoiceType] = useState<'pdf' | 'excel'>('pdf');

  // Modals state
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [initialFilesForBatch, setInitialFilesForBatch] = useState<File[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHeaderSettingsOpen, setIsHeaderSettingsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [viewingImageArticle, setViewingImageArticle] = useState<ArticleItem | null>(null);
  const [isDragOverWindow, setIsDragOverWindow] = useState(false);

  // Global search bar state (Header)
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // État d'affichage de la barre latérale des articles (Masqué / Montré)
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);

  // PDF generation state
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubscribeApprovals: (() => void) | null = null;
    let unsubscribeMyApproval: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      setAuthError(null);

      if (unsubscribeApprovals) {
        unsubscribeApprovals();
        unsubscribeApprovals = null;
      }
      if (unsubscribeMyApproval) {
        unsubscribeMyApproval();
        unsubscribeMyApproval = null;
      }

      if (user) {
        const isUserAdmin = isAdminEmail(user.email);
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: isUserAdmin ? 'admin' : 'pending'
        };
        setCurrentUser(profile);
        userRef.current = profile;

        try {
          // Record/update user doc in Firestore
          await syncUserProfile(profile);

          // Check or create approval request in Firestore
          const role = await checkOrCreateUserApproval(profile);
          setUserRole(role);
          profile.role = role;
          setCurrentUser({ ...profile });

          if (role === 'admin') {
            // Admin: subscribe to all user approval requests for real-time dashboard
            unsubscribeApprovals = subscribeToAllApprovals((reqs) => {
              setApprovalRequests(reqs);
            });
          } else if (role === 'pending') {
            // Pending reader: subscribe to own status update so screen unlocks automatically when admin approves
            unsubscribeMyApproval = subscribeToUserApproval(user.uid, user.email, (newStatus) => {
              setUserRole(newStatus);
              setCurrentUser(prev => prev ? { ...prev, role: newStatus } : null);
              if (newStatus === 'approved') {
                showToast('Votre accès lecteur a été approuvé par l’administrateur !');
              }
            });
          }

          // Fetch remote articles and config if approved or admin
          if (role === 'admin' || role === 'approved') {
            setSyncStatus('syncing');
            const remoteArticles = await fetchUserArticlesFromFirestore(user.uid);
            const remoteConfig = await fetchUserConfigFromFirestore(user.uid);

            if (remoteArticles && remoteArticles.length > 0) {
              setArticles(remoteArticles);
              await setStoredItem('casamadre_articles', remoteArticles);
            } else {
              // Sync current local articles to Firestore
              const localArticles = await getStoredItem<ArticleItem[]>('casamadre_articles') || articles;
              if (localArticles && localArticles.length > 0) {
                await syncAllArticlesToFirestore(user.uid, localArticles);
              }
            }

            if (remoteConfig) {
              setConfig(remoteConfig);
              await setStoredItem('casamadre_config', remoteConfig);
            } else {
              await syncConfigToFirestore(user.uid, config);
            }

            setSyncStatus('synced');
            showToast(role === 'admin' 
              ? `Bienvenue Administrateur : ${user.displayName || user.email}`
              : `Bienvenue : ${user.displayName || user.email}`
            );
          }
        } catch (err: any) {
          console.error('Error on auth login sync:', err);
          setSyncStatus('error');
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setCurrentUser(null);
        userRef.current = null;
        setUserRole('pending');
        setApprovalRequests([]);
        setIsPinUnlocked(false);
        setSyncStatus('offline');
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeApprovals) unsubscribeApprovals();
      if (unsubscribeMyApproval) unsubscribeMyApproval();
    };
  }, []);

  // Google sign in / out handlers
  const handleSignIn = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setIsAuthLoading(false);
      setAuthError('Échec de connexion Google. Veuillez réessayer.');
      showToast('Échec de connexion Google. Veuillez réessayer.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      userRef.current = null;
      setUserRole('pending');
      setIsPinUnlocked(false);
      setSyncStatus('offline');
      showToast('Déconnexion réussie');
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  const handleCheckApproval = async () => {
    if (!currentUser?.uid) return;
    try {
      setIsCheckingApproval(true);
      const role = await checkOrCreateUserApproval(currentUser);
      setUserRole(role);
      setCurrentUser(prev => prev ? { ...prev, role } : null);
      if (role === 'approved') {
        showToast('Votre accès lecteur est maintenant approuvé !');
      } else if (role === 'pending') {
        showToast('Demande toujours en attente de validation par l’administrateur.');
      } else if (role === 'rejected') {
        showToast('Votre demande a été refusée par l’administrateur.');
      }
    } catch (err) {
      console.error('Error refreshing approval status:', err);
    } finally {
      setIsCheckingApproval(false);
    }
  };


  const handleManualSync = async () => {
    if (!currentUser) {
      showToast('Connectez-vous pour synchroniser avec Firestore Cloud');
      return;
    }
    try {
      setSyncStatus('syncing');
      await syncAllArticlesToFirestore(currentUser.uid, articles);
      await syncConfigToFirestore(currentUser.uid, config);
      setSyncStatus('synced');
      showToast('Tous les articles ont été synchronisés avec Firestore');
    } catch (err) {
      console.error('Manual sync failed:', err);
      setSyncStatus('error');
      showToast('Erreur lors de la synchronisation cloud');
    }
  };

  // Initial load from IndexedDB with migration from localStorage
  useEffect(() => {
    async function loadData() {
      try {
        const sanitizeArticleItem = (art: ArticleItem): ArticleItem => {
          let name = art.name;
          if (!name || /whatsapp\s*image/i.test(name) || name.includes('23.15.51')) {
            name = "Article d'Antiquité";
          }
          let periodOrStyle = art.periodOrStyle;
          if (periodOrStyle && /style et époque préservés/i.test(periodOrStyle)) {
            periodOrStyle = '';
          }
          let material = art.material;
          if (material && /matière et patine d'origine/i.test(material)) {
            material = '';
          }
          let ref = art.ref;
          if (ref === 'CM-0001' || ref === 'CM-0002') {
            ref = '';
          }
          // Default unassigned articles to 'Antiquités'
          const folder = art.folder || 'Antiquités';
          return { ...art, name, periodOrStyle, material, ref, folder };
        };

        // 1. Try to migrate any legacy data from localStorage
        const migrated = await migrateFromLocalStorage();
        let currentLoadedArticles: ArticleItem[] = [];

        if (migrated && migrated.length > 0) {
          currentLoadedArticles = migrated.map(sanitizeArticleItem);
        } else {
          // 2. Otherwise load from IndexedDB
          const savedArticles = await getStoredItem<ArticleItem[]>('casamadre_articles');
          if (savedArticles && savedArticles.length > 0) {
            let updatedList = savedArticles.map(sanitizeArticleItem);
            // Ensure newly added initial items are present
            for (const initArt of [INITIAL_ARTICLES[1], INITIAL_ARTICLES[0]]) {
              if (!updatedList.some(a => a.id === initArt.id)) {
                updatedList = [initArt, ...updatedList];
              }
            }
            currentLoadedArticles = updatedList;
          } else {
            currentLoadedArticles = INITIAL_ARTICLES.map(sanitizeArticleItem);
          }
        }

        // Automatic transfer of all existing articles to "Antiquités" folder as requested
        const folderMigrated = await getStoredItem<boolean>('casamadre_antiquites_transfer_done_v2');
        if (!folderMigrated) {
          currentLoadedArticles = currentLoadedArticles.map(a => ({
            ...a,
            folder: 'Antiquités',
          }));
          await setStoredItem('casamadre_antiquites_transfer_done_v2', true);
        }

        setArticles(currentLoadedArticles);
        await setStoredItem('casamadre_articles', currentLoadedArticles);

        const savedConfig = await getStoredItem<CatalogConfig>('casamadre_config');
        if (savedConfig && typeof savedConfig === 'object') {
          // Ensure default folders include Antiquités and Halloween
          const savedFolders = Array.isArray(savedConfig.folders) && savedConfig.folders.length > 0
            ? savedConfig.folders
            : ['Antiquités', 'Halloween'];
          if (!savedFolders.includes('Antiquités')) savedFolders.unshift('Antiquités');
          if (!savedFolders.includes('Halloween')) savedFolders.push('Halloween');

          const mergedConfig: CatalogConfig = {
            ...DEFAULT_CONFIG,
            ...savedConfig,
            mainTitle: savedConfig.mainTitle || 'CASA MADRE',
            subtitle: 'Dépôt Zerktouni',
            collection: savedConfig.collection || '',
            activeFolder: savedConfig.activeFolder || 'Antiquités',
            folders: savedFolders,
            contactInfo: (savedConfig.contactInfo && savedConfig.contactInfo !== 'Zerktouni' && savedConfig.contactInfo !== 'Dépôt Zerktouni — Casablanca') ? savedConfig.contactInfo : '',
            showReference: false,
          };
          setConfig(mergedConfig);
          await setStoredItem('casamadre_config', mergedConfig);
        } else {
          setConfig({
            ...DEFAULT_CONFIG,
            subtitle: 'Dépôt Zerktouni',
            collection: '',
            activeFolder: 'Antiquités',
            folders: ['Antiquités', 'Halloween'],
            contactInfo: '',
            showReference: false,
          });
        }
      } catch (err) {
        console.warn('Erreur chargement des données stockées', err);
      } finally {
        isLoadedRef.current = true;
      }
    }
    loadData();
  }, []);

  // Auto-save articles to IndexedDB and Cloud Firestore if logged in
  useEffect(() => {
    if (!isLoadedRef.current) return;
    setStoredItem('casamadre_articles', articles);

    if (currentUser?.uid) {
      setSyncStatus('syncing');
      const timer = setTimeout(async () => {
        try {
          await syncAllArticlesToFirestore(currentUser.uid, articles);
          setSyncStatus('synced');
        } catch (err) {
          console.error('Auto-sync articles error:', err);
          setSyncStatus('error');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [articles, currentUser?.uid]);

  // Auto-save config
  useEffect(() => {
    if (!isLoadedRef.current) return;
    setStoredItem('casamadre_config', config);
    try {
      localStorage.setItem('casamadre_config', JSON.stringify(config));
    } catch {
      // ignore
    }

    if (currentUser?.uid) {
      const timer = setTimeout(async () => {
        try {
          await syncConfigToFirestore(currentUser.uid, config);
        } catch (err) {
          console.error('Auto-sync config error:', err);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [config, currentUser?.uid]);

  // Synchronize Dark Mode class with root document
  useEffect(() => {
    if (config.uiDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.uiDarkMode]);

  const handleToggleDarkMode = () => {
    setConfig(prev => {
      const nextMode = !prev.uiDarkMode;
      showToast(nextMode ? 'Mode Sombre activé' : 'Mode Clair activé');
      return { ...prev, uiDarkMode: nextMode };
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Active folder and folders list
  const folders = config.folders && config.folders.length > 0 
    ? config.folders 
    : ['Antiquités', 'Halloween'];
  const activeFolder = config.activeFolder || 'Halloween';

  // Articles displayed according to global search (across all folders) or active folder
  const isGlobalSearchActive = globalSearch.trim().length > 0;
  const searchNormalized = globalSearch.trim().toLowerCase();

  const displayedArticles = isGlobalSearchActive
    ? articles.filter(a => {
        const nameMatch = a.name ? a.name.toLowerCase().includes(searchNormalized) : false;
        const refMatch = a.ref ? a.ref.toLowerCase().includes(searchNormalized) : false;
        return nameMatch || refMatch;
      })
    : (activeFolder === 'all'
        ? articles
        : articles.filter(a => (a.folder || 'Antiquités').toLowerCase() === activeFolder.toLowerCase()));

  // Folder management handlers
  const handleSelectFolder = (newFolder: string) => {
    setConfig(prev => ({
      ...prev,
      activeFolder: newFolder,
      collection: newFolder === 'all' ? (prev.collection || 'Halloween') : newFolder,
    }));
  };

  const handleBackFolder = () => {
    if (globalSearch) {
      setGlobalSearch('');
      return;
    }
    if (activeFolder.toLowerCase() !== 'antiquités') {
      handleSelectFolder('Antiquités');
      showToast('Retour au dossier « Antiquités »');
    } else if (folders.includes('Halloween')) {
      handleSelectFolder('Halloween');
      showToast('Navigation vers le dossier « Halloween »');
    } else if (folders.length > 1) {
      const other = folders.find(f => f.toLowerCase() !== 'antiquités');
      if (other) {
        handleSelectFolder(other);
        showToast(`Navigation vers « ${other} »`);
      }
    }
  };

  const handleCreateFolder = (newFolderName: string) => {
    const updatedFolders = [...folders.filter(f => f.toLowerCase() !== newFolderName.toLowerCase()), newFolderName];
    setConfig(prev => ({
      ...prev,
      folders: updatedFolders,
      activeFolder: newFolderName,
      collection: newFolderName,
    }));
    showToast(`Dossier « ${newFolderName} » créé et activé`);
  };

  const handleRenameFolder = (oldName: string, newName: string) => {
    const updatedFolders = folders.map(f => (f.toLowerCase() === oldName.toLowerCase() ? newName : f));
    // Update all articles belonging to old folder
    const updatedArticles = articles.map(a => {
      if ((a.folder || 'Antiquités').toLowerCase() === oldName.toLowerCase()) {
        return { ...a, folder: newName };
      }
      return a;
    });
    setArticles(updatedArticles);
    setConfig(prev => ({
      ...prev,
      folders: updatedFolders,
      activeFolder: prev.activeFolder?.toLowerCase() === oldName.toLowerCase() ? newName : prev.activeFolder,
      collection: prev.collection?.toLowerCase() === oldName.toLowerCase() ? newName : prev.collection,
    }));
    showToast(`Dossier renommé en « ${newName} »`);
  };

  const handleDeleteFolder = (folderToDelete: string) => {
    const updatedFolders = folders.filter(f => f.toLowerCase() !== folderToDelete.toLowerCase());
    // Move articles from deleted folder to 'Antiquités'
    const updatedArticles = articles.map(a => {
      if ((a.folder || 'Antiquités').toLowerCase() === folderToDelete.toLowerCase()) {
        return { ...a, folder: 'Antiquités' };
      }
      return a;
    });
    setArticles(updatedArticles);
    setConfig(prev => ({
      ...prev,
      folders: updatedFolders,
      activeFolder: 'Antiquités',
      collection: 'Antiquités',
    }));
    showToast(`Dossier « ${folderToDelete} » supprimé. Articles transférés vers « Antiquités »`);
  };

  // Reinforced global window & document drag & drop handling
  // Strictly prevents files from opening in the browser tab and supports multi-file async extraction
  useEffect(() => {
    const handleDragPrevent = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
        const types = Array.from(e.dataTransfer.types || []);
        if (types.includes('Files')) {
          setIsDragOverWindow(true);
        }
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (
        e.clientX <= 0 || 
        e.clientY <= 0 || 
        e.clientX >= window.innerWidth || 
        e.clientY >= window.innerHeight || 
        e.relatedTarget === null
      ) {
        setIsDragOverWindow(false);
      }
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverWindow(false);

      try {
        const extracted = await extractFilesFromDataTransfer(e.dataTransfer);
        const imageFiles = extracted.filter(isImageFile);

        if (imageFiles.length > 0) {
          executeWithPinProtection(() => {
            setInitialFilesForBatch(imageFiles);
            setIsBatchUploadOpen(true);
            showToast(`${imageFiles.length} photo(s) détectée(s) — Prêtes pour l'import`);
          }, "Import de photos");
        } else if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const fallbackImages = Array.from(e.dataTransfer.files).filter(isImageFile);
          if (fallbackImages.length > 0) {
            executeWithPinProtection(() => {
              setInitialFilesForBatch(fallbackImages);
              setIsBatchUploadOpen(true);
              showToast(`${fallbackImages.length} photo(s) détectée(s) — Prêtes pour l'import`);
            }, "Import de photos");
          }
        }
      } catch (err) {
        console.error('Erreur extraction fichiers drop:', err);
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const fallbackImages = Array.from(e.dataTransfer.files).filter(isImageFile);
          if (fallbackImages.length > 0) {
            executeWithPinProtection(() => {
              setInitialFilesForBatch(fallbackImages);
              setIsBatchUploadOpen(true);
            }, "Import de photos");
          }
        }
      }
    };

    // Attach to window and document with capture: true to intercept and cancel browser default navigation
    window.addEventListener('dragenter', handleDragPrevent, { capture: true, passive: false });
    document.addEventListener('dragenter', handleDragPrevent, { capture: true, passive: false });

    window.addEventListener('dragover', handleWindowDragOver, { capture: true, passive: false });
    document.addEventListener('dragover', handleWindowDragOver, { capture: true, passive: false });

    window.addEventListener('dragleave', handleWindowDragLeave, { capture: true, passive: false });
    document.addEventListener('dragleave', handleWindowDragLeave, { capture: true, passive: false });

    window.addEventListener('drop', handleWindowDrop, { capture: true, passive: false });
    document.addEventListener('drop', handleWindowDrop, { capture: true, passive: false });

    return () => {
      window.removeEventListener('dragenter', handleDragPrevent, { capture: true });
      document.removeEventListener('dragenter', handleDragPrevent, { capture: true });

      window.removeEventListener('dragover', handleWindowDragOver, { capture: true });
      document.removeEventListener('dragover', handleWindowDragOver, { capture: true });

      window.removeEventListener('dragleave', handleWindowDragLeave, { capture: true });
      document.removeEventListener('dragleave', handleWindowDragLeave, { capture: true });

      window.removeEventListener('drop', handleWindowDrop, { capture: true });
      document.removeEventListener('drop', handleWindowDrop, { capture: true });
    };
  }, []);

  // Reorder articles
  const handleMoveArticle = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updated = [...articles];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      setArticles(updated);
    } else if (direction === 'down' && index < articles.length - 1) {
      const updated = [...articles];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      setArticles(updated);
    }
  };

  // Duplicate article
  const handleDuplicateArticle = (article: ArticleItem) => {
    const nextRefNum = articles.length + 1;
    const duplicated: ArticleItem = {
      ...article,
      id: `copy-${Date.now()}`,
      ref: `CM-${String(nextRefNum).padStart(4, '0')}`,
      name: `${article.name} (Copie)`,
    };
    setArticles([...articles, duplicated]);
    showToast(`Article dupliqué : ${duplicated.name}`);
  };

  // Delete article
  const handleDeleteArticle = (id: string) => {
    setArticles(articles.filter(a => a.id !== id));
    if (currentUser?.uid) {
      deleteArticleFromFirestore(currentUser.uid, id).catch(err => {
        console.error('Error deleting from Firestore:', err);
      });
    }
    showToast('Article retiré de l\'inventaire');
  };

  // Save edited article
  const handleSaveArticle = (updated: ArticleItem) => {
    setArticles(articles.map(a => (a.id === updated.id ? updated : a)));
    if (currentUser?.uid) {
      syncArticleToFirestore(currentUser.uid, updated).catch(err => {
        console.error('Error saving article to Firestore:', err);
      });
    }
    showToast(`Fiche "${updated.name}" mise à jour`);
  };

  // Add batch articles
  const handleAddBatchArticles = (newArticles: ArticleItem[]) => {
    setArticles([...articles, ...newArticles]);
    const targetFolder = newArticles[0]?.folder || activeFolder;
    showToast(`${newArticles.length} article(s) enregistré(s) dans le dossier « ${targetFolder} »`);
  };

  // Add single scanned / captured article
  const handleAddSingleArticle = (newArticle: ArticleItem) => {
    setArticles(prev => [newArticle, ...prev]);
    showToast(`Photo capturée et ajoutée au dossier « ${newArticle.folder} »`);
  };

  // Add new blank manual article
  const handleAddNewManual = () => {
    const targetFolder = activeFolder === 'all' ? 'Halloween' : activeFolder;
    const nextRefNum = articles.length + 1;
    const newArticle: ArticleItem = {
      id: `art-${Date.now()}`,
      ref: `CM-${String(nextRefNum).padStart(4, '0')}`,
      name: 'Nouvel Objet d\'Antiquité',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      folder: targetFolder,
      category: 'Brocante & Antiquités',
      material: 'Bois noble, patine cirée',
      periodOrStyle: 'XIXe siècle',
      condition: 'Bel état d\'usage',
      quantity: '1 unit.',
      dimensions: '',
      notes: '',
    };
    setArticles([...articles, newArticle]);
    setEditingArticle(newArticle);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('Voulez-vous réinitialiser le catalogue avec les articles modèles ? Vos modifications actuelles seront écrasées.')) {
      setArticles(INITIAL_ARTICLES);
      setConfig(DEFAULT_CONFIG);
      showToast('Catalogue réinitialisé avec les modèles');
    }
  };

  // Repair and synchronize library
  const handleRepairLibrary = async () => {
    const res = await repairAndSyncLibrary(articles, INITIAL_ARTICLES);
    setArticles(res.articles);
    // Also ensure config folders are updated if any new folders appear
    const discoveredFolders = Array.from(new Set(res.articles.map(a => a.folder || 'Antiquités').filter(Boolean)));
    const mergedFolders = Array.from(new Set([...folders, ...discoveredFolders]));
    if (mergedFolders.length > folders.length) {
      const updatedConfig: CatalogConfig = {
        ...config,
        folders: mergedFolders,
      };
      setConfig(updatedConfig);
      await setStoredItem('casamadre_config', updatedConfig);
    }
    showToast(`Bibliothèque réparée : ${res.restoredCount} article(s) synchronisé(s)`);
    return { restoredCount: res.restoredCount, info: res.info };
  };

  // Trigger export flow
  const handleRequestDownloadPDF = () => {
    if (activeFolder !== 'all' && articles.length > displayedArticles.length) {
      setExportChoiceType('pdf');
      setIsExportChoiceOpen(true);
    } else {
      executePDFExport('active');
    }
  };

  const handleRequestDownloadExcel = () => {
    if (activeFolder !== 'all' && articles.length > displayedArticles.length) {
      setExportChoiceType('excel');
      setIsExportChoiceOpen(true);
    } else {
      executeExcelExport('active');
    }
  };

  const executePDFExport = async (scope: 'active' | 'all') => {
    try {
      setIsExporting(true);
      setExportStatus('Préparation du document A4...');

      if (scope === 'all' && activeFolder !== 'all') {
        // Temporarily switch to 'all' for print rendering
        const prevActive = activeFolder;
        setConfig(prev => ({ ...prev, activeFolder: 'all' }));
        // Give browser 250ms to lay out all pages in #catalog-print-area
        await new Promise(r => setTimeout(r, 250));

        await exportCatalogToPDF(
          'catalog-print-area',
          `CASA-MADRE-Depot-Zerktouni-Inventaire-Complet.pdf`,
          (currentPage, totalPages, status) => {
            setExportStatus(status);
          }
        );
        // Restore active folder
        setConfig(prev => ({ ...prev, activeFolder: prevActive }));
      } else {
        const folderTitle = activeFolder === 'all' ? 'Inventaire' : activeFolder;
        await exportCatalogToPDF(
          'catalog-print-area',
          `CASA-MADRE-Depot-Zerktouni-${folderTitle}.pdf`,
          (currentPage, totalPages, status) => {
            setExportStatus(status);
          }
        );
      }
      showToast('Document PDF téléchargé avec succès !');
    } catch (err: any) {
      console.error('Erreur export PDF', err);
      alert('Une erreur est survenue lors de la création du PDF : ' + (err?.message || 'Erreur inconnue'));
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  const executeExcelExport = (scope: 'active' | 'all') => {
    try {
      if (scope === 'active' && activeFolder !== 'all') {
        exportCatalogToExcel(displayedArticles, config, activeFolder);
      } else {
        exportCatalogToExcel(articles, config, 'all');
      }
      showToast('Fichier Excel (.xlsx) téléchargé avec succès !');
    } catch (err: any) {
      console.error('Erreur export Excel', err);
      alert('Une erreur est survenue lors de la création du fichier Excel : ' + (err?.message || 'Erreur inconnue'));
    }
  };

  // Items per page calculation based on currently displayed articles
  const getItemsPerPage = (): number => {
    switch (config.layoutMode) {
      case '1-per-page':
        return 1;
      case '4-per-page':
        return 4;
      case '3-horizontal':
        return 3;
      case '2-per-page':
      default:
        return 2;
    }
  };
  const totalPages = Math.max(1, Math.ceil(displayedArticles.length / getItemsPerPage()));

  // 1. Mandatory Login Gate: Lock Screen
  if (!currentUser) {
    return (
      <LockScreen
        onSignIn={handleSignIn}
        isLoading={isAuthLoading}
        errorMessage={authError}
      />
    );
  }

  // 2. Pending Approval Gate: Waiting for Admin validation
  if (userRole === 'pending' && !isAdmin) {
    return (
      <PendingApprovalScreen
        user={currentUser}
        status="pending"
        onSignOut={handleSignOut}
        onRefresh={handleCheckApproval}
        isRefreshing={isCheckingApproval}
      />
    );
  }

  // 3. Rejected Access Gate
  if (userRole === 'rejected' && !isAdmin) {
    return (
      <PendingApprovalScreen
        user={currentUser}
        status="rejected"
        onSignOut={handleSignOut}
        onRefresh={handleCheckApproval}
      />
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-[#f4f1eb] dark:bg-[#120d0a] transition-colors ${config.uiDarkMode ? 'dark' : ''}`}>
      {/* Top Header Épuré avec Menu Outils & Actions centralisé */}
      <Header
        config={config}
        onChangeConfig={setConfig}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        searchResultCount={isGlobalSearchActive ? displayedArticles.length : undefined}
        onDownloadPDF={handleRequestDownloadPDF}
        onDownloadExcel={handleRequestDownloadExcel}
        onPrint={() => setIsPrintModalOpen(true)}
        onOpenHeaderSettings={() => setIsHeaderSettingsOpen(true)}
        onOpenBatchUpload={() => executeWithPinProtection(() => setIsBatchUploadOpen(true), "Importer des photos")}
        onOpenScanner={() => executeWithPinProtection(() => setIsScannerOpen(true), "Scanner / Photo")}
        isDarkMode={!!config.uiDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        isExporting={isExporting}
        exportStatus={exportStatus}
        user={currentUser}
        isAuthLoading={isAuthLoading}
        syncStatus={syncStatus}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onManualSync={handleManualSync}
        isAdmin={isAdmin}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        pendingApprovalsCount={approvalRequests.filter(r => r.status === 'pending').length}
        isPinUnlocked={isPinUnlocked}
        onLockEditing={() => {
          setIsPinUnlocked(false);
          showToast('Mode modification reverrouillé (Code 0045 requis)');
        }}
      />

      {/* Barre de Gestion des Dossiers Simplifiée */}
      <FolderControlBar
        folders={folders}
        activeFolder={activeFolder}
        articles={articles}
        globalSearch={globalSearch}
        onClearGlobalSearch={() => setGlobalSearch('')}
        onChangeFolder={handleSelectFolder}
        onOpenNewFolder={() => executeWithPinProtection(() => setIsFolderCreateOpen(true), "Créer un nouveau dossier")}
        onOpenEditFolder={() => executeWithPinProtection(() => setIsFolderEditOpen(true), "Modifier le dossier")}
        onBackFolder={handleBackFolder}
        isSidebarVisible={isSidebarVisible}
        onToggleSidebar={() => setIsSidebarVisible(prev => !prev)}
      />

      {/* Main Workspace: Left Sidebar + Right A4 Viewer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (Peut être masquée ou montrée) */}
        {isSidebarVisible && (
          <InventorySidebar
            articles={articles}
            folders={folders}
            activeFolder={activeFolder}
            onChangeFolder={handleSelectFolder}
            onOpenNewFolder={() => executeWithPinProtection(() => setIsFolderCreateOpen(true), "Créer un nouveau dossier")}
            globalSearch={globalSearch}
            onClearGlobalSearch={() => setGlobalSearch('')}
            onSelectArticle={(article) => executeWithPinProtection(() => setEditingArticle(article), "Modifier l'article")}
            onViewImage={setViewingImageArticle}
            onMoveArticle={(index, direction) => executeWithPinProtection(() => handleMoveArticle(index, direction), "Déplacer l'article")}
            onDuplicateArticle={(article) => executeWithPinProtection(() => handleDuplicateArticle(article), "Dupliquer l'article")}
            onDeleteArticle={(id) => executeWithPinProtection(() => handleDeleteArticle(id), "Supprimer l'article")}
            onOpenBatchUpload={() => executeWithPinProtection(() => setIsBatchUploadOpen(true), "Importer des photos")}
            onAddNewManual={() => executeWithPinProtection(handleAddNewManual, "Ajout d'un nouvel article")}
            onResetToDefault={() => executeWithPinProtection(handleResetToDefault, "Réinitialisation")}
            onRepairLibrary={() => executeWithPinProtection(handleRepairLibrary, "Réparation de la bibliothèque")}
            onToggleSidebar={() => setIsSidebarVisible(false)}
          />
        )}

        {/* Bouton d'accès rapide pour ré-afficher la liste si elle est masquée */}
        {!isSidebarVisible && (
          <button
            type="button"
            onClick={() => setIsSidebarVisible(true)}
            title="Montrer la liste des articles"
            className="absolute left-3 top-3 z-30 px-3 py-1.5 bg-[#8c6239] hover:bg-[#734f2d] text-white rounded shadow-md border border-[#aa7a4a] flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 select-none no-print"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 text-white" />
            <span>Montrer la liste</span>
          </button>
        )}

        {/* Live A4 Sheet Preview */}
        <CatalogPreview
          articles={displayedArticles}
          config={config}
          globalSearch={globalSearch}
          onClearGlobalSearch={() => setGlobalSearch('')}
          onOpenBatchUpload={() => executeWithPinProtection(() => setIsBatchUploadOpen(true), "Importer des photos")}
          onAddNewManual={() => executeWithPinProtection(handleAddNewManual, "Ajout d'un nouvel article")}
          onSelectArticle={(article) => executeWithPinProtection(() => setEditingArticle(article), "Modifier l'article")}
          onViewImage={setViewingImageArticle}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
        />
      </div>

      {/* Folder Modals */}
      <FolderCreateModal
        isOpen={isFolderCreateOpen}
        onClose={() => setIsFolderCreateOpen(false)}
        existingFolders={folders}
        onCreateFolder={handleCreateFolder}
      />

      <FolderEditModal
        isOpen={isFolderEditOpen}
        onClose={() => setIsFolderEditOpen(false)}
        folderName={activeFolder === 'all' ? 'Halloween' : activeFolder}
        articleCount={displayedArticles.length}
        existingFolders={folders}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
      />

      <ExportChoiceModal
        isOpen={isExportChoiceOpen}
        onClose={() => setIsExportChoiceOpen(false)}
        exportType={exportChoiceType}
        activeFolder={activeFolder}
        totalArticlesCount={articles.length}
        activeFolderArticlesCount={displayedArticles.length}
        onConfirmExport={(scope) => {
          if (exportChoiceType === 'pdf') {
            executePDFExport(scope);
          } else {
            executeExcelExport(scope);
          }
        }}
        isExporting={isExporting}
      />

      {/* Photo Viewer & Zoom Fullscreen Modal */}
      <ImageViewerModal
        isOpen={!!viewingImageArticle}
        onClose={() => setViewingImageArticle(null)}
        article={viewingImageArticle}
        articles={displayedArticles}
        onSelectArticleForEdit={(article) => {
          setViewingImageArticle(null);
          executeWithPinProtection(() => setEditingArticle(article), "Modifier l'article");
        }}
        onNavigateArticle={(article) => setViewingImageArticle(article)}
        config={config}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        articles={displayedArticles}
        config={config}
        totalPages={totalPages}
        onDownloadPDF={handleRequestDownloadPDF}
        isExporting={isExporting}
      />

      <ArticleEditorModal
        isOpen={!!editingArticle}
        onClose={() => setEditingArticle(null)}
        article={editingArticle}
        onSave={handleSaveArticle}
        onDelete={handleDeleteArticle}
        availableFolders={folders}
      />

      <BatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => {
          setIsBatchUploadOpen(false);
          setInitialFilesForBatch([]);
        }}
        onAddArticles={handleAddBatchArticles}
        currentCount={articles.length}
        initialFiles={initialFilesForBatch}
        targetFolder={activeFolder === 'all' ? 'Halloween' : activeFolder}
        availableFolders={folders}
      />

      <CameraCaptureModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        activeFolder={activeFolder}
        onAddArticle={handleAddSingleArticle}
      />

      {/* Global Window Drag & Drop Overlay */}
      {isDragOverWindow && (
        <div className="fixed inset-0 z-50 bg-[#2a221d]/85 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none p-6 text-center text-white border-4 border-dashed border-[#c4a482] m-4 rounded-xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#8c6239] flex items-center justify-center shadow-lg mb-4 text-[#faf6f0]">
            <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="font-cinzel text-2xl font-bold tracking-wider text-[#faf6f0]">
            CASA MADRE — Dépôt Zerktouni
          </h2>
          <p className="font-garamond italic text-lg text-[#d9cebe] mt-1">
            Déposez vos photos pour l'import dans le dossier « {activeFolder === 'all' ? 'Halloween' : activeFolder} »
          </p>
          <p className="text-xs text-[#c4b5a5] mt-3">
            Photos originales intactes, sans recadrage ni altération.
          </p>
        </div>
      )}

      <HeaderSettingsModal
        isOpen={isHeaderSettingsOpen}
        onClose={() => setIsHeaderSettingsOpen(false)}
        config={config}
        onSave={setConfig}
        onRepairLibrary={handleRepairLibrary}
      />

      {/* Secret PIN Modal (0045) for modifications */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handlePinSuccess}
        actionTitle={pinActionTitle}
      />

      {/* Admin User Approvals Management Dashboard */}
      {isAdmin && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          requests={approvalRequests}
          adminEmail={currentUser.email || ADMIN_EMAIL}
          onSuccessToast={showToast}
        />
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2a221d] text-[#f7f5f0] border border-[#8c6239] px-4 py-2.5 rounded shadow-xl text-xs flex items-center gap-2 animate-fade-in no-print font-medium">
          <div className="w-2 h-2 rounded-full bg-[#8c6239]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
