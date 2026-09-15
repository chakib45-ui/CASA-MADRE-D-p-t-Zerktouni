import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { ArticleItem } from '../types';
import { optimizeImageFile, isImageFile, extractFilesFromDataTransfer } from '../utils/imageOptimizer';

export interface BatchItem {
  id: string;
  file: File;
  preview: string;
  name: string;
  quantity: string;
  category: string;
  material: string;
  periodOrStyle: string;
  aiStatus: 'idle' | 'analyzing' | 'done' | 'error';
  aiError?: string;
}

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArticles: (newArticles: ArticleItem[]) => void;
  currentCount: number;
  initialFiles?: File[];
  targetFolder?: string;
  availableFolders?: string[];
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onAddArticles,
  currentCount,
  initialFiles,
  targetFolder = 'Halloween',
  availableFolders = ['Antiquités', 'Halloween'],
}) => {
  const [selectedItems, setSelectedItems] = useState<BatchItem[]>([]);
  const [destinationFolder, setDestinationFolder] = useState(targetFolder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [defaultQuantity, setDefaultQuantity] = useState('1');
  const [defaultCategory, setDefaultCategory] = useState('Antiquités & Brocante');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (targetFolder) {
      setDestinationFolder(targetFolder === 'all' ? 'Halloween' : targetFolder);
    }
  }, [targetFolder, isOpen]);

  // Process any initial files passed from drag & drop
  React.useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && isOpen) {
      processFiles(initialFiles);
    }
  }, [initialFiles, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    processFiles(Array.from(e.target.files));
  };

  const processFiles = async (files: File[]) => {
    setUploadError(null);
    const validImageFiles = files.filter(isImageFile);
    if (validImageFiles.length === 0) {
      setUploadError("Aucun format d'image reconnu parmi les fichiers sélectionnés. Formats supportés : JPG, PNG, WEBP, HEIC, GIF, AVIF.");
      return;
    }

    setIsCompressing(true);
    try {
      const results = await Promise.allSettled(
        validImageFiles.map(async (file, index) => {
          // Preserve original photo cleanly without cropping or filters
          const preview = await optimizeImageFile(file, 1800, 0.92);
          if (!preview) {
            throw new Error(`Impossible de lire l'image ${file.name}`);
          }
          const isGenericFileName = /whatsapp\s*image/i.test(file.name) || /^img[-_]/i.test(file.name) || /^pxl[-_]/i.test(file.name) || file.name.includes('23.15.51');
          const cleanName = isGenericFileName
            ? "Article d'Antiquité"
            : file.name
                .replace(/\.[^/.]+$/, '')
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());

          return {
            id: `batch-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            file,
            preview,
            name: cleanName || "Article d'Antiquité",
            quantity: defaultQuantity,
            category: defaultCategory,
            material: '',
            periodOrStyle: '',
            aiStatus: 'analyzing' as const,
          };
        })
      );

      const newItems: BatchItem[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          newItems.push(res.value as BatchItem);
        }
      }

      if (newItems.length === 0) {
        setUploadError("Impossible de charger les images sélectionnées. Vérifiez que les fichiers ne sont pas corrompus.");
        setIsCompressing(false);
        return;
      }

      setSelectedItems(prev => [...prev, ...newItems]);
      setIsCompressing(false);

      // Trigger server-side Vision AI analysis sequentially to avoid exceeding RPM quota
      (async () => {
        for (const item of newItems) {
          await analyzeItemWithVisionAI(item);
          // Small pause between items to stay well within free tier limits
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      })();
    } catch (err) {
      console.warn('Erreur traitement des images', err);
      setIsCompressing(false);
      setUploadError("Une erreur est survenue lors de la préparation des photos.");
    }
  };

  const analyzeItemWithVisionAI = async (item: BatchItem) => {
    try {
      const res = await fetch('/api/analyze-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: item.preview,
          mimeType: item.file.type || 'image/jpeg',
          fileName: item.file.name,
        }),
      });

      const data = await res.json();

      setSelectedItems(prev =>
        prev.map(it => {
          if (it.id !== item.id) return it;
          if (data && data.name) {
            return {
              ...it,
              name: data.name,
              category: data.category || it.category,
              material: data.material || it.material,
              periodOrStyle: data.periodOrStyle || it.periodOrStyle,
              aiStatus: 'done',
            };
          }
          return {
            ...it,
            aiStatus: 'idle',
          };
        })
      );
    } catch (error) {
      console.warn("Analyse vision non disponible pour l'élément:", error);
      setSelectedItems(prev =>
        prev.map(it =>
          it.id === item.id
            ? { ...it, aiStatus: 'idle' }
            : it
        )
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const extractedFiles = await extractFilesFromDataTransfer(e.dataTransfer);
      if (extractedFiles.length > 0) {
        processFiles(extractedFiles);
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    } catch {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    }
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(it => it.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setSelectedItems(prev =>
      prev.map(it => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const handleAdjustQuantity = (id: string, delta: number) => {
    setSelectedItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const currentVal = parseInt(it.quantity, 10);
        if (!isNaN(currentVal)) {
          const newVal = Math.max(1, currentVal + delta);
          return { ...it, quantity: String(newVal) };
        }
        return it;
      })
    );
  };

  const applyQuantityToAll = (qty: string) => {
    setDefaultQuantity(qty);
    setSelectedItems(prev => prev.map(it => ({ ...it, quantity: qty })));
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);

    const newArticles: ArticleItem[] = selectedItems.map((item, idx) => {
      const sanitizedName =
        !item.name || /whatsapp\s*image/i.test(item.name) || item.name.includes('23.15.51')
          ? "Article d'Antiquité"
          : item.name;

      return {
        id: `custom-${Date.now()}-${idx}`,
        ref: '',
        name: sanitizedName,
        imageUrl: item.preview,
        imageFit: 'contain',
        folder: destinationFolder || 'Halloween',
        category: item.category || defaultCategory,
        material: item.material || '',
        periodOrStyle: item.periodOrStyle || '',
        condition: 'Bel état de conservation',
        quantity: item.quantity || '1',
        dimensions: '',
        notes: '',
      };
    });

    onAddArticles(newArticles);
    setIsProcessing(false);
    setSelectedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-[#e2d9ce]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e2d9ce] flex justify-between items-center bg-[#faf7f2]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cinzel text-lg font-bold text-[#5c3e21]">
                Importer un lot de photos d'articles
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#f0e8dd] text-[#8c6239] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-[#e2d9ce]">
                <Sparkles className="w-3 h-3" />
                Vision IA
              </span>
            </div>
            <p className="text-xs text-[#6e6259] mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#476355]" />
              <span>Consigne stricte respectée : photo originale intacte (aucun filtre, aucun recadrage).</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Destination Folder Bar */}
        <div className="px-6 py-2.5 bg-[#2a221d] text-[#f7f5f0] border-b border-[#3d3026] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#c4a482] font-semibold">📁 Destination des articles :</span>
            <select
              value={destinationFolder}
              onChange={e => setDestinationFolder(e.target.value)}
              className="bg-[#3a3029] text-white font-semibold text-xs px-2.5 py-1 rounded border border-[#52443a] focus:outline-none focus:border-[#8c6239] cursor-pointer"
            >
              {availableFolders.map(f => (
                <option key={f} value={f} className="bg-[#2a221d] text-white">
                  Dossier « {f} »
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-[#b8a796] hidden sm:inline">
            Les photos importées seront classées dans ce dossier
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Error notice if upload failed */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#c4a482] rounded-lg p-6 text-center bg-[#fdfcf9] hover:bg-[#faf6f0] cursor-pointer transition-colors group relative"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.jfif,.avif,.bmp,.gif"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2 text-[#5c3e21]">
              <div className="w-12 h-12 rounded-full bg-[#f0e8dd] flex items-center justify-center group-hover:scale-105 transition-transform">
                {isCompressing ? (
                  <Loader2 className="w-6 h-6 text-[#8c6239] animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-[#8c6239]" />
                )}
              </div>
              <p className="font-semibold text-sm">
                {isCompressing
                  ? 'Chargement des photos originales...'
                  : 'Glissez-déposez vos photos ici ou cliquez pour parcourir vos fichiers'}
              </p>
              <div className="mt-1">
                <span className="inline-block px-3 py-1 bg-[#8c6239] text-white text-xs font-semibold rounded shadow-xs group-hover:bg-[#734f2d]">
                  Sélectionner des photos sur mon appareil
                </span>
              </div>
              <p className="text-xs text-[#6e6259] mt-1">
                Formats acceptés : JPG, PNG, WEBP, HEIC (iPhone), AVIF. Vos photos originales restent intactes sans déformation.
              </p>
            </div>
          </div>

          {/* Batch Quick Adjustments (Quantity & Category) */}
          <div className="p-3 bg-[#fbf9f6] border border-[#e8dfd5] rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-700">Quantité par défaut :</span>
              {['1', '2', '4', '51', '111'].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => applyQuantityToAll(q)}
                  className={`px-2 py-1 rounded border text-[11px] font-medium transition-all ${
                    defaultQuantity === q
                      ? 'bg-[#8c6239] text-white border-[#8c6239]'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                  title={`Appliquer la quantité ${q} à tous les articles`}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-[#6e6259]">
              💡 Vous pouvez aussi ajuster la quantité individuellement sur chaque article ci-dessous.
            </div>
          </div>

          {/* Selected photos list with Vision AI identification and manual quantity controls */}
          {selectedItems.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span>{selectedItems.length} article(s) à intégrer</span>
                  {selectedItems.some(it => it.aiStatus === 'analyzing') && (
                    <span className="text-[11px] font-normal text-[#8c6239] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyse Vision IA en cours...
                    </span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Tout effacer
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                {selectedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-md text-xs hover:border-[#c4a482] transition-colors"
                  >
                    {/* Intact Original Image Thumbnail (object-contain, uncropped, no filter) */}
                    <div className="w-16 h-16 rounded border border-stone-300 bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      <img
                        src={item.preview}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    {/* Middle: AI Detected Name + Status */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {item.aiStatus === 'analyzing' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8c6239] bg-[#f5ede2] px-1.5 py-0.5 rounded border border-[#e8dfd5]">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            Détection IA...
                          </span>
                        )}
                        {item.aiStatus === 'done' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Nom détecté par IA
                          </span>
                        )}
                        {item.aiStatus === 'error' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                            Nom automatique
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 font-mono">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Name input */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(item.id, { name: e.target.value })}
                        placeholder="Nom simple et direct de l'article"
                        className="w-full font-semibold px-2.5 py-1 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-stone-800"
                      />

                      {/* Extra info (category, style if detected) */}
                      {(item.category || item.periodOrStyle) && (
                        <div className="text-[10px] text-stone-500 flex items-center gap-2 truncate">
                          {item.category && <span>{item.category}</span>}
                          {item.periodOrStyle && <span>• {item.periodOrStyle}</span>}
                        </div>
                      )}
                    </div>

                    {/* Right: Manual Quantity Control */}
                    <div className="flex items-center gap-2 justify-between sm:justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                      <div className="flex flex-col items-start sm:items-end">
                        <label className="text-[10px] font-semibold uppercase text-stone-500 mb-0.5">
                          Quantité :
                        </label>
                        <div className="flex items-center rounded border border-stone-300 bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(item.id, -1)}
                            className="p-1 hover:bg-stone-100 text-stone-600 border-r border-stone-200"
                            title="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={e => updateItem(item.id, { quantity: e.target.value })}
                            className="w-14 text-center font-bold text-xs py-0.5 focus:outline-none text-[#5c3e21]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(item.id, 1)}
                            className="p-1 hover:bg-stone-100 text-stone-600 border-l border-stone-200"
                            title="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Re-analyze with Vision AI button */}
                      <button
                        type="button"
                        onClick={() => {
                          updateItem(item.id, { aiStatus: 'analyzing' });
                          analyzeItemWithVisionAI(item);
                        }}
                        className="p-1.5 text-stone-400 hover:text-[#8c6239] rounded border border-transparent hover:border-stone-200 transition-colors"
                        title="Ré-analyser par Vision IA"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${item.aiStatus === 'analyzing' ? 'animate-spin text-[#8c6239]' : ''}`} />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded transition-colors"
                        title="Retirer cette photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#e2d9ce] bg-[#faf7f2] flex justify-between items-center">
          <span className="text-xs text-[#6e6259]">
            {selectedItems.length === 0
              ? 'Sélectionnez au moins une photo pour commencer'
              : `${selectedItems.length} article(s) prêt(s) à être ajouté(s) au catalogue CASA MADRE`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded border border-stone-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0 || isProcessing}
              onClick={handleSubmit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8c6239] hover:bg-[#734f2d] disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Intégrer au catalogue CASA MADRE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
