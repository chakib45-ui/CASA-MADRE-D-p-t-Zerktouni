import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Sparkles,
  Layers,
  Move,
  Download
} from 'lucide-react';
import { ArticleItem, CatalogConfig } from '../types';
import { getCleanArticleName, getCleanPeriod, getCleanMaterial } from '../utils/nameCleaner';
import { downloadImageFile } from '../utils/imageOptimizer';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ArticleItem | null;
  articles: ArticleItem[];
  onSelectArticleForEdit?: (article: ArticleItem) => void;
  onNavigateArticle?: (article: ArticleItem) => void;
  config?: CatalogConfig;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  article,
  articles,
  onSelectArticleForEdit,
  onNavigateArticle,
  config,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showScanFilter, setShowScanFilter] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when switching article
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [article?.id]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoom(0.25);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoom(-0.25);
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, article, articles]);

  if (!isOpen || !article) return null;

  const currentIndex = articles.findIndex(a => a.id === article.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < articles.length - 1;

  const handlePrev = () => {
    if (hasPrev && onNavigateArticle) {
      onNavigateArticle(articles[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigateArticle) {
      onNavigateArticle(articles[currentIndex + 1]);
    }
  };

  const handleZoom = (delta: number) => {
    setScale(prev => {
      const next = Math.min(4, Math.max(0.6, Number((prev + delta).toFixed(2))));
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1.2) {
      resetZoom();
    } else {
      setScale(2);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    handleZoom(delta);
  };

  // Mouse drag / Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const cleanName = getCleanArticleName(article.name);
  const cleanPeriod = getCleanPeriod(article.periodOrStyle);
  const cleanMaterial = getCleanMaterial(article.material);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black/92 text-[#faf6f0] select-none backdrop-blur-md animate-fade-in no-print"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1c1815]/90 border-b border-[#352b24] z-20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-cinzel text-xs uppercase tracking-widest text-[#c4a482] font-semibold hidden sm:inline">
            Visionneuse Haute Définition
          </span>
          {currentIndex !== -1 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-stone-400 border border-stone-800">
              {currentIndex + 1} / {articles.length}
            </span>
          )}
          <h2 className="font-garamond text-base sm:text-lg font-bold truncate text-[#f5ebd9]">
            {cleanName}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-[#8c6239] text-[#faf6f0] font-semibold shadow-xs">
            Quantité : {article.quantity || '1 unit.'}
          </span>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Direct Photo Download Button */}
          <button
            type="button"
            onClick={() => downloadImageFile(article.imageUrl, `${cleanName || 'photo-article'}.jpg`)}
            className="px-3 py-1.5 rounded bg-[#2c231d] hover:bg-[#3d3128] text-[#f5ebd9] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#5a483b] shadow-xs"
            title="Télécharger cette photo originale en haute résolution sur votre ordinateur ou téléphone"
          >
            <Download className="w-3.5 h-3.5 text-[#c4a482]" />
            <span className="hidden sm:inline">Télécharger la photo</span>
          </button>

          {/* Dedicated Edit Button */}
          {onSelectArticleForEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectArticleForEdit(article);
              }}
              className="px-3 py-1.5 rounded bg-[#8c6239] hover:bg-[#a07142] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#b88c5e] shadow-xs"
              title="Modifier la quantité, le nom ou la description"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier l'article</span>
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-stone-300 hover:text-white transition-colors"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        onClick={(e) => {
          // If clicked directly on the dark backdrop, close
          if (e.target === containerRef.current) {
            onClose();
          }
        }}
      >
        {/* Navigation Previous Button */}
        {hasPrev && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-110 shadow-lg"
            title="Article précédent (Flèche gauche)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Navigation Next Button */}
        {hasNext && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-110 shadow-lg"
            title="Article suivant (Flèche droite)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* The Zoomable Image Container */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Subtle frame styling with clean scan corner marks */}
          <div className="relative bg-black/40 rounded-xs p-1 shadow-2xl border border-white/15 overflow-hidden">
            <img
              src={article.imageUrl}
              alt={cleanName}
              crossOrigin="anonymous"
              className="max-h-[75vh] max-w-[85vw] object-contain select-none"
              style={{
                filter: showScanFilter 
                  ? 'contrast(1.04) brightness(1.02) saturate(1.03)' 
                  : 'none',
                imageRendering: 'auto',
              }}
              draggable={false}
            />

            {/* Corner alignment brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#c4a482]/80 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#c4a482]/80 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-2 border-b-2 border-l-2 border-[#c4a482]/80 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#c4a482]/80 pointer-events-none" />
          </div>
        </div>

        {/* Floating Pan Hint when Zoomed */}
        {scale > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 border border-white/20 text-stone-200 text-xs px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-md">
            <Move className="w-3.5 h-3.5 text-[#c4a482]" />
            <span>Glissez la souris pour observer chaque angle et recoin</span>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="px-4 py-3 bg-[#1c1815]/95 border-t border-[#352b24] flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Article Quick Metadata */}
        <div className="text-xs text-stone-300 space-y-0.5 max-w-md hidden md:block">
          {cleanPeriod && (
            <div className="truncate">
              <span className="text-stone-400">Époque : </span>
              <span className="font-garamond italic text-[#f5ebd9] text-sm">{cleanPeriod}</span>
            </div>
          )}
          {cleanMaterial && (
            <div className="truncate text-[11px] text-stone-400">
              <span>Matière : </span>
              <span className="text-stone-300">{cleanMaterial}</span>
            </div>
          )}
        </div>

        {/* Zoom Controls Center */}
        <div className="flex items-center gap-1.5 mx-auto bg-black/60 px-3 py-1.5 rounded-full border border-white/15">
          <button
            type="button"
            onClick={() => handleZoom(-0.25)}
            disabled={scale <= 0.6}
            className="p-1.5 rounded-full hover:bg-white/15 text-stone-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom arrière (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs font-semibold px-2 w-14 text-center text-[#c4a482]">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={() => handleZoom(0.25)}
            disabled={scale >= 4}
            className="p-1.5 rounded-full hover:bg-white/15 text-stone-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom avant (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          <button
            type="button"
            onClick={resetZoom}
            className="p-1.5 rounded-full hover:bg-white/15 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1"
            title="Réinitialiser (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">100%</span>
          </button>

          <button
            type="button"
            onClick={() => setShowScanFilter(!showScanFilter)}
            className={`p-1.5 rounded-full transition-colors text-xs flex items-center gap-1 ml-1 ${
              showScanFilter ? 'text-[#c4a482] bg-white/10' : 'text-stone-400 hover:text-white'
            }`}
            title="Basculer le filtre clarté scan"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">Netteté</span>
          </button>
        </div>

        {/* Help Tip */}
        <div className="text-[11px] text-stone-400 hidden lg:block text-right">
          <span>Double-clic pour zoomer • Molette pour ajuster</span>
        </div>
      </div>
    </div>
  );
};
