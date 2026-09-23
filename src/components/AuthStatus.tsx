import React, { useState } from 'react';
import { 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Users
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthStatusProps {
  user: UserProfile | null;
  isLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
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


  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-400 bg-[#352c25] rounded border border-[#52443a]">
        <div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        <span className="hidden sm:inline">Connexion...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={onSignIn}
        className="px-3 py-1.5 text-xs font-semibold text-[#f7f5f0] bg-[#3a2e25] hover:bg-[#4d3d32] border border-[#6b5443] hover:border-[#8c6239] rounded shadow-xs flex items-center gap-2 transition-all cursor-pointer select-none group"
        title="Se connecter avec Google pour synchroniser vos articles dans Firestore"
      >
        <svg className="w-3.5 h-3.5 text-white flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span className="font-medium whitespace-nowrap">Connexion Google</span>
      </button>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Sync Status Badge */}
      <div 
        className="flex items-center gap-1.5 px-2 py-1 bg-[#1e1713] border border-[#3d3026] rounded text-[11px] text-[#c4b5a5] select-none"
        title={
          syncStatus === 'synced' 
            ? 'Données sauvegardées en temps réel dans Firestore'
            : syncStatus === 'syncing'
            ? 'Synchronisation avec Firestore en cours...'
            : syncStatus === 'error'
            ? 'Erreur de synchronisation Firestore'
            : 'Mode hors-ligne actif (cache local)'
        }
      >
        {syncStatus === 'synced' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="hidden lg:inline text-emerald-300 font-medium">Cloud synchronisé</span>
          </>
        )}
        {syncStatus === 'syncing' && (
          <>
            <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
            <span className="hidden lg:inline text-amber-300 font-medium">Synchro...</span>
          </>
        )}
        {syncStatus === 'offline' && (
          <>
            <CloudOff className="w-3 h-3 text-stone-400" />
            <span className="hidden lg:inline text-stone-300">Local</span>
          </>
        )}
        {syncStatus === 'error' && (
          <>
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="hidden lg:inline text-red-300">Erreur synchro</span>
          </>
        )}
      </div>

      {/* User profile dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(prev => !prev)}
          className="relative flex items-center gap-2 px-2.5 py-1 text-xs text-[#faf6f0] bg-[#3a2e25] hover:bg-[#4d3d32] border border-[#5c4a3b] rounded transition-all cursor-pointer shadow-xs"
          title={`Connecté en tant que ${user.displayName || user.email || 'Utilisateur'}${isAdmin ? ' (Administrateur)' : ''}`}
        >
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'Photo'} 
              className="w-5 h-5 rounded-full border border-amber-500/60 object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#8c6239] text-white flex items-center justify-center font-bold text-[10px]">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="max-w-[100px] truncate hidden md:inline font-medium">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          {isAdmin && pendingApprovalsCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-[#17120e] font-bold text-[9px] rounded-full flex items-center justify-center shadow-md animate-bounce"
              title={`${pendingApprovalsCount} demande(s) d'accès en attente`}
            >
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)} 
            />
            <div className="absolute right-0 mt-1 w-64 bg-[#2a221d] text-[#f7f5f0] border border-[#52443a] rounded-md shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-2.5 border-b border-[#3d332c] pb-2.5 mb-2.5">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Photo'} 
                    className="w-8 h-8 rounded-full border border-amber-500/60 object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#8c6239] text-white flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {user.displayName || 'Utilisateur'}
                  </p>
                  <p className="text-[11px] text-stone-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-stone-300 space-y-1 mb-3">
                <div className="flex items-center justify-between text-stone-400">
                  <span>Rôle :</span>
                  {isAdmin ? (
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      👑 Administrateur
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium">
                      📖 Lecteur Approuvé
                    </span>
                  )}
                </div>
                {!isAdmin && (
                  <p className="text-[10px] text-stone-400 italic bg-[#1f1713] p-1.5 rounded border border-[#3d2e23]">
                    🔒 Code PIN secret requis pour modifier, importer ou supprimer des articles.
                  </p>
                )}
                <p className="flex items-center justify-between text-stone-400">
                  <span>Base :</span>
                  <span className="text-amber-300 font-mono">Firestore Cloud</span>
                </p>
              </div>

              {/* Admin Accès Panel */}
              {isAdmin && onOpenUserManagement && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenUserManagement();
                    setShowDropdown(false);
                  }}
                  className="w-full mb-2 px-2.5 py-1.5 text-xs text-white bg-[#8c6239] hover:bg-[#734f2d] rounded border border-[#aa7a4a] flex items-center justify-between transition-colors cursor-pointer shadow-xs"
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Users className="w-3.5 h-3.5 text-[#ffdca8]" />
                    <span>Gestion des Accès</span>
                  </span>
                  {pendingApprovalsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-[#1e1713] font-bold text-[10px] animate-pulse">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>
              )}

              {onManualSync && (
                <button
                  type="button"
                  onClick={() => {
                    onManualSync();
                    setShowDropdown(false);
                  }}
                  className="w-full mb-2 px-2.5 py-1.5 text-xs text-[#dfd4c5] hover:text-white bg-[#352c25] hover:bg-[#43382f] rounded border border-[#52443a] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-[#c4a482]" />
                  <span>Forcer la synchronisation</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  setShowDropdown(false);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-red-200 hover:text-white bg-red-950/40 hover:bg-red-900/60 rounded border border-red-800/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
