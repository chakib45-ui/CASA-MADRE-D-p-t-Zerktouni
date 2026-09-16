import React, { useState, useEffect, useRef } from 'react';
import { ArticleItem, CatalogConfig } from './types';
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
import { exportCatalogToPDF, printCatalogViaBrowser } from './utils/pdfExport';
import { exportCatalogToExcel } from './utils/excelExport';
import { getStoredItem, setStoredItem, migrateFromLocalStorage } from './utils/storage';
import { isImageFile, extractFilesFromDataTransfer } from './utils/imageOptimizer';

export default function App() {
  const [articles, setArticles] = useState<ArticleItem[]>(INITIAL_ARTICLES);
  const [config, setConfig] = useState<CatalogConfig>(DEFAULT_CONFIG);
  const isLoadedRef = useRef(false);

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

  // PDF generation state
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Auto-save articles to IndexedDB
  useEffect(() => {
    if (!isLoadedRef.current) return;
    setStoredItem('casamadre_articles', articles);
  }, [articles]);

  // Auto-save config
  useEffect(() => {
    if (!isLoadedRef.current) return;
    setStoredItem('casamadre_config', config);
    try {
      localStorage.setItem('casamadre_config', JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

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
          setInitialFilesForBatch(imageFiles);
          setIsBatchUploadOpen(true);
          showToast(`${imageFiles.length} photo(s) détectée(s) — Prêtes pour l'import`);
        } else if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const fallbackImages = Array.from(e.dataTransfer.files).filter(isImageFile);
          if (fallbackImages.length > 0) {
            setInitialFilesForBatch(fallbackImages);
            setIsBatchUploadOpen(true);
            showToast(`${fallbackImages.length} photo(s) détectée(s) — Prêtes pour l'import`);
          }
        }
      } catch (err) {
        console.error('Erreur extraction fichiers drop:', err);
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const fallbackImages = Array.from(e.dataTransfer.files).filter(isImageFile);
          if (fallbackImages.length > 0) {
            setInitialFilesForBatch(fallbackImages);
            setIsBatchUploadOpen(true);
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
    showToast('Article retiré de l\'inventaire');
  };

  // Save edited article
  const handleSaveArticle = (updated: ArticleItem) => {
    setArticles(articles.map(a => (a.id === updated.id ? updated : a)));
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

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-[#f4f1eb] dark:bg-[#120d0a] transition-colors ${config.uiDarkMode ? 'dark' : ''}`}>
      {/* Top Header */}
      <Header
        config={config}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        searchResultCount={isGlobalSearchActive ? displayedArticles.length : undefined}
        onDownloadPDF={handleRequestDownloadPDF}
        onDownloadExcel={handleRequestDownloadExcel}
        onPrint={() => setIsPrintModalOpen(true)}
        onOpenHeaderSettings={() => setIsHeaderSettingsOpen(true)}
        onOpenBatchUpload={() => setIsBatchUploadOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        isDarkMode={!!config.uiDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        isExporting={isExporting}
        exportStatus={exportStatus}
      />

      {/* Barre de contrôle des dossiers (Dropdown + Actions) */}
      <FolderControlBar
        folders={folders}
        activeFolder={activeFolder}
        articles={articles}
        globalSearch={globalSearch}
        onClearGlobalSearch={() => setGlobalSearch('')}
        onChangeFolder={handleSelectFolder}
        onOpenNewFolder={() => setIsFolderCreateOpen(true)}
        onOpenEditFolder={() => setIsFolderEditOpen(true)}
        onBackFolder={handleBackFolder}
      />

      {/* Catalog Layout & Theme Controls */}
      <CatalogControls
        config={config}
        onChangeConfig={setConfig}
      />

      {/* Main Workspace: Left Sidebar + Right A4 Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <InventorySidebar
          articles={articles}
          activeFolder={activeFolder}
          globalSearch={globalSearch}
          onClearGlobalSearch={() => setGlobalSearch('')}
          onSelectArticle={setEditingArticle}
          onViewImage={setViewingImageArticle}
          onMoveArticle={handleMoveArticle}
          onDuplicateArticle={handleDuplicateArticle}
          onDeleteArticle={handleDeleteArticle}
          onOpenBatchUpload={() => setIsBatchUploadOpen(true)}
          onAddNewManual={handleAddNewManual}
          onResetToDefault={handleResetToDefault}
        />

        {/* Live A4 Sheet Preview */}
        <CatalogPreview
          articles={displayedArticles}
          config={config}
          globalSearch={globalSearch}
          onClearGlobalSearch={() => setGlobalSearch('')}
          onOpenBatchUpload={() => setIsBatchUploadOpen(true)}
          onAddNewManual={handleAddNewManual}
          onSelectArticle={(article) => setEditingArticle(article)}
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
          setEditingArticle(article);
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
      />

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
