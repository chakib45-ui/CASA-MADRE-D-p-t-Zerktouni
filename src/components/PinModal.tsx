import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, X, Check, ShieldAlert, Lock } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Modification du catalogue',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.trim() === '0045') {
      setError(null);
      onSuccess();
      onClose();
    } else {
      setError('Code d’autorisation incorrect. Accès refusé.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin === '0045') {
        onSuccess();
        onClose();
      } else if (nextPin.length === 4 && nextPin !== '0045') {
        setError('Code d’autorisation incorrect. Accès refusé.');
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-sm bg-[#241c17] text-[#f7f5f0] border border-[#524133] rounded-2xl p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-stone-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête */}
        <div className="text-center mb-5">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#8c6239]/40 border border-[#a87f54] text-[#ffdca8] flex items-center justify-center mb-3 shadow-inner">
            <KeyRound className="w-6 h-6 text-[#ffdca8]" />
          </div>
          <h2 className="font-cinzel text-lg font-bold text-[#faf6f0]">
            Code d'Autorisation
          </h2>
          <p className="text-xs text-[#c4b5a5] mt-1">
            Action protégée : <strong className="text-white">{actionTitle}</strong>
          </p>
          <p className="text-[11px] text-[#9e8b7b] mt-0.5">
            Saisissez le code secret de modification pour continuer
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-2.5 bg-red-950/70 border border-red-800 rounded-lg text-red-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Champ de saisie */}
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="relative flex items-center justify-center">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                setError(null);
                if (val === '0045') {
                  onSuccess();
                  onClose();
                }
              }}
              placeholder="••••"
              className="w-40 text-center tracking-[0.4em] font-mono text-2xl font-bold py-2 bg-[#17120e] text-[#faf6f0] border-2 border-[#8c6239] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4a482] transition-all shadow-inner"
            />
          </div>
        </form>

        {/* Clavier virtuel numérique */}
        <div className="grid grid-cols-3 gap-2 mb-4 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(num)}
              className="py-2.5 rounded-lg bg-[#30241b] hover:bg-[#423226] text-white font-mono text-base font-semibold border border-[#4d3d32] transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="py-2.5 rounded-lg bg-[#241a13] hover:bg-[#33251c] text-stone-300 font-mono text-xs font-semibold border border-[#44352a] transition-colors cursor-pointer"
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="py-2.5 rounded-lg bg-[#30241b] hover:bg-[#423226] text-white font-mono text-base font-semibold border border-[#4d3d32] transition-colors cursor-pointer active:scale-95 shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="py-2.5 rounded-lg bg-[#8c6239] hover:bg-[#734f2d] text-white font-mono text-xs font-bold border border-[#aa7a4a] transition-colors cursor-pointer flex items-center justify-center"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#3d2f25] text-xs">
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-3 py-1.5 bg-[#8c6239] hover:bg-[#734f2d] text-white font-semibold rounded-md border border-[#aa7a4a] transition-colors cursor-pointer"
          >
            Valider le code
          </button>
        </div>

      </div>
    </div>
  );
};
