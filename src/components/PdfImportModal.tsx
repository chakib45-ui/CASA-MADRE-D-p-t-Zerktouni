import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  Folder, 
  Trash2, 
  Check, 
  RefreshCw,
  Search,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ArticleItem } from '../types';
import { parsePdfFile, ExtractedPdfArticle, PdfImportResult } from '../utils/pdfImporter';
import { FALLBACK_ANTIQUE_IMAGE } from '../utils/imageOptimizer';
import { playAlertNotificationSound, playSuccessSound } from '../utils/audioFeedback';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportArticles?: (articles: ArticleItem[], targetFolder: string) => void;
  onArticlesImported?: (articles: ArticleItem[], message: string) => void;
  currentArticles?: ArticleItem[];
  activeFolder?: string;
  availableFolders?: string[];
  initialFile?: File | null;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  onImportArticles,
  onArticlesImported,
  currentArticles = [],
  activeFolder = 'Antiquités',
  availableFolders = ['Antiquités', 'Halloween', 'CASAMADRE DEPOT'],
  initialFile = null,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState<string>('');
  const [parsingProgress, setParsingProgress] = useState<number>(0);
  const [parseResult, setParseResult] = useState<PdfImportResult | null>(null);
  const [extractedArticles, setExtractedArticles] = useState<ExtractedPdfArticle[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [destinationFolder, setDestinationFolder] = useState<string>(
    activeFolder === 'all' ? 'CASAMADRE DEPOT' : activeFolder
  );
  const [customFolder, setCustomFolder] = useState('');
  const [showCustomFolder, setShowCustomFolder] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync folder and initial file
  useEffect(() => {
    if (activeFolder) {
      setDestinationFolder(activeFolder === 'all' ? 'CASAMADRE DEPOT' : activeFolder);
    }
  }, [activeFolder, isOpen]);

  useEffect(() => {
    if (initialFile && isOpen) {
      handleFileSelected(initialFile);
    }
  }, [initialFile, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg("Format de fichier non pris en charge. Veuillez sélectionner un document PDF (.pdf).");
      playAlertNotificationSound();
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);
    setIsParsing(true);
    setParsingProgress(10);
    setParsingStep("Initialisation de l'analyse du document PDF...");

    try {
      // 1. Client-side full extraction (text, table columns, embedded photos via Canvas)
      const result = await parsePdfFile(file, (status, pct) => {
        setParsingStep(status);
        setParsingProgress(pct);
      });

      // 2. If Gemini API is available and client found few articles, also query server
      if (result.articles.length === 0) {
        try {
          setParsingStep("Analyse approfondie avec le moteur Vision & IA...");
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          const res = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64Data }),
          });
          const serverData = await res.json();
          if (serverData.success && Array.isArray(serverData.articles) && serverData.articles.length > 0) {
            const serverArticles: ExtractedPdfArticle[] = serverData.articles.map((a: any, idx: number) => ({
              id: `pdf-srv-${Date.now()}-${idx}`,
              ref: a.ref || `CM-${String(idx + 1).padStart(4, '0')}`,
              name: a.name || "Article d'Antiquité",
              category: a.category || 'Antiquités & Brocante',
              material: a.material || '',
              periodOrStyle: '',
              condition: 'Bel état de conservation',
              dimensions: a.dimensions || '',
              quantity: a.quantity || '1 unit.',
              price: a.price || '',
              location: a.location || 'Dépôt Zerktouni',
              notes: a.notes || '',
              imageUrl: FALLBACK_ANTIQUE_IMAGE,
              hasExtractedPhoto: false,
              pageNumber: 1,
            }));
            result.articles = serverArticles;
            result.totalArticles = serverArticles.length;
          }
        } catch (serverErr) {
          console.warn('Fallback server PDF analysis note:', serverErr);
        }
      }

      setParseResult(result);
      setExtractedArticles(result.articles);
      setSelectedIndices(new Set(result.articles.map((_, i) => i)));

      if (result.articles.length === 0) {
        setErrorMsg("Aucun article n'a pu être extrait de ce fichier PDF. Vérifiez qu'il s'agit bien d'un document d'inventaire ou catalogue.");
        playAlertNotificationSound();
      } else {
        playSuccessSound();
      }
    } catch (err: any) {
      console.error('Erreur importation PDF:', err);
      setErrorMsg(err?.message || "Une erreur est survenue lors de l'extraction des données du PDF.");
      playAlertNotificationSound();
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === extractedArticles.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(extractedArticles.map((_, i) => i)));
    }
  };

  const toggleSelectIndex = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const updateArticle = (index: number, updates: Partial<ExtractedPdfArticle>) => {
    setExtractedArticles(prev =>
      prev.map((art, i) => (i === index ? { ...art, ...updates } : art))
    );
  };

  const removeArticle = (index: number) => {
    setExtractedArticles(prev => prev.filter((_, i) => i !== index));
    setSelectedIndices(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const handleConfirmImport = () => {
    const target = showCustomFolder && customFolder.trim() ? customFolder.trim() : destinationFolder;
    const articlesToImport = extractedArticles
      .filter((_, idx) => selectedIndices.has(idx))
      .map((item, idx) => {
        const article: ArticleItem = {
          id: item.id || `pdf-import-${Date.now()}-${idx}`,
          ref: item.ref || `CM-${String(idx + 1).padStart(4, '0')}`,
          name: item.name || "Article d'Antiquité",
          imageUrl: item.imageUrl || FALLBACK_ANTIQUE_IMAGE,
          imageFit: 'contain',
          folder: target || 'CASAMADRE DEPOT',
          category: item.category || 'Antiquités & Brocante',
          material: item.material || '',
          periodOrStyle: item.periodOrStyle || '',
          condition: item.condition || 'Bel état de conservation',
          dimensions: item.dimensions || '',
          quantity: item.quantity || '1 unit.',
          price: item.price || '',
          location: item.location || 'Dépôt Zerktouni',
          notes: item.notes || '',
        };
        return article;
      });

    if (articlesToImport.length === 0) return;

    if (onImportArticles) {
      onImportArticles(articlesToImport, target);
    } else if (onArticlesImported) {
      const merged = [...(currentArticles || []), ...articlesToImport];
      const photosCount = articlesToImport.filter(
        a => a.imageUrl && !a.imageUrl.includes('Illustration en cours')
      ).length;
      playAlertNotificationSound();
      onArticlesImported(
        merged,
        `${articlesToImport.length} articles et ${photosCount} photos importés avec succès (CASAMADRE DEPOT)`
      );
    }
    onClose();
  };

  const filteredArticles = extractedArticles.filter(art => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      (art.name && art.name.toLowerCase().includes(query)) ||
      (art.ref && art.ref.toLowerCase().includes(query)) ||
      (art.category && art.category.toLowerCase().includes(query)) ||
      (art.material && art.material.toLowerCase().includes(query)) ||
      (art.location && art.location.toLowerCase().includes(query))
    );
  });

  const photosExtractedCount = extractedArticles.filter(a => a.hasExtractedPhoto).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print select-none">
      <div 
        className="bg-white dark:bg-[#1e1712] rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-[#e2d9ce] dark:border-[#3d2f24] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2d9ce] dark:border-[#382b21] flex justify-between items-center bg-[#faf7f2] dark:bg-[#261d17]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8c6239] text-[#faf6f0] flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-cinzel text-base font-bold text-[#5c3e21] dark:text-[#f3dfcc] flex items-center gap-2">
                  <span>Importation & Extraction PDF</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#8c6239]/15 text-[#8c6239] dark:text-[#e89a43] border border-[#8c6239]/30 font-semibold">
                    CASAMADRE DEPOT
                  </span>
                </h2>
                <p className="text-xs text-[#6e6259] dark:text-[#a8988a]">
                  Extraction automatique du tableau, colonnes et photos sans omission • Mode ajout / fusion sécurisé
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-[#33251b] transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 flex flex-col bg-[#fdfbf7] dark:bg-[#1b140f]">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-red-800 dark:text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="flex-1 font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Initial Dropzone if no file selected yet */}
          {!selectedFile && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#c4a482] dark:border-[#7c634c] rounded-xl p-8 sm:p-12 text-center bg-white dark:bg-[#251c16] hover:bg-[#faf6f0] dark:hover:bg-[#2e231b] cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 shadow-xs group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-[#f5ede2] dark:bg-[#382a20] flex items-center justify-center text-[#8c6239] dark:text-[#d4a373] group-hover:scale-105 transition-transform border border-[#e8dfd5] dark:border-[#4d3b2d]">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-stone-800 dark:text-[#f0dfcc] text-sm sm:text-base">
                  Glissez-déposez votre fichier PDF d'inventaire ici
                </p>
                <p className="text-xs text-[#6e6259] dark:text-[#a8988a]">
                  ou cliquez pour sélectionner un fichier PDF depuis votre appareil (ex: inventaire CASAMADRE DEPOT)
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#8c6239] hover:bg-[#734f2d] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Sélectionner le fichier PDF</span>
                </span>
              </div>
              <div className="pt-2 text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-4 flex-wrap justify-center">
                <span>✓ Reconnaissance automatique des colonnes</span>
                <span>✓ Extraction directe des photos associées</span>
                <span>✓ Respect strict des données existantes</span>
              </div>
            </div>
          )}

          {/* Loading / Parsing Progress State */}
          {isParsing && (
            <div className="bg-white dark:bg-[#251c16] border border-[#e2d9ce] dark:border-[#382b21] rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto shadow-sm">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-[#8c6239] animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-cinzel text-sm sm:text-base font-bold text-[#5c3e21] dark:text-[#f3dfcc]">
                  Analyse et Extraction en cours...
                </h3>
                <p className="text-xs text-stone-600 dark:text-[#c4b5a5]">
                  {parsingStep || 'Lecture du document PDF et extraction des données...'}
                </p>
              </div>
              <div className="w-full max-w-md bg-stone-100 dark:bg-[#1a1410] rounded-full h-2 overflow-hidden border border-stone-200 dark:border-[#423429]">
                <div 
                  className="bg-gradient-to-r from-[#8c6239] to-[#d4a373] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${parsingProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-semibold text-stone-500">
                {parsingProgress}%
              </span>
            </div>
          )}

          {/* Extracted Articles Preview Table */}
          {!isParsing && parseResult && extractedArticles.length > 0 && (
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              {/* Top Control Bar: Destination folder, Search, and Stats */}
              <div className="bg-white dark:bg-[#251c16] border border-[#e2d9ce] dark:border-[#3d2f24] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                {/* Stats */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{extractedArticles.length} articles extraits</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/60 font-semibold text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>{photosExtractedCount} photos identifiées</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setParseResult(null);
                      setExtractedArticles([]);
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                  >
                    Changer de fichier
                  </button>
                </div>

                {/* Target Folder Selection */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-700 dark:text-[#dfd4c7] text-xs">
                    📂 Dossier cible :
                  </span>
                  {!showCustomFolder ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={destinationFolder}
                        onChange={e => {
                          if (e.target.value === '__new__') {
                            setShowCustomFolder(true);
                          } else {
                            setDestinationFolder(e.target.value);
                          }
                        }}
                        className="bg-stone-50 dark:bg-[#1f1813] text-stone-800 dark:text-[#faf6f0] border border-stone-300 dark:border-[#4d3b2d] rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#8c6239] cursor-pointer"
                      >
                        {Array.from(new Set([...availableFolders, 'CASAMADRE DEPOT'])).map(f => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                        <option value="__new__">+ Nouveau dossier...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={customFolder}
                        onChange={e => setCustomFolder(e.target.value)}
                        placeholder="Nom du nouveau dossier"
                        className="bg-white dark:bg-[#1f1813] text-stone-800 dark:text-[#faf6f0] border border-[#8c6239] rounded px-2 py-1 text-xs focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customFolder.trim()) {
                            setDestinationFolder(customFolder.trim());
                          }
                          setShowCustomFolder(false);
                        }}
                        className="px-2 py-1 bg-[#8c6239] text-white rounded text-xs"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Filter & Select All */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-2.5 py-1 bg-white dark:bg-[#251c16] hover:bg-stone-50 dark:hover:bg-[#2f231c] border border-stone-300 dark:border-[#4a392c] rounded text-[11px] font-medium text-stone-700 dark:text-[#dfd4c7] cursor-pointer"
                  >
                    {selectedIndices.size === extractedArticles.length
                      ? 'Tout désélectionner'
                      : `Tout sélectionner (${extractedArticles.length})`}
                  </button>
                  <span className="text-[11px] text-stone-500">
                    {selectedIndices.size} article(s) sélectionné(s) pour l'import
                  </span>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Filtrer les articles extraits..."
                    className="w-full pl-8 pr-3 py-1 bg-white dark:bg-[#251c16] border border-stone-300 dark:border-[#423327] rounded text-xs text-stone-800 dark:text-[#faf6f0] focus:outline-none focus:border-[#8c6239]"
                  />
                </div>
              </div>

              {/* Responsive Formatted Table */}
              <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#e2d9ce] dark:border-[#382b21] rounded-lg bg-white dark:bg-[#201813] shadow-inner max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f5ede2] dark:bg-[#2a2019] text-[#5c3e21] dark:text-[#f0dfcc] uppercase font-semibold text-[10px] tracking-wider sticky top-0 z-10 border-b border-[#e2d9ce] dark:border-[#382b21]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === extractedArticles.length && extractedArticles.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded text-[#8c6239] cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-16">Photo</th>
                      <th className="py-2.5 px-3 w-28">Référence</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Désignation</th>
                      <th className="py-2.5 px-3 w-32">Catégorie</th>
                      <th className="py-2.5 px-3 w-32">Matière</th>
                      <th className="py-2.5 px-3 w-36">Emplacement</th>
                      <th className="py-2.5 px-3 w-20 text-center">Quantité</th>
                      <th className="py-2.5 px-3 w-24 text-right">Prix</th>
                      <th className="py-2.5 px-3 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-[#33261d]">
                    {filteredArticles.map((article, idx) => {
                      const isSelected = selectedIndices.has(idx);
                      return (
                        <tr 
                          key={article.id}
                          className={`hover:bg-[#faf6f0] dark:hover:bg-[#281e18] transition-colors ${
                            !isSelected ? 'opacity-50 bg-stone-50/50 dark:bg-stone-900/30' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectIndex(idx)}
                              className="rounded text-[#8c6239] cursor-pointer"
                            />
                          </td>

                          {/* Photo Thumbnail */}
                          <td className="py-2 px-3">
                            <div className="w-12 h-12 rounded border border-stone-300 dark:border-[#4d3b2d] bg-stone-100 dark:bg-[#1a1410] flex items-center justify-center overflow-hidden relative shadow-2xs group">
                              <img
                                src={article.imageUrl || FALLBACK_ANTIQUE_IMAGE}
                                alt={article.name}
                                className="max-w-full max-h-full object-contain"
                              />
                              {article.hasExtractedPhoto ? (
                                <span className="absolute bottom-0 right-0 bg-emerald-600 text-white text-[8px] font-bold px-1 rounded-tl" title="Photo originale extraite du PDF">
                                  PDF
                                </span>
                              ) : (
                                <span className="absolute bottom-0 right-0 bg-[#8c6239] text-white text-[8px] font-bold px-1 rounded-tl" title="Illustration standard">
                                  CM
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Référence */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={article.ref}
                              onChange={e => updateArticle(idx, { ref: e.target.value })}
                              className="w-full font-mono text-[11px] font-bold text-[#8c6239] dark:text-[#d4a373] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8c6239] focus:outline-none px-1"
                            />
                          </td>

                          {/* Désignation */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={article.name}
                              onChange={e => updateArticle(idx, { name: e.target.value })}
                              className="w-full font-semibold text-xs text-stone-800 dark:text-[#faf6f0] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8c6239] focus:outline-none px-1"
                            />
                            {article.notes && (
                              <p className="text-[10px] text-stone-400 truncate px-1 mt-0.5">
                                {article.notes}
                              </p>
                            )}
                          </td>

                          {/* Catégorie */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={article.category}
                              onChange={e => updateArticle(idx, { category: e.target.value })}
                              className="w-full text-xs text-stone-700 dark:text-[#dfd4c7] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8c6239] focus:outline-none px-1"
                            />
                          </td>

                          {/* Matière */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={article.material}
                              onChange={e => updateArticle(idx, { material: e.target.value })}
                              placeholder="Matière..."
                              className="w-full text-xs text-stone-700 dark:text-[#dfd4c7] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8c6239] focus:outline-none px-1"
                            />
                          </td>

                          {/* Emplacement */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={article.location}
                              onChange={e => updateArticle(idx, { location: e.target.value })}
                              placeholder="Dépôt Zerktouni..."
                              className="w-full text-xs text-stone-700 dark:text-[#dfd4c7] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8c6239] focus:outline-none px-1 font-medium"
                            />
                          </td>

                          {/* Quantité */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              value={article.quantity}
                              onChange={e => updateArticle(idx, { quantity: e.target.value })}
                              className="w-16 text-center font-bold text-xs text-stone-800 dark:text-[#faf6f0] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8c6239] focus:outline-none px-1"
                            />
                          </td>

                          {/* Prix */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="text"
                              value={article.price}
                              onChange={e => updateArticle(idx, { price: e.target.value })}
                              placeholder="Prix..."
                              className="w-20 text-right font-bold text-xs text-[#5c3e21] dark:text-[#f3dfcc] bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8c6239] focus:outline-none px-1"
                            />
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeArticle(idx)}
                              className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                              title="Retirer cette ligne"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2d9ce] dark:border-[#382b21] bg-[#faf7f2] dark:bg-[#261d17] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#6e6259] dark:text-[#a8988a]">
            {extractedArticles.length > 0 ? (
              <span>
                💡 <strong>Mode Ajout / Fusion :</strong> Les {selectedIndices.size} article(s) seront intégrés dans le dossier « {showCustomFolder && customFolder.trim() ? customFolder.trim() : destinationFolder} » sans toucher aux articles déjà enregistrés.
              </span>
            ) : (
              <span>Sélectionnez un fichier PDF d'inventaire pour démarrer l'extraction.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-[#dfd4c7] hover:bg-stone-100 dark:hover:bg-[#2e231b] rounded-lg border border-stone-200 dark:border-[#4d3b2d] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={selectedIndices.size === 0 || isParsing}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#8c6239] to-[#754f2c] hover:from-[#7c5631] hover:to-[#684424] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>
                Injecter {selectedIndices.size} article(s) dans l'inventaire
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
