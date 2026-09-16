import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Upload,
  Plus,
  Search,
  X
} from 'lucide-react';
import { ArticleItem, CatalogConfig } from '../types';
import { COLOR_THEMES } from '../data/defaultCatalog';
import { A4Page } from './A4Page';

interface CatalogPreviewProps {
  articles: ArticleItem[];
  config: CatalogConfig;
  globalSearch?: string;
  onClearGlobalSearch?: () => void;
  onOpenBatchUpload: () => void;
  onAddNewManual: () => void;
  onSelectArticle?: (article: ArticleItem) => void;
  onViewImage?: (article: ArticleItem) => void;
  onOpenPrintModal?: () => void;
}

export const CatalogPreview: React.FC<CatalogPreviewProps> = ({
  articles,
  config,
  globalSearch = '',
  onClearGlobalSearch,
  onOpenBatchUpload,
  onAddNewManual,
  onSelectArticle,
  onViewImage,
  onOpenPrintModal,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(85); // percentage (85% fits standard screens comfortably)
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  const theme = COLOR_THEMES[config.themeId] || COLOR_THEMES.clair;

  // Calculate items per page according to layout mode
  const getItemsPerPage = (): number => {
    switch (config.layoutMode) {
      case '1-per-page':
        return 1;
      case '4-per-page':
        return 4;
      case '3-horizontal':
        return 3;
      case '2-per-page':
      default:
        return 2;
    }
  };

  const itemsPerPage = getItemsPerPage();
  const totalPages = Math.max(1, Math.ceil(articles.length / itemsPerPage));

  // Partition articles into pages
  const pages: ArticleItem[][] = [];
  for (let i = 0; i < articles.length; i += itemsPerPage) {
    pages.push(articles.slice(i, i + itemsPerPage));
  }
  if (pages.length === 0) {
    pages.push([]);
  }

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(130, Math.max(45, prev + delta)));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#eeeae3] dark:bg-[#120d0a] overflow-hidden transition-colors">
      {/* Viewer toolbar */}
      <div className="bg-white dark:bg-[#1e1712] border-b border-[#e2d9ce] dark:border-[#382b21] px-4 py-2 flex flex-wrap items-center justify-between gap-2 no-print text-xs shadow-xs transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700 dark:text-[#dfd4c7]">Aperçu A4 :</span>
          <div className="flex items-center rounded border border-stone-200 dark:border-[#423428] bg-stone-50 dark:bg-[#281f18] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-[#3d2f24] text-[#5c3e21] dark:text-[#f3dfcc] shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-[#a8988a] hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Toutes les pages ({totalPages})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-[#3d2f24] text-[#5c3e21] dark:text-[#f3dfcc] shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-[#a8988a] hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Page par page
            </button>
          </div>

          {viewMode === 'single' && (
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))}
                className="p-1 rounded border border-stone-200 dark:border-[#423428] hover:bg-stone-100 dark:hover:bg-[#281f18] text-stone-600 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                title="Page précédente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium text-stone-700 dark:text-[#dfd4c7] px-1">
                {currentPageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPageIndex >= totalPages - 1}
                onClick={() => setCurrentPageIndex(p => Math.min(totalPages - 1, p + 1))}
                className="p-1 rounded border border-stone-200 dark:border-[#423428] hover:bg-stone-100 dark:hover:bg-[#281f18] text-stone-600 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                title="Page suivante"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleZoom(-10)}
              title="Zoom arrière"
              className="p-1.5 rounded border border-stone-200 dark:border-[#423428] hover:bg-stone-100 dark:hover:bg-[#281f18] text-stone-600 dark:text-[#dfd4c7] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-stone-600 dark:text-[#dfd4c7] w-11 text-center select-none">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(10)}
              title="Zoom avant"
              className="p-1.5 rounded border border-stone-200 dark:border-[#423428] hover:bg-stone-100 dark:hover:bg-[#281f18] text-stone-600 dark:text-[#dfd4c7] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(85)}
              title="Réinitialiser zoom (85%)"
              className="p-1.5 rounded border border-stone-200 dark:border-[#423428] hover:bg-stone-100 dark:hover:bg-[#281f18] text-stone-600 dark:text-[#dfd4c7] transition-colors ml-0.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sheet canvas viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center print-container">
        {/* Quick upload banner */}
        <div className="w-full max-w-[210mm] mx-auto mb-4 bg-white/95 dark:bg-[#1e1712]/95 border border-[#e2d9ce] dark:border-[#382b21] rounded-md p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 shadow-xs no-print text-xs text-[#5c3e21] dark:text-[#dfd4c7] transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#f0e8dd] dark:bg-[#382a20] flex items-center justify-center text-[#8c6239] dark:text-[#d4a373] flex-shrink-0 font-bold">
              ✦
            </div>
            <div className="text-left">
              <span className="font-semibold text-stone-800 dark:text-[#faf6f0]">Ajouter des photos au catalogue : </span>
              <span className="text-stone-600 dark:text-[#a8988a]">Glissez-déposez vos images n'importe où sur l'écran pour l'analyse automatique.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenBatchUpload}
            className="px-3 py-1 bg-[#8c6239] hover:bg-[#734f2d] text-white font-medium rounded text-[11px] shadow-2xs transition-colors flex items-center gap-1.5 ml-auto sm:ml-0 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            Importer des photos
          </button>
        </div>

        {/* Global search status notification */}
        {globalSearch && globalSearch.trim().length > 0 && (
          <div className="w-full max-w-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 rounded-md px-3.5 py-2 mb-4 flex items-center justify-between text-xs text-[#5c3e21] dark:text-[#f3dfcc] shadow-2xs no-print">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#8c6239] dark:text-[#d4a373] flex-shrink-0" />
              <span>
                Recherche globale (tous dossiers) pour <strong>« {globalSearch} »</strong> : <strong className="text-[#8c6239] dark:text-[#d4a373]">{articles.length} article{articles.length > 1 ? 's' : ''}</strong>
              </span>
            </div>
            {onClearGlobalSearch && (
              <button
                type="button"
                onClick={onClearGlobalSearch}
                className="px-2 py-0.5 bg-white dark:bg-[#2a2018] hover:bg-stone-50 dark:hover:bg-[#35281e] border border-amber-300 dark:border-amber-700 rounded text-[11px] font-semibold text-[#8c6239] dark:text-[#f3dfcc] hover:text-[#5c3e21] transition-colors flex items-center gap-1 cursor-pointer"
                title="Effacer la recherche globale et revenir au dossier sélectionné"
              >
                <X className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}
          </div>
        )}

        {articles.length === 0 ? (
          <div className="my-auto max-w-md bg-white dark:bg-[#1e1712] p-8 rounded-lg shadow-md border border-[#e2d9ce] dark:border-[#382b21] text-center transition-colors">
            {globalSearch && globalSearch.trim().length > 0 ? (
              <>
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-[#8c6239] dark:text-[#d4a373] border border-amber-200 dark:border-amber-800/60">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="font-cinzel text-base font-bold text-[#5c3e21] dark:text-[#f3dfcc] mb-1">
                  Aucun résultat trouvé
                </h3>
                <p className="text-xs text-[#6e6259] dark:text-[#a8988a] mb-4">
                  Aucun article ne correspond à « {globalSearch} » par nom ou par référence sur l'ensemble des dossiers.
                </p>
                {onClearGlobalSearch && (
                  <button
                    type="button"
                    onClick={onClearGlobalSearch}
                    className="px-4 py-2 bg-[#8c6239] text-white text-xs font-semibold rounded shadow-xs hover:bg-[#734f2d] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Effacer la recherche</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#faf7f2] dark:bg-[#2a2018] flex items-center justify-center text-[#8c6239] dark:text-[#d4a373]">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="font-cinzel text-base font-bold text-[#5c3e21] dark:text-[#f3dfcc] mb-1">
                  {config.activeFolder && config.activeFolder !== 'all'
                    ? `Le dossier « ${config.activeFolder} » est vide`
                    : 'Votre catalogue est vide'}
                </h3>
                <p className="text-xs text-[#6e6259] dark:text-[#a8988a] mb-4">
                  {config.activeFolder && config.activeFolder !== 'all'
                    ? `Toutes les photos importées seront directement enregistrées dans le dossier « ${config.activeFolder} ».`
                    : 'Commencez par ajouter des photos de vos articles ou créez une fiche manuellement.'}
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenBatchUpload}
                    className="px-3 py-2 bg-[#8c6239] text-white text-xs font-semibold rounded shadow-xs hover:bg-[#734f2d] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer dans « {config.activeFolder === 'all' ? 'Halloween' : config.activeFolder || 'Halloween'} »</span>
                  </button>
                  <button
                    type="button"
                    onClick={onAddNewManual}
                    className="px-3 py-2 bg-stone-100 dark:bg-[#2a2018] text-stone-700 dark:text-[#dfd4c7] text-xs font-semibold rounded hover:bg-stone-200 dark:hover:bg-[#382b20] border border-stone-200 dark:border-[#423428] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer une fiche</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            id="catalog-print-area"
            className="flex flex-col items-center gap-8 transition-transform origin-top pb-16"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {pages.map((pageArticles, index) => {
              const isHiddenOnScreen = viewMode === 'single' && index !== currentPageIndex;
              return (
                <div 
                  key={index} 
                  className={`relative group ${isHiddenOnScreen ? 'hidden print:block' : 'block'}`}
                >
                  {/* Page indicator pill above sheet */}
                  <div className="absolute -top-5 left-2 text-[11px] font-mono text-stone-600 dark:text-stone-400 no-print">
                    Feuille A4 {index + 1} / {totalPages}
                  </div>
                  <A4Page
                    pageNumber={index + 1}
                    totalPages={totalPages}
                    articles={pageArticles}
                    config={config}
                    theme={theme}
                    isFirstPage={index === 0}
                    onSelectArticle={onSelectArticle}
                    onViewImage={onViewImage}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
