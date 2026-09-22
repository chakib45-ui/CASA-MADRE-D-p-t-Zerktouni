import React from 'react';
import { Clock, RefreshCw, LogOut, ShieldAlert, Mail } from 'lucide-react';
import { UserProfile } from '../types';

interface PendingApprovalScreenProps {
  user: UserProfile;
  status: 'pending' | 'rejected';
  onSignOut: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  status,
  onSignOut,
  onRefresh,
  isRefreshing = false,
}) => {
  const isRejected = status === 'rejected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17120e] text-[#f7f5f0] p-4 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#32251c]/70 via-[#1c1511] to-[#0f0b09] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-[#241c17] border border-[#4d3d32] rounded-2xl p-8 sm:p-10 shadow-2xl text-center">
        
        {/* Monogramme / Icône de statut */}
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-[#5a4638]">
          {isRejected ? (
            <div className="w-full h-full rounded-2xl bg-red-950/80 border border-red-700/60 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-[#3d2e23] border border-[#8c6239]/60 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
          )}
        </div>

        {/* Titres */}
        <h1 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wider text-[#faf6f0] mb-2">
          CASA MADRE - Dépôt Zerktouni
        </h1>

        {isRejected ? (
          <>
            <div className="inline-block px-3 py-1 rounded bg-red-950/70 text-red-300 font-mono text-xs uppercase tracking-wider border border-red-800/80 mb-6">
              Accès refusé
            </div>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
              Votre demande d'accès n'a pas été validée par l'administrateur. Veuillez contacter{' '}
              <span className="text-[#e2be9b] font-medium">chakib.45@gmail.com</span> pour toute question.
            </p>
          </>
        ) : (
          <>
            <div className="inline-block px-3 py-1 rounded bg-amber-950/60 text-amber-300 font-mono text-xs uppercase tracking-wider border border-amber-800/60 mb-6">
              Demande en attente de validation
            </div>
            <div className="p-4 bg-[#1b1410] border border-[#3d2e23] rounded-xl text-left mb-6">
              <p className="text-[#f5ede3] text-sm sm:text-base font-semibold mb-2">
                Votre demande est en cours de validation par le propriétaire (chakib.45@gmail.com).
              </p>
              <p className="text-[#c4b5a5] text-xs leading-relaxed">
                Une fois votre compte approuvé, votre espace se déverrouillera automatiquement en mode Lecture Seule.
              </p>
            </div>
          </>
        )}

        {/* Détails du compte connecté */}
        <div className="flex items-center justify-center gap-3 py-2.5 px-4 bg-[#1f1713] rounded-lg border border-[#3d2f25] mb-8 text-xs text-[#d6c5b2]">
          <Mail className="w-4 h-4 text-[#c4a482]" />
          <span>Compte connecté :</span>
          <strong className="text-white font-mono">{user.email}</strong>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {!isRejected && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#3a2e25] hover:bg-[#4d3d32] border border-[#6b5443] text-[#f5ede3] font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Vérification...' : 'Vérifier mon statut'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSignOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#291f19] hover:bg-[#382b22] border border-[#4a392e] text-stone-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-400" />
            <span>Se déconnecter</span>
          </button>
        </div>

      </div>
    </div>
  );
};
