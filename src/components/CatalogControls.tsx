import React from 'react';
import { 
  Sun,
  Moon, 
  LayoutGrid, 
  FileText, 
  Sliders, 
  Settings2,
  Eye,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CatalogConfig, LayoutMode, ThemeId } from '../types';
import { THEMES } from '../data/defaultCatalog';

interface CatalogControlsProps {
  config: CatalogConfig;
  onChangeConfig: (newConfig: CatalogConfig) => void;
  totalPages: number;
  totalArticles: number;
}

export const CatalogControls: React.FC<CatalogControlsProps> = ({
  config,
  onChangeConfig,
  totalPages,
  totalArticles,
}) => {
  const updateField = <K extends keyof CatalogConfig>(key: K, value: CatalogConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const isDark = config.themeId === 'fonce';

  return (
    <div className="bg-white border-b border-[#e2d9ce] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs no-print">
      {/* Left controls: Layout & Theme */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        {/* Layout Mode Selector */}
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-[#8c6239]" />
          <span className="font-semibold text-stone-700">Disposition :</span>
          <div className="inline-flex rounded-md border border-stone-200 p-0.5 bg-stone-50">
            <button
              type="button"
              onClick={() => updateField('layoutMode', '2-per-page')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                config.layoutMode === '2-per-page'
                  ? 'bg-white text-[#5c3e21] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="2 articles par page (Format équilibré et élégant)"
            >
              2 / page
            </button>
            <button
              type="button"
              onClick={() => updateField('layoutMode', '1-per-page')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                config.layoutMode === '1-per-page'
                  ? 'bg-white text-[#5c3e21] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="1 grand article par page (Fiche d'expertise & galerie)"
            >
              1 / page
            </button>
            <button
              type="button"
              onClick={() => updateField('layoutMode', '4-per-page')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                config.layoutMode === '4-per-page'
                  ? 'bg-white text-[#5c3e21] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="4 articles par page (Grille 2x2 compacte)"
            >
              4 / page
            </button>
            <button
              type="button"
              onClick={() => updateField('layoutMode', '3-horizontal')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                config.layoutMode === '3-horizontal'
                  ? 'bg-white text-[#5c3e21] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="3 articles par page (Bandeaux horizontaux)"
            >
              3 / page
            </button>
          </div>
        </div>

        {/* Theme Selector: Clair ou Foncé */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Thème :</span>
          <div className="inline-flex rounded-md border border-stone-200 p-0.5 bg-stone-50">
            <button
              type="button"
              onClick={() => updateField('themeId', 'clair')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                !isDark
                  ? 'bg-white text-[#8c6239] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Thème Clair : Fond blanc pur muséal, idéal pour impression"
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>Clair</span>
            </button>
            <button
              type="button"
              onClick={() => updateField('themeId', 'fonce')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#241e1a] text-[#f5f2ed] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Thème Foncé : Ambiance galerie d'art et dorures antiques"
            >
              <Moon className="w-3.5 h-3.5 text-amber-300" />
              <span>Foncé</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right controls: Options & Toggles */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Toggles */}
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 font-medium select-none bg-stone-50 px-2 py-0.5 rounded border border-stone-200" title="Amélioration de clarté, netteté et encadrement haute définition des contours">
          <input
            type="checkbox"
            checked={config.cleanScanEffect !== false}
            onChange={e => updateField('cleanScanEffect', e.target.checked)}
            className="rounded text-[#8c6239] focus:ring-[#8c6239]"
          />
          <span className="flex items-center gap-1">
            <span>Effet Scan Propre</span>
            <span className="text-[9px] bg-[#8c6239]/15 text-[#5c3e21] px-1 rounded font-bold">HD</span>
          </span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-600 select-none">
          <input
            type="checkbox"
            checked={config.showPrices}
            onChange={e => updateField('showPrices', e.target.checked)}
            className="rounded text-[#8c6239] focus:ring-[#8c6239]"
          />
          <span>Afficher prix</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-600 select-none">
          <input
            type="checkbox"
            checked={config.headerEveryPage}
            onChange={e => updateField('headerEveryPage', e.target.checked)}
            className="rounded text-[#8c6239] focus:ring-[#8c6239]"
          />
          <span>En-tête sur chaque page</span>
        </label>

        {/* Page counter pill */}
        <div className="px-2.5 py-1 bg-[#faf7f2] border border-[#e2d9ce] rounded text-[11px] font-medium text-[#5c3e21] flex items-center gap-1">
          <FileText className="w-3 h-3 text-[#8c6239]" />
          <span>
            {totalPages} page{totalPages > 1 ? 's' : ''} A4 ({totalArticles} article{totalArticles > 1 ? 's' : ''})
          </span>
        </div>
      </div>
    </div>
  );
};
