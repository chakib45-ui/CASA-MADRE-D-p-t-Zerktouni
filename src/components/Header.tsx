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
  Plus, 
  FileText, 
  Users, 
  Lock, 
  Volume2, 
  VolumeX,
  Menu
} from 'lucide-react';

import { CatalogConfig, LayoutMode, ThemeId, UserProfile } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';
import { AuthStatus } from './AuthStatus';
import { isAudioMuted, toggleAudioMuted, playClickSound } from '../utils/audioFeedback';

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
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error' | 'quota_exceeded';
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isAudioMuted());
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Focus search input when mobile search is toggled open
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const handleToggleSound = () => {
    const muted = toggleAudioMuted();
    setSoundMuted(muted);
    if (!muted) playClickSound();
  };

  const handleUpdateConfig = <K extends keyof CatalogConfig>(key: K, value: CatalogConfig[K]) => {
    if (onChangeConfig) {
      onChangeConfig({
        ...safeConfig,
        [key]: value,
      });
    }
  };

  return (
    <header className="bg-[#1e1712] text-[#f7f5f0] border-b border-[#382b21] px-2.5 py-2 sm:px-5 flex flex-col no-print shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative z-30 transition-all">
      {/* Top Main Navigation Bar */}
      <div className="flex items-center justify-between gap-2 w-full">
        {/* 1. GAUCHE : Logo & Titre CASA MADRE - Dépôt Zerktouni */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#9c6f42] via-[#8c6239] to-[#6d4b2b] text-[#faf6f0] flex items-center justify-center font-cinzel font-bold text-xs sm:text-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-[#b88c5f]/60 flex-shrink-0 select-none">
            CM
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-cinzel text-xs sm:text-base font-bold tracking-[0.14em] text-[#faf6f0] leading-none whitespace-nowrap drop-shadow-xs">
                {safeConfig.mainTitle || 'CASA MADRE'}
              </h1>
              <span className="text-[8.5px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-[#2b2018] text-[#d6c5b2] tracking-wider border border-[#4a3a2e] whitespace-nowrap shadow-2xs font-semibold">
                {safeConfig.subtitle || 'Dépôt Zerktouni'}
              </span>
            </div>
            <p className="font-garamond italic text-[11px] text-[#c4b5a5] mt-0.5 hidden lg:block whitespace-nowrap">
              Inventaire d'Antiquités & Catalogue A4
            </p>
          </div>
        </div>

        {/* 2. CENTRE : Barre de Recherche (Écrans larges >= md) */}
        {onSearchChange && (
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2">
            <div className="relative flex items-center w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[#b3a18f] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onSearchChange('');
                }}
                placeholder="🔍 Rechercher par nom ou référence..."
                className="w-full pl-9 pr-14 py-1.5 bg-[#150f0c] hover:bg-[#1a130f] text-[#f7f5f0] placeholder-[#8e7e70] text-xs rounded-xl border border-[#3d2f25] focus:outline-none focus:border-[#c4a482] focus:ring-1 focus:ring-[#8c6239] transition-all shadow-inner"
                title="Rechercher des articles dans l'inventaire"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                {searchQuery.trim() !== '' && searchResultCount !== undefined && (
                  <span 
                    className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-[#8c6239]/50 text-[#f5ebd9] border border-[#8c6239]/80 select-none shadow-2xs"
                    title={`${searchResultCount} article(s) trouvé(s)`}
                  >
                    {searchResultCount}
                  </span>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="text-stone-400 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                    title="Effacer la recherche"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. DROITE : Actions + Retour Audio + Menu Outils + Profil */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Bouton recherche mobile (< md) */}
          {onSearchChange && (
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(prev => !prev)}
              className={`md:hidden p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isMobileSearchOpen || searchQuery
                  ? 'bg-[#3d2f24] text-white border-[#c4a482]'
                  : 'bg-[#2b2019] text-[#d6c5b2] hover:text-white border-[#48372b]'
              }`}
              title="Rechercher un article"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle Sonore Audio Feedback */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              soundMuted 
                ? 'bg-[#2b2019] text-stone-500 border-[#403024]' 
                : 'bg-[#2f2219] text-amber-300 border-[#694c34] hover:bg-[#3d2c20]'
            }`}
            title={soundMuted ? 'Effets sonores désactivés (cliquer pour activer)' : 'Effets sonores activés (cliquer pour couper)'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Bouton principal d'action : [ ➕ Importer / 📷 Scanner ] */}
          <div className="flex items-center bg-gradient-to-r from-[#8c6239] to-[#754f2c] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-[#a87a4a]/70 overflow-hidden">
            {onOpenBatchUpload && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenBatchUpload();
                }}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1 transition-colors cursor-pointer hover:bg-black/15 active:scale-98"
                title="Importer des photos d'articles"
              >
                <Plus className="w-3.5 h-3.5 text-[#ffdca8]" />
                <span className="hidden xs:inline sm:inline">+ Importer</span>
              </button>
            )}

            {onOpenBatchUpload && onOpenScanner && (
              <div className="w-px h-4 bg-white/20" />
            )}

            {onOpenScanner && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenScanner();
                }}
                className="px-2 sm:px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1 transition-colors cursor-pointer hover:bg-black/15 active:scale-98"
                title="Scanner / Photographier en direct"
              >
                <Camera className="w-3.5 h-3.5 text-[#ffdca8]" />
                <span className="hidden md:inline">Scanner</span>
              </button>
            )}
          </div>

          {/* Menu Déroulant Unique : ⚙️ Outils & Actions 🔽 */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsMenuOpen(prev => !prev);
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isMenuOpen 
                  ? 'bg-[#3d2f24] text-white border-[#c4a482] ring-2 ring-[#c4a482]/40' 
                  : 'bg-[#2b2019] hover:bg-[#382b22] text-[#f0e2d3] hover:text-white border-[#48372b]'
              }`}
              title="Outils & Actions : Exportation, Affichage, Configuration"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#c4a482]" />
              <span className="hidden sm:inline tracking-wide">Outils</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#c4a482] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Panneau du menu déroulant adaptatif (ne déborde jamais sur mobile) */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-20px)] max-w-xs sm:w-80 bg-[#221a15] border border-[#48372b] rounded-xl shadow-[0_16px_45px_rgba(0,0,0,0.65)] p-3 z-50 text-xs text-[#ede3d5] divide-y divide-[#382b21] animate-in fade-in-50 zoom-in-95 duration-100 backdrop-blur-md">
                
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
                        playClickSound();
                        setIsMenuOpen(false);
                        onPrint();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#35281f] text-left transition-colors cursor-pointer group"
                      title="Imprimer ou aperçu avant impression A4"
                    >
                      <span className="flex items-center gap-2">
                        <Printer className="w-3.5 h-3.5 text-[#d4a373] group-hover:text-white" />
                        <span className="font-medium text-[#f5ede3]">Imprimer le catalogue</span>
                      </span>
                      <span className="text-[10px] text-stone-400">A4</span>
                    </button>

                    {/* Télécharger le PDF A4 */}
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => {
                        playClickSound();
                        setIsMenuOpen(false);
                        onDownloadPDF();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#35281f] disabled:opacity-50 text-left transition-colors cursor-pointer group"
                      title="Générer et télécharger le catalogue au format PDF A4 haute définition"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                        <span className="font-medium text-[#f5ede3]">
                          {isExporting ? (exportStatus || 'Export en cours...') : 'Télécharger le PDF A4'}
                        </span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#8c6239]/40 border border-[#aa7a4a]/50 text-amber-200">
                        PDF HD
                      </span>
                    </button>

                    {/* Télécharger le fichier Excel (.xlsx) */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsMenuOpen(false);
                        onDownloadExcel();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#35281f] text-left transition-colors cursor-pointer group"
                      title="Exporter l'inventaire complet dans une feuille de calcul Excel .xlsx"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                        <span className="font-medium text-[#f5ede3]">Télécharger le fichier Excel</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-900/40 border border-emerald-600/40 text-emerald-300">
                        .xlsx
                      </span>
                    </button>
                  </div>
                </div>

                {/* SECTION 2 : 🖼️ Affichage & Mise en page */}
                <div className="py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c4a482] px-2 py-1 mb-1">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Affichage & Mise en page</span>
                  </div>

                  <div className="space-y-2 px-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#dfd4c5]">Disposition :</span>
                      <select
                        value={safeConfig.layoutMode}
                        onChange={(e) => handleUpdateConfig('layoutMode', e.target.value as LayoutMode)}
                        className="bg-[#2e231b] text-[#faf6f0] border border-[#4d3a2c] rounded-lg px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-[#c4a482] cursor-pointer"
                      >
                        <option value="1-per-page">1 article / page</option>
                        <option value="2-per-page">2 articles / page</option>
                        <option value="3-horizontal">3 articles / page</option>
                        <option value="4-per-page">4 articles / page</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#dfd4c5]">Thème catalogue :</span>
                      <select
                        value={safeConfig.themeId}
                        onChange={(e) => handleUpdateConfig('themeId', e.target.value as ThemeId)}
                        className="bg-[#2e231b] text-[#faf6f0] border border-[#4d3a2c] rounded-lg px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-[#c4a482] cursor-pointer"
                      >
                        <option value="clair">Thème Clair</option>
                        <option value="fonce">Thème Galerie (Foncé)</option>
                      </select>
                    </div>

                    {/* Mode Sombre UI */}
                    {onToggleDarkMode && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onToggleDarkMode();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#2b2018] hover:bg-[#382b22] border border-[#443327] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {isDarkMode ? (
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Moon className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>Interface : {isDarkMode ? 'Mode Sombre' : 'Mode Clair'}</span>
                        </span>
                        <span className="text-[10px] text-stone-400">Basculer</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* SECTION 3 : ℹ️ Configuration */}
                <div className="pt-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c4a482] px-2 py-1 mb-1">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configuration</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsMenuOpen(false);
                      onOpenHeaderSettings();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#35281f] text-left transition-colors cursor-pointer group"
                    title="Personnaliser les informations, en-tête et coordonnées"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-[#c4a482] group-hover:text-white" />
                      <span className="font-medium text-[#f5ede3]">Configuration & Sauvegarde</span>
                    </span>
                    <span className="text-[10px] text-stone-400">Gérer / Exporter 💾</span>
                  </button>

                  {isAdmin && onOpenUserManagement && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsMenuOpen(false);
                        onOpenUserManagement();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 mt-1 rounded-lg bg-[#38281e] hover:bg-[#4a3629] text-left transition-colors cursor-pointer group border border-[#634937]"
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
                        <span className="text-[10px] text-amber-300">👥 Gérer</span>
                      )}
                    </button>
                  )}

                  {!isAdmin && isPinUnlocked && onLockEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsMenuOpen(false);
                        onLockEditing();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 mt-1 rounded-lg bg-[#2b2019] hover:bg-[#3a2b21] text-left transition-colors cursor-pointer group border border-[#48372b]"
                      title="Verrouiller à nouveau les modifications"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-medium text-amber-200">Reverrouiller modifications</span>
                      </span>
                      <span className="text-[10px] text-stone-400">🔒 Protégé</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profil / Connexion Google */}
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
      </div>

      {/* Barre de Recherche Déroulante sur Mobile (< md) */}
      {isMobileSearchOpen && onSearchChange && (
        <div className="md:hidden mt-2 pt-2 border-t border-[#382b21] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-[#b3a18f] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsMobileSearchOpen(false);
              }}
              placeholder="🔍 Rechercher un article par nom ou référence..."
              className="w-full pl-9 pr-14 py-2 bg-[#150f0c] text-[#f7f5f0] placeholder-[#8e7e70] text-xs rounded-xl border border-[#4a392e] focus:outline-none focus:border-[#c4a482] shadow-inner"
            />
            <div className="absolute right-1.5 flex items-center gap-1.5">
              {searchQuery.trim() !== '' && searchResultCount !== undefined && (
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-[#8c6239]/60 text-[#f5ebd9] border border-[#8c6239]">
                  {searchResultCount}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (searchQuery) onSearchChange('');
                  else setIsMobileSearchOpen(false);
                }}
                className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
