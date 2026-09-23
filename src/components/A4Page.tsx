import React from 'react';
import { ArticleItem, CatalogConfig, ColorTheme } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';
import { Edit3, ZoomIn, Maximize2, Download } from 'lucide-react';
import { downloadImageFile, FALLBACK_ANTIQUE_IMAGE } from '../utils/imageOptimizer';

function getCleanArticleName(name: string): string {
  if (!name || /whatsapp\s*image/i.test(name) || name.includes('23.15.51')) {
    return "Article d'Antiquité";
  }
  return name;
}

function getCleanPeriod(period?: string): string {
  if (!period || /style et époque préservés/i.test(period)) {
    return '';
  }
  return period;
}

function getCleanMaterial(material?: string): string {
  if (!material || /matière et patine d'origine/i.test(material)) {
    return '';
  }
  return material;
}

function shouldShowRef(config: CatalogConfig, ref?: string): boolean {
  if (!config.showReference || !ref) return false;
  if (ref === 'CM-0001' || ref === 'CM-0002') return false;
  return true;
}

// Helper for Scan Propre image styling
function getScanImageStyle(config: CatalogConfig): React.CSSProperties {
  if (config.cleanScanEffect !== false) {
    return {
      filter: 'contrast(1.04) brightness(1.02) saturate(1.03)',
      imageRendering: 'auto',
    };
  }
  return {};
}

// Decorative Corner marks for Scan effect
const ScanCornerMarks: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <>
    <div
      className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 opacity-70 pointer-events-none z-10"
      style={{ borderColor: accentColor }}
    />
    <div
      className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 opacity-70 pointer-events-none z-10"
      style={{ borderColor: accentColor }}
    />
    <div
      className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 opacity-70 pointer-events-none z-10"
      style={{ borderColor: accentColor }}
    />
    <div
      className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 opacity-70 pointer-events-none z-10"
      style={{ borderColor: accentColor }}
    />
  </>
);

export interface A4PageProps {
  pageNumber: number;
  totalPages: number;
  articles: ArticleItem[];
  config: CatalogConfig;
  theme: ColorTheme;
  isFirstPage: boolean;
  onSelectArticle?: (article: ArticleItem) => void;
  onViewImage?: (article: ArticleItem) => void;
}

