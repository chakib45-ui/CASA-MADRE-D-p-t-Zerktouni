import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  ChevronUp, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Search, 
  PackageCheck, 
  ZoomIn, 
  Download, 
  Wrench, 
  FolderTree, 
  PanelLeftClose,
  Sparkles,
  Tag
} from 'lucide-react';
import { ArticleItem } from '../types';
import { downloadImageFile, FALLBACK_ANTIQUE_IMAGE } from '../utils/imageOptimizer';

interface InventorySidebarProps {
  articles: ArticleItem[];
  folders?: string[];
  activeFolder?: string;
  onChangeFolder?: (folder: string) => void;
  onOpenNewFolder?: () => void;
  globalSearch?: string;
  onClearGlobalSearch?: () => void;
  onSelectArticle: (article: ArticleItem) => void;
  onViewImage?: (article: ArticleItem) => void;
  onMoveArticle: (index: number, direction: 'up' | 'down') => void;
  onDuplicateArticle: (article: ArticleItem) => void;
  onDeleteArticle: (id: string) => void;
  onOpenBatchUpload: () => void;
  onAddNewManual: () => void;
  onResetToDefault: () => void;
  onRepairLibrary?: () => void;
  onToggleSidebar?: () => void;
  isMobileView?: boolean;
}

export const InventorySidebar: React.FC<InventorySidebarProps> = ({
  articles,
  folders,
  activeFolder = 'Antiquités',
  onChangeFolder,
  onOpenNewFolder,
  globalSearch = '',
  onClearGlobalSearch,
  onSelectArticle,
  onViewImage,
  onMoveArticle,
  onDuplicateArticle,
  onDeleteArticle,
  onOpenBatchUpload,
  onAddNewManual,
  onResetToDefault,
  onRepairLibrary,
  onToggleSidebar,
  isMobileView = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isGlobalSearchActive = globalSearch.trim().length > 0;
  const globalQuery = globalSearch.trim().toLowerCase();

  // Articles filtered by globalSearch (across all folders) or by activeFolder
  const baseArticles = isGlobalSearchActive
    ? articles.filter(a =>
        (a.name && a.name.toLowerCase().includes(globalQuery)) ||
        (a.ref && a.ref.toLowerCase().includes(globalQuery))
      )
    : (activeFolder === 'all'
        ? articles
        : articles.filter(a => (a.folder || 'Antiquités').toLowerCase() === activeFolder.toLowerCase()));

  const filteredArticles = baseArticles.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.ref && a.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.periodOrStyle && a.periodOrStyle.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.material && a.material.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <aside className={`${isMobileView ? 'w-full' : 'w-80 lg:w-96 border-r border-[#e2d9cd] dark:border-[#382b21]'} bg-[#faf8f5] dark:bg-[#18120e] flex flex-col h-full flex-shrink-0 no-print transition-colors select-none`}>
      {/* Top Header of Sidebar */}
      <div className="p-3.5 border-b border-[#e2d9cd] dark:border-[#382b21] bg-white dark:bg-[#201813] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#f4eee6] dark:bg-[#2e2219] flex items-center justify-center text-[#8c6239] dark:text-[#d4a373] border border-[#e4d8c8] dark:border-[#423225]">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-cinzel text-xs sm:text-sm font-bold text-[#5c3e21] dark:text-[#f0dfcc] tracking-wide">
              {isGlobalSearchActive 
                ? 'Recherche globale' 
                : activeFolder === 'all' 
                ? 'Tous les articles' 
                : `Dossier : ${activeFolder}`}
              <span className="ml-1.5 font-sans font-semibold text-[11px] text-[#8c6239] dark:text-[#d4a373]">
                ({baseArticles.length})
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {onRepairLibrary && (
              <button
                type="button"
                onClick={onRepairLibrary}
                title="Synchroniser et vérifier la base de données"
                className="px-2 py-1 bg-[#f5efe8] dark:bg-[#2c2017] hover:bg-[#eae2d8] dark:hover:bg-[#38291e] border border-[#dfd4c5] dark:border-[#453426] rounded-lg text-[11px] text-[#8c6239] dark:text-[#d4a373] flex items-center gap-1 transition-colors cursor-pointer font-medium shadow-2xs"
              >
                <Wrench className="w-3 h-3" />
                <span className="hidden sm:inline">Réparer</span>
              </button>
            )}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                title="Masquer la liste"
                className="p-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-[#2d221a] border border-transparent hover:border-stone-300 dark:hover:border-[#4a392e] transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sélecteur de dossier latéral */}
        {folders && onChangeFolder && (
          <div className="mb-2.5 flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                value={activeFolder}
                onChange={e => onChangeFolder(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-[#281e18] text-stone-800 dark:text-[#faf6f0] border border-stone-300 dark:border-[#423327] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8c6239] cursor-pointer shadow-2xs pr-7"
                title="Changer de dossier"
              >
                {folders.map(f => {
                  const count = articles.filter(a => (a.folder || 'Antiquités').toLowerCase() === f.toLowerCase()).length;
                  return (
                    <option key={f} value={f}>
                      📂 {f} ({count})
                    </option>
                  );
                })}
                <option value="all">📁 Tous les dossiers ({articles.length})</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8c6239] dark:text-[#c4a482]">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                </svg>
              </div>
            </div>
            {onOpenNewFolder && (
              <button
                type="button"
                onClick={onOpenNewFolder}
                title="Créer un nouveau dossier"
                className="p-1.5 rounded-lg bg-[#8c6239] hover:bg-[#734f2d] text-white flex-shrink-0 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Action Button: + Nouvel article */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onAddNewManual}
            className="flex-1 py-1.5 px-3 bg-gradient-to-r from-[#8c6239] to-[#734f2d] hover:from-[#9c6f42] hover:to-[#815934] text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_6px_rgba(140,98,57,0.25)] cursor-pointer active:scale-[0.99]"
            title="Créer une nouvelle fiche article manuellement"
          >
            <Plus className="w-3.5 h-3.5 text-[#ffdca8]" />
            <span>+ Nouvel article</span>
          </button>
        </div>

        {/* Search input in sidebar */}
        <div className="relative mt-2.5">
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filtrer par nom, référence, style..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#fbf9f6] dark:bg-[#1a130f] text-stone-800 dark:text-[#faf6f0] placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-[#3d2f24] rounded-lg focus:outline-none focus:border-[#8c6239] dark:focus:border-[#c4a482] shadow-inner transition-colors"
          />
        </div>
      </div>

      {/* Articles List: 1 article per line, elegant cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 px-4 text-stone-400 dark:text-stone-500 text-xs">
            {searchTerm 
              ? 'Aucun article correspondant au filtre' 
              : isGlobalSearchActive 
              ? `Aucun article trouvé pour « ${globalSearch} » dans tous les dossiers`
              : 'Aucun article dans ce dossier'}
          </div>
        ) : (
          filteredArticles.map((article, index) => {
            const actualIndex = articles.findIndex(a => a.id === article.id);
            const categoryBadgeText = article.folder || 'Antiquités';

            return (
              <div
                key={article.id}
                className="group relative bg-white dark:bg-[#201813] hover:bg-[#faf7f2] dark:hover:bg-[#291f19] border border-[#e4ded5] dark:border-[#382b21] hover:border-[#c4a482] dark:hover:border-[#8c6239] rounded-xl p-2.5 transition-all text-xs flex gap-2.5 items-center shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.4)]"
              >
                {/* Drag / Sequence index badge */}
                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500 w-4 text-center font-bold flex-shrink-0">
                  {actualIndex + 1}
                </span>

                {/* Thumbnail - 1 clic ouvre la photo en haute résolution avec zoom */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewImage?.(article);
                  }}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg border border-[#e0d6cb] dark:border-[#423225] overflow-hidden bg-stone-100 dark:bg-[#2d221b] flex-shrink-0 cursor-zoom-in relative group/thumb shadow-2xs"
                  title="Cliquer pour voir la photo en grand écran et zoomer"
                >
                  <img
                    src={article.imageUrl || FALLBACK_ANTIQUE_IMAGE}
                    alt={article.name}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== FALLBACK_ANTIQUE_IMAGE) {
                        target.src = FALLBACK_ANTIQUE_IMAGE;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                </div>

                {/* Article Info Column */}
                <div
                  onClick={() => onSelectArticle(article)}
                  className="flex-1 min-w-0 cursor-pointer"
                  title="Cliquer pour modifier la fiche de l'article"
                >
                  {/* Top row: Name & Quantity */}
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="font-semibold text-stone-900 dark:text-[#faf5ed] truncate font-garamond text-[13.5px] leading-tight hover:text-[#8c6239] dark:hover:text-[#e0b98f] transition-colors">
                      {(!article.name || /whatsapp\s*image/i.test(article.name) || article.name.includes('23.15.51'))
                        ? "Article d'Antiquité"
                        : article.name}
                    </h3>
                    <span className="text-[9.5px] bg-[#f0e8dd] dark:bg-[#382b20] text-[#5c3e21] dark:text-[#f0dfcc] px-1.5 py-0.2 rounded-md font-semibold flex-shrink-0 border border-[#e2d5c5] dark:border-[#48372a]">
                      {article.quantity || '1'}
                    </span>
                  </div>

                  {/* Discrete Category Badge (Antiquités) & Subtitle */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#f4eee6] dark:bg-[#2b1f17] text-[#734f2d] dark:text-[#d4a373] border border-[#e2d6c7] dark:border-[#4a3628] text-[9px] font-medium tracking-wide flex-shrink-0">
                      <span>🏺</span>
                      <span>{categoryBadgeText}</span>
                    </span>

                    <p className="text-[10px] text-stone-500 dark:text-[#a89989] truncate">
                      {article.periodOrStyle && !/style et époque préservés/i.test(article.periodOrStyle)
                        ? article.periodOrStyle
                        : article.material && !/matière et patine d'origine/i.test(article.material)
                        ? article.material
                        : ''}
                    </p>
                  </div>

                  {/* Bottom Line: Reference & Price */}
                  <div className="flex items-center gap-2 mt-1 text-[9.5px]">
                    {article.ref && (
                      <span className="font-mono text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-[#291e17] px-1.5 py-0.2 rounded border border-stone-200 dark:border-[#3d2f25]">
                        {article.ref}
                      </span>
                    )}
                    {article.price && (
                      <span className="text-[#8c6239] dark:text-[#d4a373] font-bold text-[10.5px]">
                        {article.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions buttons on the right */}
                <div className="flex flex-col items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => downloadImageFile(article.imageUrl, `${article.name || 'photo-article'}.jpg`)}
                      title="Télécharger la photo de cet article"
                      className="p-1 text-stone-400 hover:text-[#8c6239] dark:hover:text-[#d4a373] hover:bg-stone-100 dark:hover:bg-[#35281e] rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectArticle(article)}
                      title="Modifier l'article"
                      className="p-1 text-stone-500 dark:text-stone-400 hover:text-[#8c6239] dark:hover:text-[#d4a373] hover:bg-stone-100 dark:hover:bg-[#35281e] rounded-md transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateArticle(article)}
                      title="Dupliquer"
                      className="p-1 text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#35281e] rounded-md transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center">
                    <button
                      type="button"
                      disabled={actualIndex === 0}
                      onClick={() => onMoveArticle(actualIndex, 'up')}
                      title="Monter"
                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 rounded-md"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={actualIndex === articles.length - 1}
                      onClick={() => onMoveArticle(actualIndex, 'down')}
                      title="Descendre"
                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 rounded-md"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteArticle(article.id)}
                      title="Supprimer"
                      className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-[#35281e] rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-white dark:bg-[#201813] border-t border-[#e2d9cd] dark:border-[#382b21] text-[11px] text-[#6e6259] dark:text-[#a8988a] flex justify-between items-center shadow-inner">
        <span>Photo : Zoom • Fiche : Modifier</span>
        <span className="font-semibold text-[#5c3e21] dark:text-[#f0dfcc]">
          {articles.reduce((acc, curr) => {
            const num = parseInt(curr.quantity) || 1;
            return acc + num;
          }, 0)} unités au catalogue
        </span>
      </div>
    </aside>
  );
};
