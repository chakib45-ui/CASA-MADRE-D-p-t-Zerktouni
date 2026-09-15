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
        className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-[#e2d9ce] animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#e2d9ce] flex justify-between items-center bg-[#faf7f2]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#8c6239] text-white flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-cinzel text-sm font-bold text-[#5c3e21]">
                Créer un nouveau dossier
              </h2>
              <p className="text-[10.5px] text-[#6e6259]">
                Organisez vos articles par thèmes ou départements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">
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
              className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-sm font-medium"
            />
            {error && <p className="text-red-600 text-[11px] mt-1">{error}</p>}
          </div>

          {suggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-medium text-stone-500 mb-1.5">
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
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-[#f0e8dd] text-stone-700 hover:text-[#5c3e21] border border-stone-200 text-[10.5px] transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded border border-stone-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-[#8c6239] hover:bg-[#734f2d] rounded shadow-xs flex items-center gap-1.5"
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