export const A4Page: React.FC<A4PageProps> = ({
  pageNumber,
  totalPages,
  articles,
  config: incomingConfig,
  theme,
  isFirstPage,
  onSelectArticle,
  onViewImage,
}) => {
  const config = incomingConfig || DEFAULT_CONFIG;
  const showHeader = isFirstPage || config.headerEveryPage;

  return (
    <div
      className="print-page relative box-border mx-auto overflow-hidden shadow-2xl flex flex-col justify-between"
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '12mm 14mm 10mm 14mm',
        backgroundColor: theme.bgColor,
        color: theme.textColor,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Page Header */}
      <div className="flex-shrink-0">
        {showHeader ? (
          <header className="mb-2 pb-2 border-b text-center relative" style={{ borderColor: theme.borderColor }}>
            {/* Top metadata line */}
            <div className="flex justify-between items-center text-[9.5px] tracking-widest uppercase mb-1" style={{ color: theme.mutedTextColor }}>
              <span>{config.catalogRef ? `Réf : ${config.catalogRef}` : 'Inventaire'}</span>
              {config.collection && (
                <span className="font-sans font-bold px-2 py-0.5 rounded border text-[9px] tracking-wider" style={{ borderColor: theme.borderColor, color: theme.accentColor }}>
                  Thème : {config.collection}
                </span>
              )}
              <span>{config.dateStr}</span>
            </div>

            {/* Classical Antique Main Title */}
            <h1
              className="font-cinzel text-[24px] sm:text-[26px] font-bold tracking-[0.2em] uppercase leading-tight"
              style={{ color: theme.headerAccent }}
            >
              {config.mainTitle || 'CASA MADRE'}
            </h1>

            {/* Elegant Subtitle */}
            <div className="flex items-center justify-center gap-3 my-0.5">
              <span className="h-[0.5px] w-12 opacity-50" style={{ backgroundColor: theme.accentColor }} />
              <p
                className="font-garamond italic text-[15px] tracking-wider font-medium"
                style={{ color: theme.accentColor }}
              >
                Dépôt Zerktouni
              </p>
              <span className="h-[0.5px] w-12 opacity-50" style={{ backgroundColor: theme.accentColor }} />
            </div>
          </header>
        ) : (
          /* Discreet compact header for subsequent pages if full header is disabled */
          <div className="flex justify-between items-center pb-2 mb-2 border-b text-[10px]" style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}>
            <span className="font-cinzel font-semibold tracking-wider" style={{ color: theme.headerAccent }}>
              {config.mainTitle || 'CASA MADRE'} — <span className="font-garamond italic font-normal">{config.subtitle || 'Dépôt Zerktouni'}</span>
              {config.collection && <span className="font-sans text-[9px] ml-2 font-medium opacity-85">({config.collection})</span>}
            </span>
            <span className="text-[9px]">{config.catalogRef}</span>
          </div>
        )}
      </div>

      {/* Main Articles List for this Page: Flex-1 to fit mathematically in 297mm */}
      <div className="w-full flex-1 min-h-0 flex flex-col justify-between py-1.5">
        {config.layoutMode === '2-per-page' && (
          <div className="w-full h-full flex flex-col justify-between gap-3">
            {articles.map((article, idx) => (
              <ArticleCardTwoPerPage
                key={article.id || idx}
                article={article}
                theme={theme}
                config={config}
                onSelectArticle={onSelectArticle}
                onViewImage={onViewImage}
              />
            ))}
          </div>
        )}

        {config.layoutMode === '1-per-page' && (
          <div className="w-full h-full flex flex-col">
            {articles.map((article, idx) => (
              <ArticleCardOnePerPage
                key={article.id || idx}
                article={article}
                theme={theme}
                config={config}
                onSelectArticle={onSelectArticle}
                onViewImage={onViewImage}
              />
            ))}
          </div>
        )}

        {config.layoutMode === '4-per-page' && (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2.5">
            {articles.map((article, idx) => (
              <ArticleCardFourPerPage
                key={article.id || idx}
                article={article}
                theme={theme}
                config={config}
                onSelectArticle={onSelectArticle}
                onViewImage={onViewImage}
              />
            ))}
          </div>
        )}

        {config.layoutMode === '3-horizontal' && (
          <div className="w-full h-full flex flex-col justify-between gap-2.5">
            {articles.map((article, idx) => (
              <ArticleCardThreeHorizontal
                key={article.id || idx}
                article={article}
                theme={theme}
                config={config}
                onSelectArticle={onSelectArticle}
                onViewImage={onViewImage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Page Footer */}
      <footer
        className="flex-shrink-0 pt-2 border-t flex justify-between items-center text-[9px]"
        style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}
      >
        <span className="italic font-garamond text-[10.5px]">
          {config.notesFooter || `${config.mainTitle || 'CASA MADRE'} — ${config.subtitle || 'Dépôt Zerktouni'}`}
        </span>
        <span className="font-mono font-medium tracking-wider">
          Page {pageNumber} / {totalPages}
        </span>
      </footer>
    </div>
  );
};

/* --- 2 ARTICLES PER PAGE (Balanced & recommended) --- */
const ArticleCardTwoPerPage: React.FC<{
  article: ArticleItem;
  theme: ColorTheme;
  config: CatalogConfig;
  onSelectArticle?: (article: ArticleItem) => void;
  onViewImage?: (article: ArticleItem) => void;
}> = ({ article, theme, config, onSelectArticle, onViewImage }) => {
  const isDark = theme.id === 'fonce';
  return (
    <div
      className="flex-1 min-h-0 rounded-sm border p-3 flex flex-col justify-between relative group/card transition-all"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      {/* Dedicated Actions: Modifier & Télécharger photo */}
      <div className="no-print absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 opacity-80 group-hover/card:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadImageFile(article.imageUrl, `${article.name || 'photo-article'}.jpg`);
          }}
          className="px-2 py-1 rounded bg-[#2a221d]/90 hover:bg-[#3d3128] text-[#f5ebd9] text-[10px] flex items-center gap-1 shadow-md border border-white/20 transition-all hover:scale-105 cursor-pointer"
          title="Télécharger la photo originale sur votre ordinateur ou téléphone"
        >
          <Download className="w-3 h-3 text-[#c4a482]" />
          <span className="hidden sm:inline">Photo</span>
        </button>
        {onSelectArticle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectArticle(article);
            }}
            className="px-2.5 py-1 rounded bg-[#2a221d]/90 hover:bg-[#8c6239] text-[#faf6f0] text-[10px] flex items-center gap-1.5 shadow-md font-medium border border-white/20 transition-all hover:scale-105 cursor-pointer"
            title="Modifier le nom, la description et la quantité"
          >
            <Edit3 className="w-3 h-3 text-[#e8cbb0]" />
            <span>Modifier l'article</span>
          </button>
        )}
      </div>

      {/* Photo de l'article : Clic ouvre la visionneuse plein écran avec zoom */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onViewImage?.(article);
        }}
        className={`w-full flex-1 min-h-0 max-h-[58mm] rounded-[2px] overflow-hidden border relative flex items-center justify-center flex-shrink-0 cursor-zoom-in group/photo ${
          config.cleanScanEffect !== false
            ? isDark
              ? 'bg-[#1a1614] p-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
              : 'bg-white p-1.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]'
            : isDark ? 'bg-[#1a1614]' : 'bg-stone-50/70'
        }`}
        style={{ borderColor: theme.borderColor }}
        title="Cliquer pour afficher la photo en plein écran et zoomer"
      >
        {config.cleanScanEffect !== false && <ScanCornerMarks accentColor={theme.accentColor} />}
        <img
          src={article.imageUrl || FALLBACK_ANTIQUE_IMAGE}
          alt={article.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover/photo:scale-[1.03]"
          style={getScanImageStyle(config)}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== FALLBACK_ANTIQUE_IMAGE) {
              target.src = FALLBACK_ANTIQUE_IMAGE;
            }
          }}
        />
        {/* Subtle zoom badge on hover */}
        <div className="no-print absolute inset-0 bg-black/25 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-medium backdrop-blur-[0.5px]">
          <ZoomIn className="w-4 h-4 text-[#e8cbb0]" />
          <span className="text-[11px] font-sans font-semibold text-white drop-shadow">Plein écran & Zoom</span>
        </div>
      </div>

      {/* Nom, description révisée et quantité juste au-dessous */}
      <div className="flex-shrink-0 flex flex-col justify-between pt-2">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <h2
              className="text-[16px] sm:text-[17px] font-bold leading-snug tracking-[0.01em]"
              style={{ color: theme.headerAccent }}
            >
              {getCleanArticleName(article.name)}
            </h2>
            {shouldShowRef(config, article.ref) && (
              <span
                className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0"
                style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}
              >
                {article.ref}
              </span>
            )}
          </div>

          {/* Description révisée : Typographie aérée, lisible, sans chevauchement */}
          {(() => {
            const period = getCleanPeriod(article.periodOrStyle);
            const material = getCleanMaterial(article.material);
            const notes = article.notes;
            if (!period && !material && !notes) return null;
            return (
              <div className="article-desc-container space-y-1 my-1 text-[11.5px] article-text-body">
                {/* Spécifications : Époque & Matière */}
                {(period || material) && (
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-[1.5]" style={{ color: theme.textColor }}>
                    {period && (
                      <span className="inline-flex items-baseline gap-1">
                        <span className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                          Époque :
                        </span>
                        <span className="font-medium">{period}</span>
                      </span>
                    )}
                    {period && material && (
                      <span className="opacity-30 select-none">•</span>
                    )}
                    {material && (
                      <span className="inline-flex items-baseline gap-1">
                        <span className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                          Matière :
                        </span>
                        <span>{material}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Notice descriptive / Remarques */}
                {notes && (
                  <p
                    className="leading-[1.55] tracking-[0.01em] line-clamp-2"
                    style={{ color: theme.textColor }}
                  >
                    {notes}
                  </p>
                )}

                {/* Dimensions et état */}
                {(article.condition || (config.showDimensions && article.dimensions)) && (
                  <div className="text-[10px] leading-normal flex items-center gap-2 pt-0.5" style={{ color: theme.mutedTextColor }}>
                    {config.showDimensions && article.dimensions && (
                      <span className="font-mono font-medium">{article.dimensions}</span>
                    )}
                    {config.showDimensions && article.dimensions && article.condition && (
                      <span className="opacity-30">•</span>
                    )}
                    {article.condition && (
                      <span>{article.condition}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Quantité & Bouton Modifier juste au-dessous */}
        <div
          className="pt-1.5 mt-1 border-t flex justify-between items-center"
          style={{ borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
              Quantité :
            </span>
            <span
              className="text-[12px] font-bold px-2 py-0.5 rounded border shadow-2xs"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.borderColor,
              }}
            >
              {article.quantity || '1 unit.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {config.showPrices && article.price && (
              <span
                className="text-[14px] font-bold"
                style={{ color: theme.accentColor }}
              >
                {article.price}
              </span>
            )}
            {onSelectArticle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArticle(article);
                }}
                className="no-print text-[10.5px] text-stone-600 hover:text-[#8c6239] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-black/5 transition-colors cursor-pointer"
                title="Modifier le nom, la description et la quantité"
              >
                <Edit3 className="w-3 h-3 text-[#8c6239]" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- 1 ARTICLE PER PAGE (Prestigious appraisal sheet) --- */
const ArticleCardOnePerPage: React.FC<{
  article: ArticleItem;
  theme: ColorTheme;
  config: CatalogConfig;
  onSelectArticle?: (article: ArticleItem) => void;
  onViewImage?: (article: ArticleItem) => void;
}> = ({ article, theme, config, onSelectArticle, onViewImage }) => {
  const isDark = theme.id === 'fonce';
  return (
    <div
      className="flex-1 min-h-0 rounded-sm border p-4 flex flex-col justify-between relative group/card transition-all"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      {/* Dedicated Actions: Modifier & Télécharger photo */}
      <div className="no-print absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-85 group-hover/card:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadImageFile(article.imageUrl, `${article.name || 'photo-article'}.jpg`);
          }}
          className="px-2.5 py-1 rounded bg-[#2a221d]/90 hover:bg-[#3d3128] text-[#f5ebd9] text-[10.5px] flex items-center gap-1 shadow-md border border-white/20 transition-all hover:scale-105 cursor-pointer"
          title="Télécharger la photo originale"
        >
          <Download className="w-3 h-3 text-[#c4a482]" />
          <span>Photo</span>
        </button>
        {onSelectArticle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectArticle(article);
            }}
            className="px-3 py-1 rounded bg-[#2a221d]/90 hover:bg-[#8c6239] text-[#faf6f0] text-[10.5px] flex items-center gap-1.5 shadow-md font-medium border border-white/20 transition-all hover:scale-105 cursor-pointer"
            title="Modifier le nom, la description et la quantité"
          >
            <Edit3 className="w-3 h-3 text-[#e8cbb0]" />
            <span>Modifier l'article</span>
          </button>
        )}
      </div>

      {/* Large Featured Image: Clic ouvre la visionneuse plein écran */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onViewImage?.(article);
        }}
        className={`w-full flex-1 min-h-0 max-h-[125mm] rounded-[2px] overflow-hidden border relative flex items-center justify-center cursor-zoom-in group/photo ${
          config.cleanScanEffect !== false
            ? isDark
              ? 'bg-[#1a1614] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
              : 'bg-white p-2.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]'
            : isDark ? 'bg-[#1a1614]' : 'bg-stone-50/70'
        }`}
        style={{ borderColor: theme.borderColor }}
        title="Cliquer pour afficher la photo en plein écran et zoomer"
      >
        {config.cleanScanEffect !== false && <ScanCornerMarks accentColor={theme.accentColor} />}
        <img
          src={article.imageUrl || FALLBACK_ANTIQUE_IMAGE}
          alt={article.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover/photo:scale-[1.03]"
          style={getScanImageStyle(config)}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== FALLBACK_ANTIQUE_IMAGE) {
              target.src = FALLBACK_ANTIQUE_IMAGE;
            }
          }}
        />
        <div
          className="absolute top-3 left-3 px-3 py-1 text-[11px] font-semibold tracking-wider rounded uppercase shadow"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          Quantité : {article.quantity || '1 unit.'}
        </div>
        {/* Subtle zoom badge on hover */}
        <div className="no-print absolute inset-0 bg-black/25 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-medium backdrop-blur-[0.5px]">
          <ZoomIn className="w-5 h-5 text-[#e8cbb0]" />
          <span className="text-[12px] font-sans font-semibold text-white drop-shadow">Plein écran & Zoom</span>
        </div>
      </div>

      {/* Complete descriptive section */}
      <div className="pt-3 flex-shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-baseline gap-4 mb-1">
            <h2
              className="text-[20px] sm:text-[22px] font-bold leading-snug tracking-[0.01em]"
              style={{ color: theme.headerAccent }}
            >
              {getCleanArticleName(article.name)}
            </h2>
            {shouldShowRef(config, article.ref) && (
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded border"
                style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}
              >
                Réf : {article.ref}
              </span>
            )}
          </div>

          {article.category && (
            <p className="text-[11px] tracking-widest uppercase font-semibold mb-2" style={{ color: theme.accentColor }}>
              {article.category}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] mt-1.5 article-text-body">
            <div>
              <span className="font-semibold block text-[10px] uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                Époque & Style :
              </span>
              <p className="text-[13px] font-semibold mt-0.5 leading-normal" style={{ color: theme.textColor }}>
                {getCleanPeriod(article.periodOrStyle) || 'Sur demande'}
              </p>
            </div>

            <div>
              <span className="font-semibold block text-[10px] uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                Matières & Assemblage :
              </span>
              <p className="mt-0.5 leading-normal" style={{ color: theme.textColor }}>
                {getCleanMaterial(article.material) || 'Sur demande'}
              </p>
            </div>

            <div>
              <span className="font-semibold block text-[10px] uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                État de conservation :
              </span>
              <p className="mt-0.5 leading-normal" style={{ color: theme.textColor }}>
                {article.condition || 'Bon état d\'usage'}
              </p>
            </div>

            {config.showDimensions && (
              <div>
                <span className="font-semibold block text-[10px] uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                  Dimensions :
                </span>
                <p className="font-mono text-[11.5px] font-medium mt-0.5" style={{ color: theme.textColor }}>
                  {article.dimensions || 'Sur demande'}
                </p>
              </div>
            )}
          </div>

          {article.notes && (
            <div
              className="mt-3 p-3 rounded border text-[12px] leading-[1.6] tracking-[0.01em] article-text-body"
              style={{
                borderColor: theme.borderColor,
                color: theme.textColor,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
              }}
            >
              <span className="font-semibold block text-[10px] uppercase tracking-wider mb-1" style={{ color: theme.mutedTextColor }}>
                Notice descriptive & Remarques :
              </span>
              <p className="leading-[1.6]">{article.notes}</p>
            </div>
          )}
        </div>

        {/* Quantité & Prix banner */}
        <div
          className="mt-3 pt-2.5 border-t flex justify-between items-center"
          style={{ borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
              Disponibilité au dépôt :
            </span>
            <span
              className="text-[13px] font-bold px-3 py-0.5 rounded border shadow-2xs"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.borderColor,
              }}
            >
              {article.quantity || '1 unit.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {config.showPrices && article.price && (
              <div className="text-right">
                <span className="text-[9.5px] uppercase tracking-wider block" style={{ color: theme.mutedTextColor }}>
                  Prix estimé
                </span>
                <span className="text-[17px] font-bold" style={{ color: theme.accentColor }}>
                  {article.price}
                </span>
              </div>
            )}
            {onSelectArticle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArticle(article);
                }}
                className="no-print text-[11px] text-stone-600 hover:text-[#8c6239] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-black/5 transition-colors cursor-pointer border border-stone-200"
                title="Modifier cet article"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#8c6239]" />
                <span>Modifier l'article</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- 4 ARTICLES PER PAGE (2x2 Compact Inventory Grid) --- */
