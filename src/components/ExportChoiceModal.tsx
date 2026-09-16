import React from 'react';
import { X, Download, FileSpreadsheet, FileText, Layers, Check } from 'lucide-react';
import { ArticleItem } from '../types';

interface ExportChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'pdf' | 'excel';
  activeFolder: string;
  totalArticlesCount: number;
  activeFolderArticlesCount: number;
  onConfirmExport: (scope: 'active' | 'all') => void;
  isExporting?: boolean;
}

export const ExportChoiceModal: React.FC<ExportChoiceModalProps> = ({
  isOpen,
  onClose,
  exportType,
  activeFolder,
  totalArticlesCount,
  activeFolderArticlesCount,
  onConfirmExport,
  isExporting = false,
}) => {
  if (!isOpen) return null;

  const isPdf = exportType === 'pdf';
  const effectiveFolder = activeFolder === 'all' ? 'Tous les dossiers' : activeFolder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div
        className="bg-white dark:bg-[#1e1712] rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-[#e2d9ce] dark:border-[#3d2f24] animate-fade-in transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#e2d9ce] dark:border-[#382b21] flex justify-between items-center bg-[#faf7f2] dark:bg-[#261d17]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#8c6239] text-white flex items-center justify-center">
              {isPdf ? <Download className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-cinzel text-sm font-bold text-[#5c3e21] dark:text-[#f3dfcc]">
                {isPdf ? 'Télécharger le catalogue PDF' : 'Exporter l\'inventaire Excel (.xlsx)'}
              </h2>
              <p className="text-[10.5px] text-[#6e6259] dark:text-[#a8988a]">
                Choisissez le périmètre d'exportation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Options */}
        <div className="p-5 space-y-3 text-xs">
          {/* Active folder option */}
          {activeFolder !== 'all' && (
            <button
              type="button"
              disabled={isExporting}
              onClick={() => {
                onConfirmExport('active');
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-lg border-2 border-[#8c6239]/40 dark:border-[#8c6239]/60 hover:border-[#8c6239] dark:hover:border-[#c4a482] bg-[#faf7f2] dark:bg-[#281f18] hover:bg-[#f3ece0] dark:hover:bg-[#322720] transition-all flex items-start justify-between gap-3 group cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[#5c3e21] dark:text-[#f3dfcc] text-sm">
                  <span>📂 Dossier actif : « {effectiveFolder} »</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 text-[11px] mt-1">
                  Exporte uniquement les <span className="font-semibold text-[#8c6239] dark:text-[#d4a373]">{activeFolderArticlesCount} article(s)</span> de ce dossier.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#8c6239] text-white font-semibold text-[10.5px] group-hover:bg-[#734f2d] flex-shrink-0 mt-0.5">
                Exporter ce dossier
              </span>
            </button>
          )}

          {/* All folders option */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => {
              onConfirmExport('all');
              onClose();
            }}
            className="w-full text-left p-3.5 rounded-lg border border-stone-200 dark:border-[#3d2f24] hover:border-[#8c6239] dark:hover:border-[#c4a482] bg-white dark:bg-[#241c16] hover:bg-stone-50 dark:hover:bg-[#2d221b] transition-all flex items-start justify-between gap-3 group cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-[#f3dfcc] text-sm">
                <span>📁 Inventaire complet (Global)</span>
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-1">
                Exporte la totalité des <span className="font-semibold text-stone-800 dark:text-stone-200">{totalArticlesCount} articles</span> de tous les dossiers combinés.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-stone-100 dark:bg-[#33261c] group-hover:bg-[#8c6239] text-stone-700 dark:text-[#dfd4c7] group-hover:text-white font-semibold text-[10.5px] flex-shrink-0 mt-0.5 transition-colors">
              Exporter tout
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-[#382b21] bg-stone-50 dark:bg-[#241c16] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-stone-600 dark:text-[#dfd4c7] hover:bg-stone-200 dark:hover:bg-[#33261c] rounded border border-stone-300 dark:border-[#4d3b2d] cursor-pointer"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
