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
  Download
} from 'lucide-react';
import { ArticleItem } from '../types';
import { downloadImageFile } from '../utils/imageOptimizer';

interface InventorySidebarProps {
  articles: ArticleItem[];
  activeFolder?: string;
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
}

export const InventorySidebar: React.FC<InventorySidebarProps> = ({
  articles,
  activeFolder = 'Halloween',
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
    <aside className="w-80 lg:w-96 bg-white dark:bg-[#1a1410] border-r border-[#e2d9ce] dark:border-[#382b22] flex flex-col h-full flex-shrink-0 no-print transition-colors">
      {/* Top Header */}
      <div className="p-4 border-b border-[#e2d9ce] dark:border-[#382b22] bg-[#faf7f2] dark:bg-[#201914]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-[#8c6239] dark:text-[#d4a373]" />
            <h2 className="font-cinzel text-sm font-bold text-[#5c3e21] dark:text-[#f0dfcc]">
              {isGlobalSearchActive 
                ? 'Recherche globale' 
                : activeFolder === 'all' 
                ? 'Tous les articles' 
                : `Dossier : ${activeFolder}`}
              <span className="ml-1.5 font-sans font-medium text-xs text-stone-500 dark:text-stone-400">
                ({baseArticles.length})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onResetToDefault}
            title="Réinitialiser avec les exemples"
            className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-[#8c6239] dark:hover:text-[#d4a373] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Modèles
          </button>
        </div>

        {/* Global search active alert banner */}
        {isGlobalSearchActive && (
          <div className="mb-3 px-2.5 py-1.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded text-[11px] text-[#5c3e21] dark:text-amber-200 flex items-center justify-between gap-1 shadow-2xs">
            <div className="flex items-center gap-1.5 truncate">
              <Search className="w-3 h-3 text-[#8c6239] dark:text-amber-300 flex-shrink-0" />
              <span className="truncate">Tous dossiers : <strong>« {globalSearch} »</strong></span>
            </div>
            {onClearGlobalSearch && (
              <button
                type="button"
                onClick={onClearGlobalSearch}
                className="text-[10px] text-[#8c6239] dark:text-amber-300 hover:text-[#5c3e21] dark:hover:text-amber-100 underline font-semibold flex-shrink-0 cursor-pointer"
                title="Effacer la recherche globale et revenir au dossier actif"
              >
                Effacer
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenBatchUpload}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8c6239] hover:bg-[#734f2d] text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Importer photos
          </button>
          <button
            type="button"
            onClick={onAddNewManual}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-[#281f18] hover:bg-stone-50 dark:hover:bg-[#352820] text-stone-700 dark:text-[#f0dfcc] border border-stone-300 dark:border-[#47372b] text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvel article
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, style, réf..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-[#261d17] text-stone-800 dark:text-[#faf6f0] placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-[#423327] rounded focus:outline-none focus:border-[#8c6239] dark:focus:border-[#c4a482]"
          />
        </div>
      </div>

      {/* Articles List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-10 px-4 text-stone-400 dark:text-stone-500 text-xs">
            {searchTerm 
              ? 'Aucun article correspondant au filtre de liste' 
              : isGlobalSearchActive 
              ? `Aucun article trouvé pour « ${globalSearch} » dans tous les dossiers`
              : 'Aucun article dans ce dossier'}
          </div>
        ) : (
          filteredArticles.map((article, index) => {
            const actualIndex = articles.findIndex(a => a.id === article.id);
            return (
              <div
                key={article.id}
                className="group relative bg-[#fdfcf9] dark:bg-[#221a15] hover:bg-stone-50 dark:hover:bg-[#2c221b] border border-stone-200 dark:border-[#382b21] hover:border-[#c4a482] dark:hover:border-[#8c6239] rounded p-2.5 transition-all text-xs flex gap-2.5 items-center shadow-2xs"
              >
                {/* Drag / Sequence index badge */}
                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500 w-4 text-center font-bold">
                  {actualIndex + 1}
                </span>

                {/* Thumbnail - Clic ouvre la photo en plein écran et zoom */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewImage?.(article);
                  }}
                  className="w-12 h-12 rounded border border-stone-300 dark:border-[#47372b] overflow-hidden bg-stone-100 dark:bg-[#2d221b] flex-shrink-0 cursor-zoom-in relative group/thumb"
                  title="Cliquer pour voir la photo en haute clarté et zoomer"
                >
                  <img
                    src={article.imageUrl}
                    alt={article.name}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                  </div>
                </div>

                {/* Article Info */}
                <div
                  onClick={() => onSelectArticle(article)}
                  className="flex-1 min-w-0 cursor-pointer"
                  title="Cliquer pour modifier l'article"
                >
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-semibold text-stone-800 dark:text-[#f5ede3] truncate font-garamond text-sm hover:text-[#8c6239] dark:hover:text-[#e0b98f] transition-colors">
                      {(!article.name || /whatsapp\s*image/i.test(article.name) || article.name.includes('23.15.51'))
                        ? "Article d'Antiquité"
                        : article.name}
                    </h3>
                    <span className="text-[10px] bg-[#f0e8dd] dark:bg-[#3a2c20] text-[#5c3e21] dark:text-[#f0dfcc] px-1.5 py-0.2 rounded font-medium flex-shrink-0">
                      {article.quantity}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-stone-500 dark:text-[#a89989] truncate mt-0.5">
                    {article.periodOrStyle && !/style et époque préservés/i.test(article.periodOrStyle)
                      ? article.periodOrStyle
                      : article.material && !/matière et patine d'origine/i.test(article.material)
                      ? article.material
                      : 'Détails non renseignés'}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5 text-[9.5px] text-stone-400 dark:text-stone-500">
                    {(activeFolder === 'all' || isGlobalSearchActive) && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[9px] font-medium">
                        📁 {article.folder || 'Antiquités'}
                      </span>
                    )}
                    {article.ref && article.ref !== 'CM-0001' && article.ref !== 'CM-0002' && (
                      <span className="font-mono text-stone-500 dark:text-stone-400">{article.ref}</span>
                    )}
                    {article.price && <span className="text-[#8c6239] dark:text-[#d4a373] font-medium">{article.price}</span>}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-col items-center gap-0.5 opacity-75 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => downloadImageFile(article.imageUrl, `${article.name || 'photo-article'}.jpg`)}
                      title="Télécharger la photo de cet article"
                      className="p-1 text-stone-400 hover:text-[#8c6239] dark:hover:text-[#d4a373] hover:bg-stone-200 dark:hover:bg-[#382b22] rounded"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectArticle(article)}
                      title="Modifier l'article (quantité, nom...)"
                      className="p-1 text-stone-500 dark:text-stone-400 hover:text-[#8c6239] dark:hover:text-[#d4a373] hover:bg-stone-200 dark:hover:bg-[#382b22] rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateArticle(article)}
                      title="Dupliquer"
                      className="p-1 text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-[#382b22] rounded"
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
                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={actualIndex === articles.length - 1}
                      onClick={() => onMoveArticle(actualIndex, 'down')}
                      title="Descendre"
                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteArticle(article.id)}
                      title="Supprimer"
                      className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-200 dark:hover:bg-[#382b22] rounded"
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
      <div className="p-3 bg-[#faf7f2] border-t border-[#e2d9ce] text-[11px] text-[#6e6259] flex justify-between items-center">
        <span>Photo : Zoom • Icône crayon : Modifier</span>
        <span className="font-medium text-[#5c3e21]">
          {articles.reduce((acc, curr) => {
            const num = parseInt(curr.quantity) || 1;
            return acc + num;
          }, 0)} unités totales
        </span>
      </div>
    </aside>
  );
};
