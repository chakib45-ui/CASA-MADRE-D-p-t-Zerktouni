import React from 'react';
import { 
  FolderPlus, 
  Edit3, 
  ArrowLeft,
  FolderTree,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { ArticleItem } from '../types';

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
  isSidebarVisible = true,
  onToggleSidebar,
}) => {
  // Count articles per folder
  const getCountForFolder = (folderName: string) => {
    return articles.filter(a => (a.folder || 'Antiquités').toLowerCase() === folderName.toLowerCase()).length;
  };

  const totalCount = articles.length;

  return (
    <div className="w-full bg-[#1e1713] text-[#f7f5f0] border-b border-[#382b22] px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs no-print shadow-xs overflow-x-auto whitespace-nowrap scrollbar-thin">
      {/* Barre de Gestion des Dossiers Simplifiée sur une seule ligne propre */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap flex-shrink-0">
        
        {/* Toggle Liste Articles */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 shadow-2xs select-none border ${
              isSidebarVisible
                ? 'bg-[#2e231c] hover:bg-[#3d2f26] text-[#ede0d2] hover:text-white border-[#4d3c30]'
                : 'bg-[#8c6239] hover:bg-[#734f2d] text-white border-[#aa7a4a] ring-2 ring-[#c4a482]/40'
            }`}
            title={isSidebarVisible ? 'Masquer la liste des articles' : 'Montrer la liste des articles'}
          >
            {isSidebarVisible ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-[#c4a482]" />
                <span className="font-medium">Masquer la liste</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span className="font-semibold text-white">Montrer la liste</span>
              </>
            )}
          </button>
        )}

        <div className="w-px h-5 bg-[#3d2e24] mx-0.5 flex-shrink-0" />

        {/* [ 📁 Sélection du dossier 🔽 ] */}
        <div className="flex items-center bg-[#17120e] border border-[#3d2e24] rounded-md p-0.5 gap-1.5 flex-shrink-0 shadow-inner">
          <div className="flex items-center gap-1.5 px-2 py-1 flex-shrink-0">
            <FolderTree className="w-3.5 h-3.5 text-[#c4a482]" />
            <span className="font-cinzel font-bold text-xs tracking-wide text-[#e8d7c3] select-none hidden sm:inline">
              Dossier :
            </span>
          </div>

          <div className="relative inline-block min-w-[170px] sm:min-w-[210px] flex-shrink-0">
            <select
              value={activeFolder}
              onChange={e => onChangeFolder(e.target.value)}
              className="w-full appearance-none bg-[#292019] hover:bg-[#352a21] text-[#faf6f0] font-semibold text-xs px-3 py-1.5 pr-8 rounded border border-[#4d3c30] focus:outline-none focus:ring-1 focus:ring-[#c4a482] cursor-pointer transition-colors shadow-2xs"
              title="Sélectionner le dossier d'inventaire"
            >
              {folders.map(f => {
                const count = getCountForFolder(f);
                return (
                  <option key={f} value={f} className="bg-[#241c17] text-white">
                    📁 {f} ({count} article{count > 1 ? 's' : ''})
                  </option>
                );
              })}
              <option value="all" className="bg-[#241c17] text-[#e8cbb0] font-bold">
                🗂️ Tous les dossiers ({totalCount})
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#c4a482]">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* [ ➕ Nouveau ] */}
        <button
          type="button"
          onClick={onOpenNewFolder}
          className="px-3 py-1.5 bg-[#8c6239] hover:bg-[#734f2d] text-white font-semibold text-xs rounded-md border border-[#aa7a4a] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer flex-shrink-0"
          title="Créer un nouveau dossier thématique"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Nouveau</span>
        </button>

        {/* [ ✏️ Modifier ] */}
        <button
          type="button"
          onClick={onOpenEditFolder}
          disabled={activeFolder === 'all'}
          className="px-3 py-1.5 bg-[#292019] hover:bg-[#382b22] disabled:opacity-35 disabled:cursor-not-allowed text-[#ede0d2] hover:text-white font-medium text-xs rounded-md border border-[#47372b] flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          title={activeFolder === 'all' ? 'Sélectionnez un dossier spécifique pour le modifier' : `Modifier ou renommer le dossier "${activeFolder}"`}
        >
          <Edit3 className="w-3.5 h-3.5 text-[#c4a482]" />
          <span>Modifier</span>
        </button>

        {/* [ ⬅️ Retour ] */}
        {onBackFolder && (
          <button
            type="button"
            onClick={onBackFolder}
            className="px-3 py-1.5 bg-[#221a14] hover:bg-[#30251c] text-[#dfd4c5] hover:text-white font-medium text-xs rounded-md border border-[#3f2e22] flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
            title="Revenir au dossier Antiquités ou réinitialiser le filtre"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#c4a482]" />
            <span>Retour</span>
          </button>
        )}
      </div>

      {/* Recherche active badge (si recherche en cours) */}
      {globalSearch && globalSearch.trim().length > 0 && (
        <div className="flex items-center gap-2 bg-[#2d221a] border border-[#8c6239]/50 rounded-md px-2.5 py-1 text-[11px] text-[#f7ecd9] flex-shrink-0">
          <span className="font-semibold text-amber-300">Filtre : « {globalSearch} »</span>
          {onClearGlobalSearch && (
            <button
              type="button"
              onClick={onClearGlobalSearch}
              className="text-stone-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Effacer le filtre"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
