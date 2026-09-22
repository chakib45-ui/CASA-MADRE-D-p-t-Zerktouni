import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Sliders, 
  Camera,
  Search,
  X,
  FileSpreadsheet,
  Sun,
  Moon,
  Settings2,
  ChevronDown,
  LayoutGrid,
  Palette,
  Sparkles,
  DollarSign,
  Plus,
  Layers,
  FileText,
  Check,
  Users,
  Lock,
  Shield
} from 'lucide-react';

import { CatalogConfig, LayoutMode, ThemeId, UserProfile } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';
import { AuthStatus } from './AuthStatus';

interface HeaderProps {
  config?: CatalogConfig;
  onChangeConfig?: (config: CatalogConfig) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchResultCount?: number;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  onPrint: () => void;
  onOpenHeaderSettings: () => void;
  onOpenBatchUpload?: () => void;
  onOpenScanner?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isExporting: boolean;
  exportStatus: string;
  user?: UserProfile | null;
  isAuthLoading?: boolean;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  onSignIn?: () => void;
  onSignOut?: () => void;
  onManualSync?: () => void;
  isAdmin?: boolean;
  pendingApprovalsCount?: number;
  onOpenUserManagement?: () => void;
  isPinUnlocked?: boolean;
  onLockEditing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config = DEFAULT_CONFIG,
  onChangeConfig,
  searchQuery = '',
  onSearchChange,
  searchResultCount,
  onDownloadPDF,
  onDownloadExcel,
  onPrint,
  onOpenHeaderSettings,
  onOpenBatchUpload,
  onOpenScanner,
  isDarkMode = false,
  onToggleDarkMode,
  isExporting,
  exportStatus,
  user = null,
  isAuthLoading = false,
  syncStatus = 'offline',
  onSignIn = () => {},
  onSignOut = () => {},
  onManualSync,
  isAdmin = false,
  pendingApprovalsCount = 0,
  onOpenUserManagement,
  isPinUnlocked = false,
  onLockEditing,
}) => {
  const safeConfig = config || DEFAULT_CONFIG;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleUpdateConfig = <K extends keyof CatalogConfig>(key: K, value: CatalogConfig[K]) => {
    if (onChangeConfig) {
      onChangeConfig({
        ...safeConfig,
        [key]: value,
      });
    }
  };

  return (
    <header className="bg-[#241c17] text-[#f7f5f0] border-b border-[#3d3026] px-3 py-2 sm:px-6 flex items-center justify-between gap-3 no-print shadow-md relative z-30">
      {/* 1. À GAUCHE : Logo & Titre CASA MADRE - Dépôt Zerktouni */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#8c6239] text-[#f7f5f0] flex items-center justify-center font-cinzel font-bold text-sm sm:text-base shadow-inner border border-[#a87f54] flex-shrink-0">
          CM
        </div>
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-cinzel text-sm sm:text-base lg:text-lg font-bold tracking-[0.14em] text-[#faf6f0] leading-none whitespace-nowrap">
              {safeConfig.mainTitle || 'CASA MADRE'}
            </h1>
            <span className="hidden sm:inline text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#382b22] text-[#d6c5b2] tracking-wider border border-[#4d3d32] whitespace-nowrap">
              {safeConfig.subtitle || 'Dépôt Zerktouni'}
            </span>
          </div>
          <p className="font-garamond italic text-[11px] text-[#c4b5a5] mt-0.5 hidden md:block whitespace-nowrap">
            Inventaire interactif & Catalogue A4
          </p>
        </div>
      </div>

      {/* 2. AU CENTRE : Barre de Recherche (🔍 Rechercher un article...) */}
      {onSearchChange && (
        <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2 flex-shrink">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-[#b3a18f] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onSearchChange('');
              }}
              placeholder="🔍 Rechercher un article par nom ou référence..."
              className="w-full pl-9 pr-14 py-1.5 bg-[#1a1411] hover:bg-[#1f1814] text-[#f7f5f0] placeholder-[#8e7e70] text-xs rounded-md border border-[#4a3a2e] focus:outline-none focus:border-[#c4a482] focus:ring-1 focus:ring-[#8c6239] transition-all shadow-inner"
              title="Rechercher des articles dans l'inventaire"
            />
            {/* Counter badge & clear button */}
            <div className="absolute right-1.5 flex items-center gap-1">
              {searchQuery.trim() !== '' && searchResultCount !== undefined && (
                <span 
                  className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#8c6239]/50 text-[#f5ebd9] border border-[#8c6239]/80 select-none"
                  title={`${searchResultCount} article(s) trouvé(s)`}
                >
                  {searchResultCount}
                </span>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-stone-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. À DROITE : Action principale + Menu Déroulant Unique (Outils & Actions) + Statut Cloud */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Bouton principal d'action : [ ➕ Importer / 📷 Scanner ] */}
        <div className="flex items-center bg-[#8c6239] hover:bg-[#734f2d] rounded-md shadow-sm border border-[#aa7a4a] overflow-hidden">
          {onOpenBatchUpload && (
            <button
              type="button"
              onClick={onOpenBatchUpload}
              className="px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-black/10"
              title="Importer des photos d'articles"
            >
              <Plus className="w-3.5 h-3.5 text-[#ffdca8]" />
              <span>Importer</span>
            </button>
          )}

          {onOpenBatchUpload && onOpenScanner && (
            <div className="w-px h-4 bg-white/20" />
          )}

          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-black/10"
              title="Scanner / Photographier en direct avec la caméra"
            >
              <Camera className="w-3.5 h-3.5 text-[#ffdca8]" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
          )}
        </div>

        {/* Menu Déroulant Unique : ⚙️ Outils & Actions 🔽 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isMenuOpen 
                ? 'bg-[#4a392e] text-white border-[#c4a482] ring-2 ring-[#c4a482]/40' 
                : 'bg-[#33271f] hover:bg-[#423328] text-[#f0e2d3] hover:text-white border-[#524133]'
            }`}
            title="Outils & Actions : Exportation, Affichage, Configuration"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#c4a482]" />
            <span>Outils & Actions</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#c4a482] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Panneau du menu déroulant complet */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#251d17] border border-[#4d3c30] rounded-lg shadow-2xl p-2.5 z-50 text-xs text-[#ede3d5] divide-y divide-[#3d2f25] animate-in fade-in-50 zoom-in-95 duration-100">
              
              {/* SECTION 1 : 📥 Exportation */}
              <div className="pb-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c4a482] px-2 py-1 mb-1">
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportation & Impression</span>
                </div>

                <div className="space-y-1">
                  {/* Imprimer le catalogue */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onPrint();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#382b22] text-left transition-colors cursor-pointer group"
                    title="Imprimer ou aperçu avant impression A4"
                  >
                    <span className="flex items-center gap-2">
                      <Printer className="w-3.5 h-3.5 text-[#d4a373] group-hover:text-white" />
                      <span className="font-medium text-[#f5ede3]">Imprimer le catalogue</span>
                    </span>
                    <span className="text-[10px] text-stone-400">Ctrl+P</span>
                  </button>

                  {/* Télécharger le PDF A4 */}
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDownloadPDF();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#382b22] disabled:opacity-50 text-left transition-colors cursor-pointer group"
                    title="Générer et télécharger le catalogue au format PDF A4 haute définition"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                      <span className="font-medium text-[#f5ede3]">
                        {isExporting ? (exportStatus || 'Export en cours...') : 'Télécharger le PDF A4'}
                      </span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8c6239]/40 border border-[#aa7a4a]/50 text-amber-200">
                      PDF HD
                    </span>
                  </button>

                  {/* Télécharger le fichier Excel (.xlsx) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDownloadExcel();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#382b22] text-left transition-colors cursor-pointer group"
                    title="Exporter l'inventaire complet dans une feuille de calcul Excel .xlsx"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                      <span className="font-medium text-[#f5ede3]">Télécharger le fichier Excel</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 border border-emerald-600/40 text-emerald-300">
                      .xlsx
                    </span>
                  </button>

                  {/* Badge SVG Dynamique GitHub / Web */}
                  <a
                    href="/api/status-badge"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#382b22] text-left transition-colors cursor-pointer group"
                    title="Ouvrir le badge SVG dynamique temps réel pour README GitHub ou site web"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-[10px] text-amber-300">🛡️</span>
                      <span className="font-medium text-[#f5ede3]">Badge SVG Statut Stock</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/40 text-blue-200">
                      SVG
                    </span>
                  </a>
                </div>
              </div>

              {/* SECTION 2 : 🖼️ Affichage & Mise en page */}
              <div className="py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c4a482] px-2 py-1 mb-1">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Affichage & Mise en page</span>
                </div>

                <div className="space-y-2 px-1">
                  {/* Disposition des articles par page */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#dfd4c5]">Disposition :</span>
                    <select
                      value={safeConfig.layoutMode}
                      onChange={(e) => handleUpdateConfig('layoutMode', e.target.value as LayoutMode)}
                      className="bg-[#33271f] text-[#faf6f0] border border-[#524133] rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-[#c4a482] cursor-pointer"
                    >
                      <option value="1-per-page">1 article / page</option>
                      <option value="2-per-page">2 articles / page</option>
                      <option value="3-horizontal">3 articles / page</option>
                      <option value="4-per-page">4 articles / page</option>
                    </select>
                  </div>

                  {/* Thème visuel du catalogue */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#dfd4c5]">Thème catalogue :</span>
                    <select
                      value={safeConfig.themeId}
                      onChange={(e) => handleUpdateConfig('themeId', e.target.value as ThemeId)}
                      className="bg-[#33271f] text-[#faf6f0] border border-[#524133] rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-[#c4a482] cursor-pointer"
                    >
                      <option value="clair">Thème Clair</option>
                      <option value="fonce">Thème Galerie (Foncé)</option>
                    </select>
                  </div>

                  {/* Mode Sombre UI */}
                  {onToggleDarkMode && (
                    <button
                      type="button"
                      onClick={onToggleDarkMode}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-[#2e231c] hover:bg-[#3d2f26] border border-[#47372b] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {isDarkMode ? (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        <span>Interface : {isDarkMode ? 'Mode Sombre actif' : 'Mode Clair actif'}</span>
                      </span>
                      <span className="text-[10px] text-stone-400">Basculer</span>
                    </button>
                  )}

                  {/* Effet Scan Propre HD & Afficher Prix */}
                  <div className="flex items-center justify-between pt-1 text-[11.5px]">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#dfd4c5] hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={safeConfig.cleanScanEffect !== false}
                        onChange={(e) => handleUpdateConfig('cleanScanEffect', e.target.checked)}
                        className="rounded text-[#8c6239] focus:ring-[#8c6239] accent-[#8c6239] cursor-pointer"
                      />
                      <span>Effet Scan Propre HD</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[#dfd4c5] hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={safeConfig.showPrices}
                        onChange={(e) => handleUpdateConfig('showPrices', e.target.checked)}
                        className="rounded text-[#8c6239] focus:ring-[#8c6239] accent-[#8c6239] cursor-pointer"
                      />
                      <span>Afficher Prix</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 3 : ℹ️ Configuration */}
              <div className="pt-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c4a482] px-2 py-1 mb-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configuration du document</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenHeaderSettings();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#382b22] text-left transition-colors cursor-pointer group"
                  title="Personnaliser les informations, en-tête, sous-titre et coordonnées"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[#c4a482] group-hover:text-white" />
                    <span className="font-medium text-[#f5ede3]">En-tête & Infos du document</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Modifier ✏️</span>
                </button>

                {/* Section Admin Accès (si admin chakib.45@gmail.com) */}
                {isAdmin && onOpenUserManagement && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenUserManagement();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 mt-1 rounded-md bg-[#38281e] hover:bg-[#4a3629] text-left transition-colors cursor-pointer group border border-[#634937]"
                    title="Gérer les approbations des utilisateurs et lecteurs"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-300" />
                      <span className="font-medium text-amber-100">Gestion des Accès</span>
                    </span>
                    {pendingApprovalsCount > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-900 font-bold text-[10px] animate-pulse">
                        {pendingApprovalsCount} en attente
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300">Gérer 👥</span>
                    )}
                  </button>
                )}

                {/* Verrouiller PIN pour utilisateur lecteur */}
                {!isAdmin && isPinUnlocked && onLockEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLockEditing();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 mt-1 rounded-md bg-[#2d211a] hover:bg-[#3d2c22] text-left transition-colors cursor-pointer group border border-[#4d382b]"
                    title="Verrouiller à nouveau les modifications"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-medium text-amber-200">Reverrouiller modifications</span>
                    </span>
                    <span className="text-[10px] text-stone-400">Code 0045</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bouton rapide admin pour les demandes en attente */}
        {isAdmin && pendingApprovalsCount > 0 && onOpenUserManagement && (
          <button
            type="button"
            onClick={onOpenUserManagement}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs rounded-md shadow-xs animate-pulse cursor-pointer border border-amber-400"
            title={`${pendingApprovalsCount} demande(s) en attente de validation`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{pendingApprovalsCount} en attente</span>
          </button>
        )}

        {/* Séparateur subtil */}
        <div className="w-px h-6 bg-[#3d3026] mx-0.5 hidden sm:block" />

        {/* Statut Synchronisation Cloud Google / Firebase */}
        <AuthStatus
          user={user}
          isLoading={isAuthLoading}
          syncStatus={syncStatus}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onManualSync={onManualSync}
          isAdmin={isAdmin}
          onOpenUserManagement={onOpenUserManagement}
          pendingApprovalsCount={pendingApprovalsCount}
        />
      </div>
    </header>
  );
};
