import React, { useState } from 'react';
import { Printer, Download, ExternalLink, X, CheckCircle2, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { ArticleItem, CatalogConfig } from '../types';
import { COLOR_THEMES } from '../data/defaultCatalog';
import { openPrintWindow } from '../utils/pdfExport';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleItem[];
  config: CatalogConfig;
  totalPages: number;
  onDownloadPDF: () => void;
  isExporting: boolean;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  articles,
  config,
  totalPages,
  onDownloadPDF,
  isExporting,
}) => {
  const [printScope, setPrintScope] = useState<'all' | 'single'>('all');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTheme = COLOR_THEMES[config.themeId] || COLOR_THEMES.clair;

  const handleDirectPrint = () => {
    setStatusFeedback("Préparation de l'impression...");
    try {
      // Direct print trigger
      window.print();
      setStatusFeedback("Boîte d'impression lancée.");
      setTimeout(() => {
        onClose();
        setStatusFeedback(null);
      }, 1500);
    } catch (err) {
      console.warn("L'impression directe a rencontré une restriction, ouverture dans un nouvel onglet...", err);
      // Fallback: open clean print window
      handleOpenCleanWindow();
    }
  };

  const handleOpenCleanWindow = () => {
    setStatusFeedback("Ouverture du catalogue prêt à imprimer...");
    openPrintWindow(articles, config, currentTheme, printScope === 'single' ? selectedPage : undefined);
    setTimeout(() => {
      onClose();
      setStatusFeedback(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-fade-in">
      <div 
        className="bg-[#241e1a] text-[#f7f5f0] border border-[#4a3e35] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#3d332c] flex items-center justify-between bg-[#2a221d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#8c6239] text-[#faf6f0] flex items-center justify-center shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-cinzel text-base font-bold text-[#faf6f0]">
                Imprimer le Catalogue A4
              </h2>
              <p className="text-[11px] text-[#c4b5a5]">
                Mise en page certifiée 210 × 297 mm — {articles.length} articles ({totalPages} {totalPages > 1 ? 'pages' : 'page'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-[#d9cebe]">
          {statusFeedback && (
            <div className="p-2.5 rounded bg-[#8c6239]/20 border border-[#8c6239]/50 text-[#f5ebd9] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c4a482] animate-pulse" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Page scope selection */}
          <div className="p-3 bg-[#1d1815] rounded border border-[#3d332c] space-y-2">
            <label className="font-semibold text-stone-200 block">
              Pages à imprimer :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintScope('all')}
                className={`px-3 py-2 rounded text-left border transition-all flex items-center justify-between ${
                  printScope === 'all'
                    ? 'bg-[#3d3128] border-[#a87f54] text-white font-medium shadow-xs'
                    : 'bg-[#2a221d] border-[#44382f] text-stone-300 hover:border-stone-500'
                }`}
              >
                <span>Tout le catalogue</span>
                <span className="text-[10px] font-mono opacity-75">{totalPages} p.</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintScope('single')}
                className={`px-3 py-2 rounded text-left border transition-all flex items-center justify-between ${
                  printScope === 'single'
                    ? 'bg-[#3d3128] border-[#a87f54] text-white font-medium shadow-xs'
                    : 'bg-[#2a221d] border-[#44382f] text-stone-300 hover:border-stone-500'
                }`}
              >
                <span>Une page précise</span>
                <span className="text-[10px] font-mono opacity-75">Page {selectedPage}</span>
              </button>
            </div>

            {printScope === 'single' && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-[11px] text-stone-400">Sélectionner la page :</span>
                <select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(Number(e.target.value))}
                  className="bg-[#2a221d] border border-[#52443a] rounded px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-[#a87f54]"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Feuille A4 - Page {num} / {totalPages}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3 Print Options */}
          <div className="space-y-2.5">
            {/* Option 1: Direct print */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="w-full px-4 py-3 rounded bg-[#8c6239] hover:bg-[#a07142] text-[#faf6f0] font-semibold flex items-center justify-between transition-all shadow-md group border border-[#b38555]"
            >
              <div className="flex items-center gap-3 text-left">
                <Printer className="w-5 h-5 text-amber-200 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold">Lancer l'impression directe</div>
                  <div className="text-[11px] text-amber-100/80 font-normal">
                    Ouvre la boîte de dialogue d'impression de votre ordinateur
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded">Ctrl + P</span>
            </button>

            {/* Option 2: Clean new tab */}
            <button
              type="button"
              onClick={handleOpenCleanWindow}
              className="w-full px-4 py-3 rounded bg-[#352c25] hover:bg-[#43382f] text-[#f0e8dd] font-medium flex items-center justify-between transition-all border border-[#52443a] group"
            >
              <div className="flex items-center gap-3 text-left">
                <ExternalLink className="w-5 h-5 text-[#c4a482] flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Ouvrir dans une nouvelle page pour imprimer</div>
                  <div className="text-[11px] text-[#c4b5a5]">
                    Recommandé si votre navigateur bloque l'aperçu dans cette fenêtre
                  </div>
                </div>
              </div>
            </button>

            {/* Option 3: PDF export */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onDownloadPDF();
              }}
              disabled={isExporting}
              className="w-full px-4 py-3 rounded bg-[#2a221d] hover:bg-[#382d26] text-[#e3d8cc] font-medium flex items-center justify-between transition-all border border-[#44382f] disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3 text-left">
                <Download className="w-5 h-5 text-[#a88767] flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Télécharger le PDF A4 Haute Définition</div>
                  <div className="text-[11px] text-[#a89a8c]">
                    Génère un fichier .pdf fidèle à 100% que vous pouvez imprimer à tout moment
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Practical print advice */}
          <div className="p-3 bg-[#1e1916] rounded border border-[#352b24] text-[11px] space-y-1 text-[#b5a798]">
            <div className="flex items-center gap-1.5 font-semibold text-[#d6c5b2]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conseils pour une impression parfaite :</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[10.5px]">
              <li><strong>Marges :</strong> Dans les paramètres d'impression, choisissez <em>« Aucune »</em> ou <em>« Par défaut »</em>.</li>
              <li><strong>Graphiques d'arrière-plan :</strong> Cochez cette case pour conserver les encadrements et la texture de page.</li>
              <li><strong>Format de papier :</strong> Sélectionnez <em>A4 (210 × 297 mm)</em>.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#3d332c] bg-[#1d1815] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#352c25] hover:bg-[#44382f] text-xs font-medium text-[#d9cebe] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
