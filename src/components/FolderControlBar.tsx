import React from 'react';
import { 
  Folder, 
  FolderPlus, 
  Edit3, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FolderTree,
  Search,
  X
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
}) => {
  // Count articles per folder
  const getCountForFolder = (folderName: string) => {
    return articles.filter(a => (a.folder || 'Antiquités').toLowerCase() === folderName.toLowerCase()).length;
  };

  const totalCount = articles.length;
  const currentFolderCount = activeFolder === 'all' 
    ? totalCount 
    : getCountForFolder(activeFolder);

  const importTargetFolder = activeFolder === 'all' ? (folders.includes('Halloween') ? 'Halloween' : folders[0] || 'Antiquités') : activeFolder;

  return (
    <div className="bg-[#241c17] text-[#f7f5f0] border-b border-[#3d3026] px-4 py-2 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs no-print shadow-inner">
      {/* Left side: Folder Selector Dropdown + Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Label & Folder icon */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#8c6239]/80 border border-[#a87f54] text-[#faf6f0] flex items-center justify-center flex-shrink-0">
            <FolderTree className="w-3.5 h-3.5" />
          </div>
          <span className="font-cinzel font-bold text-xs tracking-wide text-[#e8d7c3]">
            Dossier :
          </span>
        </div>

        {/* Liste Déroulante (Dropdown) */}
        <div className="relative inline-block min-w-[200px] sm:min-w-[230px]">
          <select
            value={activeFolder}
            onChange={e => onChangeFolder(e.target.value)}
            className="w-full appearance-none bg-[#362b23] hover:bg-[#43352b] text-[#faf6f0] font-medium text-xs px-3 py-1.5 pr-8 rounded border border-[#5a483b] focus:outline-none focus:ring-1 focus:ring-[#c4a482] cursor-pointer transition-colors shadow-xs"
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
              📁 Tous les dossiers (Global - {totalCount} articles)
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
          className="px-3 py-1.5 bg-[#8c6239] hover:bg-[#734f2d] text-white font-semibold text-xs rounded border border-[#aa7a4a] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          title="Créer un nouveau dossier thématique"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ Nouveau dossier</span>
        </button>

        {/* Bouton "Modifier dossier" */}
        <button
          type="button"
          onClick={onOpenEditFolder}
          disabled={activeFolder === 'all'}
          className="px-3 py-1.5 bg-[#3a2e26] hover:bg-[#4d3d32] disabled:opacity-40 disabled:cursor-not-allowed text-[#dfd4c5] hover:text-white font-medium text-xs rounded border border-[#524136] flex items-center gap-1.5 transition-colors cursor-pointer"
          title={activeFolder === 'all' ? 'Sélectionnez un dossier spécifique pour le modifier' : `Modifier ou renommer le dossier "${activeFolder}"`}
        >
          <Edit3 className="w-3.5 h-3.5 text-[#c4a482]" />
          <span>Modifier dossier</span>
        </button>

        {/* Bouton "⬅️ Retour" */}
        {onBackFolder && (
          <button
            type="button"
            onClick={onBackFolder}
            className="px-3 py-1.5 bg-[#2a211a] hover:bg-[#3d3026] text-[#dfd4c5] hover:text-white font-medium text-xs rounded border border-[#4a392e] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Revenir au dossier Antiquités ou réinitialiser le filtre"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#c4a482]" />
            <span>Retour</span>
          </button>
        )}

        {/* Global search status badge if active */}
        {globalSearch && globalSearch.trim().length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8c6239]/40 border border-[#c4a482]/60 text-[#fbf4ea] text-[11px] shadow-2xs">
            <Search className="w-3 h-3 text-amber-300 flex-shrink-0" />
            <span>Recherche globale : « <strong>{globalSearch}</strong> »</span>
            {onClearGlobalSearch && (
              <button
                type="button"
                onClick={onClearGlobalSearch}
                className="ml-1 p-0.5 text-[#d9c4b0] hover:text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
                title="Désactiver le filtre de recherche globale"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side: Destination des imports notice */}
      <div className="flex items-center gap-2 bg-[#332720] border border-[#4d3c31] px-3 py-1 rounded text-[11px] text-[#dfd2c2]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="text-[#a8998a]">Destination des imports :</span>
        <span className="font-semibold text-[#f7ecd9] underline decoration-[#8c6239] decoration-2 underline-offset-2">
          Dossier « {importTargetFolder} »
        </span>
      </div>
    </div>
  );
};
