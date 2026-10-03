import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  RefreshCw,
  AlertCircle,
  Users,
  ChevronDown,
  Shield,
  CheckCircle2,
  Lock,
  ExternalLink,
  User as UserIcon
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthStatusProps {
  user: UserProfile | null;
  isLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error' | 'quota_exceeded';
  onSignIn: () => void;
  onSignOut: () => void;
  onManualSync?: () => void;
  isAdmin?: boolean;
  onOpenUserManagement?: () => void;
  pendingApprovalsCount?: number;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({
  user,
  isLoading,
  syncStatus,
  onSignIn,
  onSignOut,
  onManualSync,
  isAdmin = false,
  onOpenUserManagement,
  pendingApprovalsCount = 0
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Local state to prevent infinite spinning if Firebase Auth takes time to answer
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && !user) {
      setLoadingTimedOut(false);
      timer = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 3500); // 3.5s safety timeout
    } else {
      setLoadingTimedOut(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, user]);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showDropdown]);

  // 1. Loading state: Only show spinner while actively loading, if user is not yet loaded, AND not timed out
  if (isLoading && !user && !loadingTimedOut) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#d6c5b2] bg-[#2a2019] rounded-xl border border-[#4d3a2c] shadow-xs select-none animate-pulse">
        <div className="w-3.5 h-3.5 border-2 border-[#c4a482] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span className="hidden sm:inline font-medium tracking-wide">Connexion...</span>
      </div>
    );
  }

  // 2. Unauthenticated State: Luxury Google Sign In button
  if (!user) {
    return (
      <button
        type="button"
        onClick={onSignIn}
        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8c6239] via-[#805832] to-[#6d4b2b] hover:from-[#9c6e41] hover:to-[#7c5531] border border-[#b88c5f]/40 hover:border-[#c4a482] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(140,98,57,0.35)] flex items-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98]"
        title="Se connecter avec votre compte Google"
      >
        <div className="w-4 h-4 bg-white rounded-full p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs">
          <svg className="w-3 h-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </div>
        <span className="tracking-wide">Connexion Google</span>
      </button>
    );
  }

  // 3. Authenticated State: User Display Name & Google Avatar with Dropdown
  const rawName = user.displayName || user.email?.split('@')[0] || 'Utilisateur';
  const initial = (rawName.charAt(0) || 'U').toUpperCase();

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      {/* Cloud Synchronisation Indicator (Discrete) */}
      <div 
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1410] border border-[#3d2f24] rounded-lg text-[11px] text-[#c4b5a5] select-none shadow-2xs"
        title={
          syncStatus === 'synced' 
            ? 'Inventaire synchronisé avec Firestore Cloud'
            : syncStatus === 'syncing'
            ? 'Synchronisation cloud en cours...'
            : syncStatus === 'quota_exceeded'
            ? 'Quota quotidien Firestore atteint. Sauvegarde locale persistante active.'
            : syncStatus === 'error'
            ? 'Erreur de synchronisation cloud'
            : 'Mode persistance locale actif'
        }
      >
        {syncStatus === 'synced' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 font-medium">Cloud OK</span>
          </>
        )}
        {syncStatus === 'syncing' && (
          <>
            <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
            <span className="text-amber-300 font-medium">Synchro...</span>
          </>
        )}
        {syncStatus === 'quota_exceeded' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-medium">Local (Quota)</span>
          </>
        )}
        {syncStatus === 'offline' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            <span className="text-stone-300">Local</span>
          </>
        )}
        {syncStatus === 'error' && (
          <>
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="text-red-300 font-medium">Erreur</span>
          </>
        )}
      </div>

      {/* Luxury User Profile Avatar & Name Trigger */}
      <button
        type="button"
        onClick={() => setShowDropdown(prev => !prev)}
        className={`relative flex items-center gap-2 pl-1.5 pr-2.5 py-1 text-xs text-[#faf6f0] bg-[#2a2018] hover:bg-[#382b22] border rounded-xl transition-all cursor-pointer shadow-xs select-none ${
          showDropdown 
            ? 'border-[#c4a482] ring-2 ring-[#c4a482]/30 bg-[#35281e]' 
            : 'border-[#4d3a2c] hover:border-[#8c6239]'
        }`}
        title={`Compte Google : ${user.displayName || user.email} (${isAdmin ? 'Administrateur' : 'Lecteur'}) — Cliquer pour le menu`}
      >
        {/* User Google Avatar with high fidelity styling */}
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'Avatar Google'} 
            className="w-6 h-6 rounded-full border border-[#c4a482]/80 object-cover flex-shrink-0 shadow-2xs"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Graceful fallback to monogram initials if Google photo fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.fallback-initials')) {
                const span = document.createElement('div');
                span.className = 'fallback-initials w-6 h-6 rounded-full bg-[#8c6239] text-[#faf6f0] flex items-center justify-center font-bold text-[10px] border border-[#c4a482]/80';
                span.innerText = initial;
                parent.prepend(span);
              }
            }}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8c6239] to-[#6d4b2b] text-[#faf6f0] flex items-center justify-center font-bold text-[11px] border border-[#c4a482]/80 shadow-inner flex-shrink-0">
            {initial}
          </div>
        )}

        {/* User Name & Role */}
        <div className="flex flex-col items-start leading-tight text-left">
          <span className="font-semibold text-xs text-[#faf6f0] max-w-[120px] sm:max-w-[150px] truncate">
            {rawName}
          </span>
          <span className="text-[10px] text-[#c4b5a5] flex items-center gap-1">
            {isAdmin ? (
              <span className="text-amber-300 font-medium">👑 Administrateur</span>
            ) : (
              <span className="text-emerald-300 font-medium">✓ Lecteur</span>
            )}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-[#c4a482] transition-transform duration-200 ml-0.5 ${showDropdown ? 'rotate-180' : ''}`} />

        {/* Pending approvals badge counter for admin */}
        {isAdmin && pendingApprovalsCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-[#17120e] font-bold text-[9px] rounded-full flex items-center justify-center shadow-md animate-bounce border border-[#17120e]"
            title={`${pendingApprovalsCount} demande(s) en attente`}
          >
            {pendingApprovalsCount}
          </span>
        )}
      </button>

      {/* Luxury Profile Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#221a15] text-[#f7f5f0] border border-[#4d3a2c] rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.55)] z-50 p-3.5 animate-in fade-in-50 zoom-in-95 duration-100 backdrop-blur-md">
          {/* Header with full profile info */}
          <div className="flex items-center gap-3 border-b border-[#3d2e23] pb-3 mb-3">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="" 
                className="w-11 h-11 rounded-full border-2 border-[#c4a482] object-cover flex-shrink-0 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#8c6239] to-[#6d4b2b] text-[#faf6f0] flex items-center justify-center font-bold text-base border-2 border-[#c4a482] shadow-inner flex-shrink-0">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate font-cinzel tracking-wide">
                {user.displayName || rawName}
              </p>
              <p className="text-[11px] text-[#b3a190] truncate font-mono mt-0.5" title={user.email || ''}>
                {user.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-600/70 text-amber-300 font-bold text-[10px] tracking-wide inline-flex items-center gap-1">
                    <span>👑</span>
                    <span>Administrateur</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/70 text-emerald-300 font-semibold text-[10px] inline-flex items-center gap-1">
                    <span>✓</span>
                    <span>Lecteur Approuvé</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Role details notice */}
          {!isAdmin && (
            <div className="mb-3 p-2.5 rounded-lg bg-[#19130f] border border-[#3d2e23] text-[11px] text-[#b8a694] flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-[#c4a482] flex-shrink-0 mt-0.5" />
              <span>Profil en lecture seule. Pour modifier les articles, utilisez le code secret <strong>0045</strong>.</span>
            </div>
          )}

          {/* Quota Exceeded Notification if triggered */}
          {syncStatus === 'quota_exceeded' && (
            <div className="mb-3 p-2.5 rounded-lg bg-amber-950/50 border border-amber-800/80 text-[11px] text-amber-200">
              <div className="font-semibold text-amber-300 flex items-center gap-1 mb-1">
                <span>⚡</span>
                <span>Quota Firestore journalier atteint</span>
              </div>
              <p className="text-[10.5px] text-amber-200/90 leading-snug">
                Vos fiches restent 100% enregistrées en mémoire locale sans interruption.
              </p>
            </div>
          )}

          {/* Actions Menu */}
          <div className="space-y-1.5">
            {/* Admin Management Button */}
            {isAdmin && onOpenUserManagement && (
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  onOpenUserManagement();
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-white bg-[#8c6239] hover:bg-[#9c6f44] border border-[#aa7a4a] rounded-lg flex items-center justify-between transition-colors cursor-pointer shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#ffdca8]" />
                  <span>Gestion des Utilisateurs</span>
                </span>
                {pendingApprovalsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-bold text-[10px]">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            {/* Manual Sync Button */}
            {onManualSync && (
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  onManualSync();
                }}
                className="w-full px-3 py-2 text-xs text-[#ded2c3] hover:text-white bg-[#2b211a] hover:bg-[#382b22] border border-[#443327] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#c4a482]" />
                <span>Tester la synchronisation cloud</span>
              </button>
            )}

            {/* Clean Logout Button [ 🚪 Déconnexion ] */}
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false);
                onSignOut();
              }}
              className="w-full mt-2 px-3 py-2 text-xs font-semibold text-red-200 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 hover:border-red-700 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Se déconnecter de la session Google"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>🚪 Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