const ArticleCardFourPerPage: React.FC<{
  article: ArticleItem;
  theme: ColorTheme;
  config: CatalogConfig;
  onSelectArticle?: (article: ArticleItem) => void;
  onViewImage?: (article: ArticleItem) => void;
}> = ({ article, theme, config, onSelectArticle, onViewImage }) => {
  const isDark = theme.id === 'fonce';
  return (
    <div
      className="h-full min-h-0 rounded-sm border p-2 flex flex-col justify-between relative group/card transition-all"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      {/* Dedicated Actions: Modifier & Télécharger photo */}
      <div className="no-print absolute top-2 right-2 z-10 flex items-center gap-1 opacity-75 group-hover/card:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadImageFile(article.imageUrl, `${article.name || 'photo-article'}.jpg`);
          }}
          className="p-1 rounded bg-[#2a221d]/90 hover:bg-[#3d3128] text-[#f5ebd9] text-[9px] flex items-center shadow-md border border-white/20 transition-all hover:scale-105 cursor-pointer"
          title="Télécharger la photo"
        >
          <Download className="w-2.5 h-2.5 text-[#c4a482]" />
        </button>
        {onSelectArticle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectArticle(article);
            }}
            className="px-2 py-0.5 rounded bg-[#2a221d]/90 hover:bg-[#8c6239] text-[#faf6f0] text-[9px] flex items-center gap-1 shadow-md font-medium border border-white/20 transition-all hover:scale-105 cursor-pointer"
            title="Modifier le nom, la description et la quantité"
          >
            <Edit3 className="w-2.5 h-2.5 text-[#e8cbb0]" />
            <span>Modifier</span>
          </button>
        )}
      </div>

      {/* Image: Clic ouvre la visionneuse plein écran */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onViewImage?.(article);
        }}
        className={`w-full flex-1 min-h-0 max-h-[48mm] rounded-[2px] overflow-hidden border relative flex items-center justify-center flex-shrink-0 cursor-zoom-in group/photo ${
          config.cleanScanEffect !== false
            ? isDark
              ? 'bg-[#1a1614] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
              : 'bg-white p-1.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]'
            : isDark ? 'bg-[#1a1614]' : 'bg-stone-50/70'
        }`}
        style={{ borderColor: theme.borderColor }}
        title="Cliquer pour observer la photo en plein écran et zoomer"
      >
        {config.cleanScanEffect !== false && <ScanCornerMarks accentColor={theme.accentColor} />}
        <img
          src={article.imageUrl || FALLBACK_ANTIQUE_IMAGE}
          alt={article.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover/photo:scale-[1.03]"
          style={getScanImageStyle(config)}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== FALLBACK_ANTIQUE_IMAGE) {
              target.src = FALLBACK_ANTIQUE_IMAGE;
            }
          }}
        />
        <div
          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider rounded uppercase shadow-xs"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          {article.quantity || '1 unit.'}
        </div>
        <div className="no-print absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
          <ZoomIn className="w-4 h-4 text-[#e8cbb0]" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-shrink-0 flex flex-col justify-between pt-1.5">
        <div>
          <div className="flex justify-between items-start gap-1">
            <h3
              className="font-garamond text-[14px] font-bold leading-snug line-clamp-1"
              style={{ color: theme.headerAccent }}
            >
              {getCleanArticleName(article.name)}
            </h3>
            {shouldShowRef(config, article.ref) && (
              <span className="text-[8px] font-mono flex-shrink-0 opacity-70">
                {article.ref}
              </span>
            )}
          </div>

          <div className="space-y-0.5 mt-0.5 text-[9.5px] article-text-body">
            {getCleanPeriod(article.periodOrStyle) && (
              <p className="line-clamp-1 leading-snug">
                <span className="font-semibold opacity-75">Époque : </span>
                <span className="font-medium">{getCleanPeriod(article.periodOrStyle)}</span>
              </p>
            )}

            {getCleanMaterial(article.material) && (
              <p className="line-clamp-1 leading-snug">
                <span className="font-semibold opacity-75">Matière : </span>
                <span>{getCleanMaterial(article.material)}</span>
              </p>
            )}

            {article.condition && (
              <p className="line-clamp-1 leading-snug">
                <span className="font-semibold opacity-75">État : </span>
                <span>{article.condition}</span>
              </p>
            )}

            {config.showDimensions && article.dimensions && (
              <p className="line-clamp-1 font-mono text-[8.5px] leading-snug">
                <span className="font-sans font-semibold opacity-75">Dim : </span>
                {article.dimensions}
              </p>
            )}
          </div>
        </div>

        <div
          className="pt-1 mt-1 border-t flex justify-between items-center text-[9px]"
          style={{ borderColor: theme.borderColor }}
        >
          <span className="font-semibold" style={{ color: theme.headerAccent }}>
            Qté : {article.quantity || '1 unit.'}
          </span>
          <div className="flex items-center gap-1.5">
            {config.showPrices && article.price && (
              <span className="font-garamond font-bold text-[11.5px]" style={{ color: theme.accentColor }}>
                {article.price}
              </span>
            )}
            {onSelectArticle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArticle(article);
                }}
                className="no-print text-[8.5px] text-stone-500 hover:text-[#8c6239] underline"
              >
                Éditer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- 3 ARTICLES PER PAGE (Horizontal Stripes) --- */
