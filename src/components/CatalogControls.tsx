import React from 'react';
import { 
  Sun,
  Moon, 
  LayoutGrid, 
  Printer, 
  Sliders, 
  Settings2,
  Eye,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CatalogConfig, LayoutMode, ThemeId } from '../types';

interface CatalogControlsProps {
  config: CatalogConfig;
  onChangeConfig: (newConfig: CatalogConfig) => void;
  totalPages?: number;
  totalArticles?: number;
  onPrint?: () => void;
}

export const CatalogControls: React.FC<CatalogControlsProps> = ({
  config,
  onChangeConfig,
  totalPages,
  totalArticles,
  onPrint,
}) => {
  const updateField = <K extends keyof CatalogConfig>(key: K, value: CatalogConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-[#1d1713] border-b border-[#e2d9ce] dark:border-[#382d24] px-4 py-2 flex items-center justify-between gap-3 text-xs shadow-xs no-print transition-colors overflow-x-auto whitespace-nowrap scrollbar-thin">
      {/* Paramètres organisés sur une seule ligne */}
      <div className="flex items-center gap-3 sm:gap-4 flex-nowrap flex-shrink-0">
        {/* Layout Mode Selector (Liste déroulante) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <LayoutGrid className="w-3.5 h-3.5 text-[#8c6239] dark:text-[#d4a373] flex-shrink-0" />
          <label htmlFor="catalog-layout-select" className="font-semibold text-stone-700 dark:text-[#d6c5b2] text-xs select-none">
            Disposition :
          </label>
          <select
            id="catalog-layout-select"
            value={config.layoutMode}
            onChange={(e) => updateField('layoutMode', e.target.value as LayoutMode)}
            className="bg-stone-50 dark:bg-[#251d18] text-stone-800 dark:text-[#faebd7] border border-stone-300 dark:border-[#3d2f25] rounded-md px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] outline-hidden cursor-pointer shadow-xs"
          >
            <option value="2-per-page">2 articles / page</option>
            <option value="1-per-page">1 article / page</option>
            <option value="4-per-page">4 articles / page</option>
            <option value="3-horizontal">3 articles / page</option>
          </select>
        </div>

        {/* Séparateur */}
        <div className="h-4 w-px bg-stone-300 dark:bg-[#3d2f25] flex-shrink-0" />

        {/* Theme Selector (Liste déroulante) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-semibold text-stone-700 dark:text-[#d6c5b2] text-xs select-none">
            Thème :
          </span>
          <select
            id="catalog-theme-select"
            value={config.themeId}
            onChange={(e) => updateField('themeId', e.target.value as ThemeId)}
            className="bg-stone-50 dark:bg-[#251d18] text-stone-800 dark:text-[#faebd7] border border-stone-300 dark:border-[#3d2f25] rounded-md px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] outline-hidden cursor-pointer shadow-xs"
          >
            <option value="clair">Clair (Impression)</option>
            <option value="fonce">Foncé (Galerie)</option>
          </select>
        </div>

        {/* Séparateur */}
        <div className="h-4 w-px bg-stone-300 dark:bg-[#3d2f25] flex-shrink-0" />

        {/* Options / Cases à cocher */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <label 
            className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 dark:text-[#d6c5b2] font-medium select-none bg-stone-50 dark:bg-[#251d18] px-2 py-1 rounded border border-stone-300 dark:border-[#3d2f25] shadow-xs flex-shrink-0" 
            title="Amélioration de clarté, netteté et encadrement haute définition des contours"
          >
            <input
              type="checkbox"
              checked={config.cleanScanEffect !== false}
              onChange={e => updateField('cleanScanEffect', e.target.checked)}
              className="rounded text-[#8c6239] focus:ring-[#8c6239] cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span>Effet Scan Propre</span>
              <span className="text-[9px] bg-[#8c6239]/15 text-[#5c3e21] dark:text-amber-200 px-1 rounded font-bold">HD</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-600 dark:text-[#a89989] select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={config.showPrices}
              onChange={e => updateField('showPrices', e.target.checked)}
              className="rounded text-[#8c6239] focus:ring-[#8c6239] cursor-pointer"
            />
            <span>Afficher prix</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-600 dark:text-[#a89989] select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={config.headerEveryPage}
              onChange={e => updateField('headerEveryPage', e.target.checked)}
              className="rounded text-[#8c6239] focus:ring-[#8c6239] cursor-pointer"
            />
            <span>En-tête sur chaque page</span>
          </label>
        </div>
      </div>

      {/* Option Imprimer A4 (remplace le badge 20 pages A4 40 articles) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          id="catalog-print-a4-btn"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#8c6239] hover:bg-[#734f2d] active:bg-[#5c3e21] text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex-shrink-0 cursor-pointer"
          title="Ouvrir les options d'impression A4 (toutes les pages, sélection par page, aperçu propre ou PDF)"
        >
          <Printer className="w-3.5 h-3.5 text-amber-200" />
          <span>Option Imprimer A4</span>
        </button>
      </div>
    </div>
  );
};
