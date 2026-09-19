import React from 'react';
import { 
  FolderPlus, 
  Edit3, 
  ArrowLeft,
  FolderTree,
  Search,
  X,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { ArticleItem, CatalogConfig, LayoutMode, ThemeId } from '../types';

interface FolderControlBarProps {
  folders: string[];
  activeFolder: string;
  articles: ArticleItem[];
  globalSearch?: string;
  onClearGlobalSearch?: () => void;
  onChangeFolder: (folder: string) => void;
  onOpenNewFolder: () => void;
  onOpenEditFolder: () => void;
  onBackFolder?: () => void;
  config?: CatalogConfig;
  onChangeConfig?: (config: CatalogConfig) => void;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export const FolderControlBar: React.FC<FolderControlBarProps> = ({
  folders,
  activeFolder,
  articles,
  globalSearch = '',
  onClearGlobalSearch,
  onChangeFolder,
  onOpenNewFolder,
  onOpenEditFolder,
  onBackFolder,
  config,
  onChangeConfig,
  isSidebarVisible = true,
  onToggleSidebar,
}) => {
  // Count articles per folder
  const getCountForFolder = (folderName: string) => {
    return articles.filter(a => (a.folder || 'Antiquités').toLowerCase() === folderName.toLowerCase()).length;
  };

  const totalCount = articles.length;

  const updateConfigField = <K extends keyof CatalogConfig>(key: K, value: CatalogConfig[K]) => {
    if (config && onChangeConfig) {
      onChangeConfig({
        ...config,
        [key]: value,
      });
    }
  };

  const importTargetFolder = activeFolder === 'all' 
    ? (folders.includes('Halloween') ? 'Halloween' : folders[0] || 'Antiquités') 
    : activeFolder;

  return (
    <div className="w-full bg-[#241c17] text-[#f7f5f0] border-b border-[#3d3026] px-3 sm:px-6 py-2 flex flex-nowrap items-center justify-between gap-3 text-xs no-print shadow-inner overflow-x-auto whitespace-nowrap scrollbar-thin">
      {/* Left side: Directly underneath Casa Madre — Sidebar toggle + Folder controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-nowrap flex-shrink-0">
        {/* Bouton pour Masquer / Montrer la liste d'articles */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 shadow-xs select-none border ${
              isSidebarVisible
                ? 'bg-[#382b22] hover:bg-[#48372c] text-[#e8d7c3] hover:text-white border-[#544133]'
                : 'bg-[#8c6239] hover:bg-[#734f2d] text-white border-[#b08151] ring-1 ring-[#c4a482]/60'
            }`}
            title={isSidebarVisible ? 'Masquer la liste des articles à gauche' : 'Montrer la liste des articles à gauche'}
          >
            {isSidebarVisible ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-[#c4a482]" />
                <span>Masquer liste</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-amber-200" />
                <span>Montrer liste</span>
              </>
            )}
          </button>
        )}

        {/* Séparateur vertical */}
        <div className="w-px h-5 bg-[#3d3026] flex-shrink-0" />

        {/* Label & Folder icon */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-5 h-5 rounded bg-[#8c6239]/80 border border-[#a87f54] text-[#faf6f0] flex items-center justify-center flex-shrink-0">
            <FolderTree className="w-3 h-3" />
          </div>
          <span className="font-cinzel font-bold text-xs tracking-wide text-[#e8d7c3] select-none">
            Dossier :
          </span>
        </div>

        {/* Liste Déroulante (Dropdown) */}
        <div className="relative inline-block min-w-[170px] sm:min-w-[210px] flex-shrink-0">
          <select
            value={activeFolder}
            onChange={e => onChangeFolder(e.target.value)}
            className="w-full appearance-none bg-[#362b23] hover:bg-[#43352b] text-[#faf6f0] font-medium text-xs px-2.5 py-1.5 pr-7 rounded border border-[#5a483b] focus:outline-none focus:ring-1 focus:ring-[#c4a482] cursor-pointer transition-colors shadow-xs"
            title="Choisir et basculer entre les dossiers"
          >
            {folders.map(f => {
              const count = getCountForFolder(f);
              return (
                <option key={f} value={f} className="bg-[#2a221d] text-white">
                  📂 {f} ({count} article{count > 1 ? 's' : ''})
                </option>
              );
            })}
            <option value="all" className="bg-[#2a221d] text-[#e8cbb0] font-semibold">
              📁 Tous les dossiers ({totalCount})
            </option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#c4a482]">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Bouton "+ Nouveau dossier" */}
        <button
          type="button"
          onClick={onOpenNewFolder}
          className="px-2.5 py-1.5 bg-[#8c6239] hover:bg-[#734f2d] text-white font-medium text-xs rounded border border-[#aa7a4a] flex items-center gap-1 shadow-xs transition-colors cursor-pointer flex-shrink-0"
          title="Créer un nouveau dossier thématique"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">+ Nouveau</span>
        </button>

        {/* Bouton "Modifier dossier" */}
        <button
          type="button"
          onClick={onOpenEditFolder}
          disabled={activeFolder === 'all'}
          className="px-2.5 py-1.5 bg-[#3a2e26] hover:bg-[#4d3d32] disabled:opacity-40 disabled:cursor-not-allowed text-[#dfd4c5] hover:text-white font-medium text-xs rounded border border-[#524136] flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
          title={activeFolder === 'all' ? 'Sélectionnez un dossier spécifique pour le modifier' : `Modifier ou renommer le dossier "${activeFolder}"`}
        >
          <Edit3 className="w-3.5 h-3.5 text-[#c4a482]" />
          <span className="hidden sm:inline">Modifier</span>
        </button>

        {/* Bouton "⬅️ Retour" */}
        {onBackFolder && (
          <button
            type="button"
            onClick={onBackFolder}
            className="px-2.5 py-1.5 bg-[#2a211a] hover:bg-[#3d3026] text-[#dfd4c5] hover:text-white font-medium text-xs rounded border border-[#4a392e] flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
            title="Revenir au dossier Antiquités ou réinitialiser le filtre"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#c4a482]" />
            <span>Retour</span>
          </button>
        )}

        {/* Global search status badge if active */}
        {globalSearch && globalSearch.trim().length > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#8c6239]/40 border border-[#c4a482]/60 text-[#fbf4ea] text-[11px] shadow-2xs flex-shrink-0">
            <Search className="w-3 h-3 text-amber-300 flex-shrink-0" />
            <span className="hidden md:inline">Global : « <strong>{globalSearch}</strong> »</span>
            {onClearGlobalSearch && (
              <button
                type="button"
                onClick={onClearGlobalSearch}
                className="ml-0.5 p-0.5 text-[#d9c4b0] hover:text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
                title="Désactiver le filtre de recherche globale"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side: Catalog layout & display controls extended across the bar */}
      {config && onChangeConfig && (
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap flex-shrink-0 pl-2">
          {/* Layout Mode Selector */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LayoutGrid className="w-3.5 h-3.5 text-[#c4a482] flex-shrink-0" />
            <label htmlFor="bar-layout-select" className="font-medium text-[#d6c5b2] text-xs select-none hidden lg:inline">
              Disposition :
            </label>
            <select
              id="bar-layout-select"
              value={config.layoutMode}
              onChange={(e) => updateConfigField('layoutMode', e.target.value as LayoutMode)}
              className="bg-[#362b23] hover:bg-[#43352b] text-[#faf6f0] border border-[#5a483b] rounded px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#c4a482] cursor-pointer shadow-xs"
              title="Nombre d'articles par page A4"
            >
              <option value="2-per-page">2 articles / page</option>
              <option value="1-per-page">1 article / page</option>
              <option value="4-per-page">4 articles / page</option>
              <option value="3-horizontal">3 articles / page</option>
            </select>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="font-medium text-[#d6c5b2] text-xs select-none hidden xl:inline">
              Thème :
            </span>
            <select
              id="bar-theme-select"
              value={config.themeId}
              onChange={(e) => updateConfigField('themeId', e.target.value as ThemeId)}
              className="bg-[#362b23] hover:bg-[#43352b] text-[#faf6f0] border border-[#5a483b] rounded px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#c4a482] cursor-pointer shadow-xs"
              title="Thème de couleur du catalogue A4"
            >
              <option value="clair">Thème Clair</option>
              <option value="fonce">Thème Galerie</option>
            </select>
          </div>

          {/* Clean Scan HD effect checkbox */}
          <label 
            className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#dfd4c5] hover:text-white font-medium select-none bg-[#362b23] hover:bg-[#43352b] px-2.5 py-1.5 rounded border border-[#5a483b] shadow-xs flex-shrink-0 transition-colors" 
            title="Amélioration automatique de netteté HD et contours"
          >
            <input
              type="checkbox"
              checked={config.cleanScanEffect !== false}
              onChange={e => updateConfigField('cleanScanEffect', e.target.checked)}
              className="rounded text-[#8c6239] focus:ring-[#8c6239] cursor-pointer accent-[#8c6239]"
            />
            <span className="flex items-center gap-1">
              <span>Scan HD</span>
            </span>
          </label>

          {/* Show prices checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#c4b5a5] hover:text-[#faf6f0] select-none flex-shrink-0 transition-colors px-1 py-1">
            <input
              type="checkbox"
              checked={config.showPrices}
              onChange={e => updateConfigField('showPrices', e.target.checked)}
              className="rounded text-[#8c6239] focus:ring-[#8c6239] cursor-pointer accent-[#8c6239]"
            />
            <span>Prix</span>
          </label>

          {/* Destination notice */}
          <div className="hidden 2xl:flex items-center gap-1.5 bg-[#1e1713] border border-[#3d3026] px-2.5 py-1 rounded text-[11px] text-[#c4b5a5] flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[#8c7c6e]">Destination :</span>
            <span className="font-semibold text-[#f7ecd9]">« {importTargetFolder} »</span>
          </div>
        </div>
      )}
    </div>
  );
};
