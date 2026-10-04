import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  RefreshCw,
  Info,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { ArticleItem } from '../types';
import { extractArticlesFromPdf, injectPdfArticlesIntoStorage, PdfImportProgress } from '../utils/pdfImporter';
import { playAlertNotificationSound, playClickSound } from '../utils/audioFeedback';
import { FALLBACK_ANTIQUE_IMAGE } from '../utils/imageOptimizer';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticlesImported: (importedArticles: ArticleItem[], message: string) => void;
  currentArticles: ArticleItem[];
  activeFolder: string;
  availableFolders: string[];
  initialFile?: File | null;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  onArticlesImported,
  currentArticles,
  activeFolder = 'Antiquités',
  availableFolders = ['Antiquités', 'Halloween'],
  initialFile = null,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFolder, setTargetFolder] = useState<string>(activeFolder || 'Antiquités');
  const [replaceMode, setReplaceMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<PdfImportProgress | null>(null);
  const [extractedArticles, setExtractedArticles] = useState<ArticleItem[]>([]);
  const [photosCount, setPhotosCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSummary, setSuccessSummary] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeFolder) {
      setTargetFolder(activeFolder === 'all' ? 'Antiquités' : activeFolder);
    }
  }, [activeFolder, isOpen]);

  // If an initial file was passed (e.g. from drag & drop on main screen), start processing it
  useEffect(() => {
    if (isOpen && initialFile && !selectedFile && !isProcessing && extractedArticles.length === 0) {
      handleFileSelect(initialFile);
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(null);
    setExtractedArticles([]);
    setPhotosCount(0);
    setErrorMessage(null);
    setSuccessSummary(null);
  };

  const handleClose = () => {
    if (isProcessing) return;
    resetState();
    onClose();
  };

  const handleFileSelect = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage("Veuillez sélectionner un document au format PDF valide (.pdf).");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIsProcessing(true);
    setExtractedArticles([]);
    setProgress({
      currentPage: 0,
      totalPages: 0,
      percent: 5,
      itemsFound: 0,
      photosFound: 0,
      statusMessage: "Initialisation du moteur d'extraction PDF...",
    });

    try {
      const result = await extractArticlesFromPdf(
        file,
        {
          targetFolder: targetFolder,
          autoSound: true,
        },
        (prog) => {
          setProgress(prog);
        }
      );

      if (!result.success || result.articles.length === 0) {
        setErrorMessage(
          result.errors.length > 0 
            ? result.errors.join(' ') 
            : "Aucun article n'a pu être identifié dans ce fichier PDF."
        );
        setIsProcessing(false);
        return;
      }

      setExtractedArticles(result.articles);
      setPhotosCount(result.photosCount);
      setIsProcessing(false);
    } catch (err: any) {
      console.error("Erreur parsing PDF:", err);
      setErrorMessage(err?.message || "Une erreur inattendue est survenue lors de l'extraction.");
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (extractedArticles.length === 0) return;

    try {
      setIsProcessing(true);

      // Inject into storage non-destructively
      const { mergedArticles, addedCount } = await injectPdfArticlesIntoStorage(
        extractedArticles,
        currentArticles,
        {
          replaceFolder: replaceMode,
          targetFolder: targetFolder,
        }
      );

      // Play alert-notification.mp3 sound as requested
      try {
        playAlertNotificationSound();
      } catch (err) {
        console.warn("Son non joué:", err);
      }

      const summaryText = `${addedCount} article${addedCount > 1 ? 's' : ''} et ${photosCount} photo${photosCount > 1 ? 's' : ''} importés avec succès dans « ${targetFolder} »`;
      setSuccessSummary(summaryText);

      // Notify parent component to update inventory immediately
      onArticlesImported(mergedArticles, summaryText);

      // Close modal after brief feedback
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage("Erreur lors de l'enregistrement dans la base de données : " + (err?.message || err));
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#FAF9F5] dark:bg-[#1C1815] text-[#1E1915] dark:text-[#F5F2ED] rounded-2xl shadow-2xl border border-[#E2DBD0] dark:border-[#383028] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DBD0] dark:border-[#383028] bg-white dark:bg-[#221C18]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8C6239]/10 text-[#8C6239] flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif tracking-wide">
                Importation de Données PDF (CASAMADRE DEPOT)
              </h2>
              <p className="text-xs text-[#635950] dark:text-[#A89E94]">
                Extraction intégrale des articles, photos, colonnes et métadonnées
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 text-[#635950] dark:text-[#A89E94] hover:text-[#1E1915] dark:hover:text-white rounded-lg hover:bg-[#F3EDE4] dark:hover:bg-[#2E2620] transition-colors disabled:opacity-50 cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Success summary toast banner */}
          {successSummary && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">{successSummary}</p>
                <p className="text-xs opacity-90">Base de données synchronisée et son de notification de succès déclenché.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="text-sm font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Configuration Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white dark:bg-[#221C18] border border-[#E2DBD0] dark:border-[#383028]">
            {/* Target Folder Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#635950] dark:text-[#A89E94] uppercase tracking-wider mb-1.5">
                Dossier de destination :
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2DBD0] dark:border-[#383028] bg-[#FAFAF8] dark:bg-[#1A1614] text-[#1E1915] dark:text-[#F5F2ED] focus:ring-2 focus:ring-[#8C6239] outline-none cursor-pointer"
                >
                  {availableFolders.map((f) => (
                    <option key={f} value={f}>
                      📂 {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Merge Mode Toggle */}
            <div>
              <label className="block text-xs font-semibold text-[#635950] dark:text-[#A89E94] uppercase tracking-wider mb-1.5">
                Mode d'injection dans la base :
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!replaceMode}
                    onChange={() => setReplaceMode(false)}
                    disabled={isProcessing}
                    className="accent-[#8C6239] cursor-pointer"
                  />
                  <span>Ajouter / Fusionner (Non-destructif)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={replaceMode}
                    onChange={() => setReplaceMode(true)}
                    disabled={isProcessing}
                    className="accent-[#8C6239] cursor-pointer"
                  />
                  <span>Remplacer le dossier</span>
                </label>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          {!selectedFile && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D4C7B5] dark:border-[#4A3D33] hover:border-[#8C6239] rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 bg-white/60 dark:bg-[#201A16]/50 hover:bg-[#F3EDE4]/50 dark:hover:bg-[#2A221C]/50 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#8C6239]/10 text-[#8C6239] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold font-serif text-[#1E1915] dark:text-white mb-1">
                Glissez-déposez votre catalogue PDF ici
              </h3>
              <p className="text-xs text-[#635950] dark:text-[#A89E94] max-w-md mx-auto mb-3">
                Prend en charge les catalogues A4 CASAMADRE DEPOT (2 articles par page) et les tableaux d'inventaires à colonnes multiples.
              </p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8C6239] text-white text-xs font-semibold shadow hover:bg-[#734F2C] transition-colors">
                <FileText className="w-4 h-4" />
                Sélectionner un fichier PDF
              </span>
            </div>
          )}

          {/* Processing / Progress State */}
          {isProcessing && progress && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#221C18] border border-[#E2DBD0] dark:border-[#383028] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#8C6239] animate-spin" />
                  <span className="text-sm font-semibold text-[#1E1915] dark:text-white">
                    {progress.statusMessage}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#8C6239]">
                  {progress.percent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-[#E2DBD0] dark:bg-[#383028] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8C6239] to-[#D4A373] transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#635950] dark:text-[#A89E94] pt-1">
                <span>Page {progress.currentPage} sur {progress.totalPages || '...'}</span>
                <span>{progress.itemsFound} articles détectés • {progress.photosFound} photos extraites</span>
              </div>
            </div>
          )}

          {/* Extracted Articles Preview List */}
          {extractedArticles.length > 0 && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-sm text-[#1E1915] dark:text-white">
                    Aperçu des articles extraits ({extractedArticles.length} articles, {photosCount} photos)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedFile(null);
                    setExtractedArticles([]);
                  }}
                  className="text-xs text-[#8C6239] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Changer de fichier
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto pr-1">
                {extractedArticles.map((art, idx) => (
                  <div
                    key={art.id || idx}
                    className="flex gap-3 p-3 rounded-xl bg-white dark:bg-[#221C18] border border-[#E2DBD0] dark:border-[#383028] hover:border-[#8C6239]/50 transition-colors shadow-sm"
                  >
                    {/* Thumbnail with standard Base64 conversion and fallback */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#E2DBD0]/40 dark:bg-[#2E2620] shrink-0 border border-[#E2DBD0] dark:border-[#383028] flex items-center justify-center relative">
                      <img
                        src={art.imageUrl || FALLBACK_ANTIQUE_IMAGE}
                        alt={art.name}
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_ANTIQUE_IMAGE;
                        }}
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/75 text-white">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-[#8C6239] truncate">
                            {art.ref}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F3EDE4] dark:bg-[#2E2620] text-[#8C6239]">
                            Qté: {art.quantity}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#1E1915] dark:text-white line-clamp-2 leading-tight">
                          {art.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#635950] dark:text-[#A89E94] pt-1">
                        <span className="truncate">{art.category}</span>
                        <span className="truncate">{art.material || art.periodOrStyle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2DBD0] dark:border-[#383028] bg-white dark:bg-[#221C18]">
          <div className="text-xs text-[#635950] dark:text-[#A89E94] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#8C6239]" />
            <span>Mode sécurisé : fusion et ajout sans écrasement involontaire.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#635950] dark:text-[#A89E94] hover:bg-[#F3EDE4] dark:hover:bg-[#2E2620] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Annuler
            </button>

            {extractedArticles.length > 0 && (
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#8C6239] hover:bg-[#734F2C] text-white shadow-md flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Valider & Importer ({extractedArticles.length} articles)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
