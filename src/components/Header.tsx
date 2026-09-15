import React from 'react';
import { 
  Download, 
  Printer, 
  Sliders, 
  Upload, 
  Sparkles,
  BookOpen,
  HelpCircle,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';

import { ArticleItem, CatalogConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';

interface HeaderProps {
  config?: CatalogConfig;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  onPrint: () => void;
  onOpenHeaderSettings: () => void;
  onOpenBatchUpload: () => void;
  isExporting: boolean;
  exportStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  config = DEFAULT_CONFIG,
  onDownloadPDF,
  onDownloadExcel,
  onPrint,
  onOpenHeaderSettings,
  onOpenBatchUpload,
  isExporting,
  exportStatus,
}) => {
  const safeConfig = config || DEFAULT_CONFIG;
  return (
    <header className="bg-[#2a221d] text-[#f7f5f0] border-b border-[#3d332c] px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 no-print shadow-md">
      {/* Brand & Subtitle & Collection Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-[#8c6239] text-[#f7f5f0] flex items-center justify-center font-cinzel font-bold text-lg shadow-inner border border-[#a87f54] flex-shrink-0">
          CM
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-cinzel text-lg sm:text-xl font-bold tracking-[0.15em] text-[#faf6f0] leading-none">
              {safeConfig.mainTitle || 'CASA MADRE'}
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#41362f] text-[#d6c5b2] tracking-wider border border-[#52443a]">
              {safeConfig.subtitle || 'Dépôt Zerktouni'}
            </span>
            {safeConfig.collection && (
              <span className="text-[10px] uppercase font-sans font-semibold px-2 py-0.5 rounded bg-[#8c6239]/40 text-[#f5ebd9] border border-[#8c6239] tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e89a43] inline-block" />
                Thème : {safeConfig.collection}
              </span>
            )}
          </div>
          <p className="font-garamond italic text-xs text-[#c4b5a5] mt-0.5">
            Inventaire interactif & Catalogue A4 professionnel haute définition
          </p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* En-tête customize */}
        <button
          type="button"
          onClick={onOpenHeaderSettings}
          className="px-3 py-1.5 text-xs font-medium text-[#d9cebe] hover:text-white bg-[#3a3029] hover:bg-[#4a3e35] rounded border border-[#52443a] flex items-center gap-1.5 transition-colors"
          title="Modifier l'en-tête, sous-titre, date et coordonnées"
        >
          <Sliders className="w-3.5 h-3.5 text-[#c4a482]" />
          <span className="hidden md:inline">En-tête & Infos</span>
        </button>

        {/* Upload photos */}
        <button
          type="button"
          onClick={onOpenBatchUpload}
          className="px-3 py-1.5 text-xs font-medium text-[#f0e8dd] bg-[#4a3a2d] hover:bg-[#5c4938] rounded border border-[#6b5542] flex items-center gap-1.5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-[#d9b896]" />
          <span>Importer photos</span>
        </button>

        {/* Print / System PDF */}
        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-1.5 text-xs font-semibold text-stone-200 bg-[#352c25] hover:bg-[#43382f] rounded border border-[#5c4b3f] flex items-center gap-1.5 transition-colors"
          title="Ouvrir la boîte d'impression ou enregistrer en PDF via le navigateur"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Imprimer</span>
        </button>

        {/* Download Excel (.xlsx) */}
        <button
          type="button"
          onClick={onDownloadExcel}
          className="px-3.5 py-1.5 text-xs font-semibold text-emerald-100 bg-[#1e432b] hover:bg-[#255436] rounded border border-[#2f6643] shadow-xs flex items-center gap-1.5 transition-colors"
          title="Télécharger le fichier Excel (.xlsx) structuré pour la gestion de stock"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
          <span>Stock Excel (.xlsx)</span>
        </button>

        {/* Direct Download PDF */}
        <button
          type="button"
          disabled={isExporting}
          onClick={onDownloadPDF}
          className="px-4 py-1.5 text-xs font-bold text-white bg-[#8c6239] hover:bg-[#734f2d] disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-md flex items-center gap-2 transition-all"
        >
          {isExporting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{exportStatus || 'Export en cours...'}</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le PDF</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
