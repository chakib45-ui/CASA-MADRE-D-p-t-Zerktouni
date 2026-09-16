import React from 'react';
import { 
  Download, 
  Printer, 
  Sliders, 
  Camera,
  Search,
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileCheck,
  FileSpreadsheet,
  Sun,
  Moon
} from 'lucide-react';

import { ArticleItem, CatalogConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';

interface HeaderProps {
  config?: CatalogConfig;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchResultCount?: number;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  onPrint: () => void;
  onOpenHeaderSettings: () => void;
  onOpenBatchUpload?: () => void;
  onOpenScanner?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isExporting: boolean;
  exportStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  config = DEFAULT_CONFIG,
  searchQuery = '',
  onSearchChange,
  searchResultCount,
  onDownloadPDF,
  onDownloadExcel,
  onPrint,
  onOpenHeaderSettings,
  onOpenBatchUpload,
  onOpenScanner,
  isDarkMode = false,
  onToggleDarkMode,
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
          </div>
          <p className="font-garamond italic text-xs text-[#c4b5a5] mt-0.5">
            Inventaire interactif & Catalogue A4 professionnel haute définition
          </p>
        </div>
      </div>

      {/* Barre de recherche globale (sur l'ensemble des dossiers) */}
      {onSearchChange && (
        <div className="flex-1 min-w-[200px] sm:min-w-[240px] max-w-sm lg:max-w-md my-1 order-3 lg:order-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-[#c4b5a5] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onSearchChange('');
              }}
              placeholder="Rechercher par nom ou référence (tous dossiers)..."
              className="w-full pl-9 pr-16 py-1.5 bg-[#1e1713] text-[#f7f5f0] placeholder-[#8e7e70] text-xs rounded-md border border-[#52443a] focus:outline-none focus:border-[#c4a482] focus:ring-1 focus:ring-[#8c6239] transition-all shadow-inner"
              title="Rechercher des articles par nom ou par référence sur l'ensemble des dossiers"
            />
            {/* Counter badge & clear button */}
            <div className="absolute right-2 flex items-center gap-1.5">
              {searchQuery.trim() !== '' && searchResultCount !== undefined && (
                <span 
                  className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#8c6239]/40 text-[#f5ebd9] border border-[#8c6239]/60 select-none"
                  title={`${searchResultCount} article(s) trouvé(s) sur tous les dossiers`}
                >
                  {searchResultCount}
                </span>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-stone-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                  title="Effacer la recherche globale"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center gap-2 order-2 lg:order-3">
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

        {/* Scanner / Live Camera */}
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-3 py-1.5 text-xs font-semibold text-[#fef6ea] bg-gradient-to-r from-[#8c6239] to-[#a37344] hover:from-[#9c6e40] hover:to-[#b3804d] rounded border border-[#c4a482]/60 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Scanner / Photographier en direct avec la caméra pour le dossier actif"
          >
            <Camera className="w-3.5 h-3.5 text-[#ffdca8]" />
            <span>Scanner</span>
          </button>
        )}

        {/* Mode Sombre / Dark Mode UI Toggle */}
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`px-3 py-1.5 text-xs font-semibold rounded border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isDarkMode
                ? 'bg-[#47382b] text-amber-300 border-[#7a5f47] hover:bg-[#574536]'
                : 'bg-[#352c25] text-[#e8dacb] border-[#52443a] hover:bg-[#43382f]'
            }`}
            title={isDarkMode ? 'Passer en Mode Clair' : 'Activer le Mode Sombre pour réduire la fatigue visuelle lors de la saisie'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Mode Clair</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Mode Sombre</span>
              </>
            )}
          </button>
        )}

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