const ArticleCardThreeHorizontal: React.FC<{
  article: ArticleItem;
  theme: ColorTheme;
  config: CatalogConfig;
  onSelectArticle?: (article: ArticleItem) => void;
  onViewImage?: (article: ArticleItem) => void;
}> = ({ article, theme, config, onSelectArticle, onViewImage }) => {
  const isDark = theme.id === 'fonce';
  return (
    <div
      className="flex-1 min-h-0 rounded-sm border p-2.5 flex flex-row gap-3 items-stretch relative group/card transition-all"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      {/* Dedicated Actions: Modifier & Télécharger photo */}
      <div className="no-print absolute top-2 right-2 z-10 flex items-center gap-1 opacity-75 group-hover/card:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadImageFile(article.imageUrl, `${article.name || 'photo-article'}.jpg`);
          }}
          className="p-1 rounded bg-[#2a221d]/90 hover:bg-[#3d3128] text-[#f5ebd9] text-[9.5px] flex items-center shadow-md border border-white/20 transition-all hover:scale-105 cursor-pointer"
          title="Télécharger la photo"
        >
          <Download className="w-2.5 h-2.5 text-[#c4a482]" />
        </button>
        {onSelectArticle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectArticle(article);
            }}
            className="px-2 py-0.5 rounded bg-[#2a221d]/90 hover:bg-[#8c6239] text-[#faf6f0] text-[9.5px] flex items-center gap-1 shadow-md font-medium border border-white/20 transition-all hover:scale-105 cursor-pointer"
            title="Modifier le nom, la description et la quantité"
          >
            <Edit3 className="w-2.5 h-2.5 text-[#e8cbb0]" />
            <span>Modifier</span>
          </button>
        )}
      </div>

      {/* Image: Clic ouvre la visionneuse plein écran */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onViewImage?.(article);
        }}
        className={`w-[36%] h-full rounded-[2px] overflow-hidden border relative flex-shrink-0 flex items-center justify-center cursor-zoom-in group/photo ${
          config.cleanScanEffect !== false
            ? isDark
              ? 'bg-[#1a1614] p-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
              : 'bg-white p-1.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]'
            : isDark ? 'bg-[#1a1614]' : 'bg-stone-50/70'
        }`}
        style={{ borderColor: theme.borderColor }}
        title="Cliquer pour afficher la photo en plein écran et zoomer"
      >
        {config.cleanScanEffect !== false && <ScanCornerMarks accentColor={theme.accentColor} />}
        <img
          src={article.imageUrl || FALLBACK_ANTIQUE_IMAGE}
          alt={article.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover/photo:scale-[1.03]"
          style={getScanImageStyle(config)}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== FALLBACK_ANTIQUE_IMAGE) {
              target.src = FALLBACK_ANTIQUE_IMAGE;
            }
          }}
        />
        <div
          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8.5px] font-bold rounded uppercase shadow-xs"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          Qté : {article.quantity || '1 unit.'}
        </div>
        <div className="no-print absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
          <ZoomIn className="w-4 h-4 text-[#e8cbb0]" />
        </div>
      </div>

      <div className="w-[64%] flex flex-col justify-between py-0.5">
        <div>
          <div className="flex justify-between items-start gap-1 pr-14">
            <h3
              className="font-garamond text-[16px] font-bold leading-tight"
              style={{ color: theme.headerAccent }}
            >
              {getCleanArticleName(article.name)}
            </h3>
            {shouldShowRef(config, article.ref) && (
              <span className="text-[8.5px] font-mono px-1 rounded border opacity-70">
                {article.ref}
              </span>
            )}
          </div>

          <div className="space-y-0.5 mt-1 text-[10.5px] article-text-body">
            {getCleanPeriod(article.periodOrStyle) && (
              <p className="line-clamp-1 leading-snug">
                <span className="font-semibold text-[10px] opacity-75">Époque : </span>
                <span className="font-medium">{getCleanPeriod(article.periodOrStyle)}</span>
              </p>
            )}
            {getCleanMaterial(article.material) && (
              <p className="line-clamp-1 leading-snug">
                <span className="font-semibold text-[10px] opacity-75">Matière : </span>
                <span>{getCleanMaterial(article.material)}</span>
              </p>
            )}
            {article.condition && (
              <p className="line-clamp-1 leading-snug">
                <span className="font-semibold text-[10px] opacity-75">État : </span>
                <span>{article.condition}</span>
              </p>
            )}
            {config.showDimensions && article.dimensions && (
              <p className="line-clamp-1 font-mono text-[9.5px] leading-snug">
                <span className="font-sans font-semibold opacity-75">Dim : </span>
                <span>{article.dimensions}</span>
              </p>
            )}
          </div>
        </div>

        <div
          className="pt-1 border-t flex justify-between items-center text-[10px]"
          style={{ borderColor: theme.borderColor }}
        >
          <span className="font-semibold" style={{ color: theme.headerAccent }}>
            Quantité : {article.quantity || '1 unit.'}
          </span>
          <div className="flex items-center gap-2">
            {config.showPrices && article.price && (
              <span className="font-garamond font-bold text-[13px]" style={{ color: theme.accentColor }}>
                {article.price}
              </span>
            )}
            {onSelectArticle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArticle(article);
                }}
                className="no-print text-[9px] text-stone-500 hover:text-[#8c6239] underline"
              >
                Modifier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
