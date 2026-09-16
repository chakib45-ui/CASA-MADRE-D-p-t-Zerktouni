import React, { useState } from 'react';
import { X, FolderPlus, Check } from 'lucide-react';

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folderName: string) => void;
  existingFolders: string[];
}

export const FolderCreateModal: React.FC<FolderCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  existingFolders,
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const suggestions = [
    'Halloween',
    'Antiquités',
    'Mobilier & Boiseries',
    'Art Déco & Années 30',
    'Tableaux & Gravures',
    'Argenterie & Orfèvrerie',
    'Luminaires & Bronzes',
    'Céramiques & Faïences',
  ].filter(s => !existingFolders.includes(s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError('Veuillez saisir un nom de dossier');
      return;
    }
    if (existingFolders.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ce dossier existe déjà');
      return;
    }

    onCreateFolder(trimmed);
    setFolderName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div
        className="bg-white dark:bg-[#1e1712] rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-[#e2d9ce] dark:border-[#3d2f24] animate-fade-in transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#e2d9ce] dark:border-[#382b21] flex justify-between items-center bg-[#faf7f2] dark:bg-[#261d17]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#8c6239] text-white flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-cinzel text-sm font-bold text-[#5c3e21] dark:text-[#f3dfcc]">
                Créer un nouveau dossier
              </h2>
              <p className="text-[10.5px] text-[#6e6259] dark:text-[#a8988a]">
                Organisez vos articles par thèmes ou départements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1.5">
              Nom du dossier :
            </label>
            <input
              type="text"
              required
              autoFocus
              value={folderName}
              onChange={e => {
                setFolderName(e.target.value);
                setError('');
              }}
              placeholder="Ex: Halloween, Mobilier d'art..."
              className="w-full px-3 py-2 bg-white dark:bg-[#291f18] text-stone-900 dark:text-[#faf6f0] border border-stone-300 dark:border-[#4d3b2d] rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-sm font-medium"
            />
            {error && <p className="text-red-600 dark:text-red-400 text-[11px] mt-1">{error}</p>}
          </div>

          {suggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1.5">
                Idées de thèmes / dossiers :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 6).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setFolderName(s);
                      setError('');
                    }}
                    className="px-2 py-0.5 rounded bg-stone-100 dark:bg-[#2d221b] hover:bg-[#f0e8dd] dark:hover:bg-[#3d2e22] text-stone-700 dark:text-[#e0d3c5] hover:text-[#5c3e21] dark:hover:text-[#faf6f0] border border-stone-200 dark:border-[#4a392c] text-[10.5px] transition-colors cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 dark:border-[#382b21] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-stone-600 dark:text-[#dfd4c7] hover:bg-stone-100 dark:hover:bg-[#2e231b] rounded border border-stone-200 dark:border-[#4d3b2d] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-[#8c6239] hover:bg-[#734f2d] rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Créer le dossier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
