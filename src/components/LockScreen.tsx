import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../lib/firebase';

interface LockScreenProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }
    setLocalError(null);
    setEmailLoading(true);
    try {
      if (isRegisterMode) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error('Erreur authentification email:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setLocalError('Adresse e-mail ou mot de passe incorrect.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setLocalError('Cet e-mail est déjà associé à un compte. Veuillez vous connecter.');
      } else if (err?.code === 'auth/weak-password') {
        setLocalError('Le mot de passe doit comporter au moins 6 caractères.');
      } else {
        setLocalError(err?.message || 'Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17120e] text-[#f7f5f0] p-4 select-none overflow-hidden">
      {/* Texture de fond subtile */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#32251c]/70 via-[#1c1511] to-[#0f0b09] pointer-events-none" />

      {/* Cadre central luxueux et épuré */}
      <div className="relative w-full max-w-md bg-[#241c17] border border-[#4d3d32] rounded-2xl p-8 sm:p-10 shadow-2xl text-center backdrop-blur-sm">
        
        {/* Logo Monogramme Casa Madre */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-[#8c6239] text-[#faf6f0] flex items-center justify-center font-cinzel font-bold text-3xl shadow-xl border-2 border-[#a87f54] mb-6">
          CM
        </div>

        {/* Titre Institutionnel */}
        <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.16em] text-[#faf6f0] leading-tight mb-2">
          CASA MADRE
        </h1>
        <div className="inline-block px-3 py-1 rounded bg-[#382b22] text-[#d6c5b2] font-mono text-xs uppercase tracking-widest border border-[#4d3d32] mb-5">
          Dépôt Zerktouni
        </div>

        <p className="font-garamond italic text-[#c4b5a5] text-sm sm:text-base leading-relaxed mb-8 max-w-xs mx-auto">
          Inventaire d'Antiquités & Catalogue Interactif réservé aux membres autorisés
        </p>

        {/* Séparateur élégant */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-px bg-[#4d3d32]" />
          <Lock className="w-4 h-4 text-[#c4a482]" />
          <div className="w-12 h-px bg-[#4d3d32]" />
        </div>

        {/* Message d'erreur éventuel */}
        {(errorMessage || localError) && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-200 text-xs text-left">
            ⚠️ {errorMessage || localError}
          </div>
        )}

        {/* Bouton Central : Connexion avec Google */}
        <button
          type="button"
          onClick={onSignIn}
          disabled={isLoading || emailLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#8c6239] to-[#734f2d] hover:from-[#9c6f42] hover:to-[#835c36] text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl border border-[#b88c5f]/50 flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed group"
          title="Se connecter avec votre compte Google"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connexion en cours...</span>
            </>
          ) : (
            <>
              {/* Logo Google Officiel */}
              <div className="w-6 h-6 bg-white rounded-full p-1 flex items-center justify-center shadow-xs flex-shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <span className="tracking-wide">Connexion avec Google</span>
            </>
          )}
        </button>

        {/* Alternative Email/Mot de passe */}
        <div className="mt-4">
          {!showEmailForm ? (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="text-xs text-[#bda795] hover:text-[#e8ded5] transition-colors underline cursor-pointer"
            >
              Ou se connecter avec e-mail et mot de passe
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="mt-4 p-4 bg-[#1b1410] border border-[#3d2e23] rounded-xl text-left animate-fade-in">
              <div className="text-xs font-semibold text-[#f5ede3] mb-3 flex items-center justify-between">
                <span>{isRegisterMode ? 'Créer un compte par e-mail' : 'Connexion par e-mail'}</span>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-[11px] text-[#c4a482] hover:underline"
                >
                  {isRegisterMode ? 'Déjà un compte ?' : 'Nouveau ? Créer un compte'}
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] text-[#c4b5a5] mb-1">Adresse E-mail</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8c6239]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded bg-[#241c17] border border-[#4d3d32] text-white focus:outline-none focus:border-[#8c6239]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#c4b5a5] mb-1">Mot de passe</label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8c6239]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded bg-[#241c17] border border-[#4d3d32] text-white focus:outline-none focus:border-[#8c6239]"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="flex-1 py-2 px-3 bg-[#8c6239] hover:bg-[#a07244] text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {emailLoading ? 'Traitement...' : isRegisterMode ? "Créer l'accès" : 'Valider'}
                    {!emailLoading && <ArrowRight className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="py-2 px-3 bg-[#2d231c] hover:bg-[#382b22] text-[#c4b5a5] rounded text-xs transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Note de sécurité */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-[#9e8b7b]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c4a482]" />
          <span>Accès sécurisé par Firebase Auth & Contrôle d'accès</span>
        </div>

      </div>
    </div>
  );
};

