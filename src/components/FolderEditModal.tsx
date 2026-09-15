import React, { useState, useEffect } from 'react';
import { X, FolderCog, Check, Trash2, AlertTriangle } from 'lucide-react';

interface FolderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  articleCount: number;
  existingFolders: string[];
  onRenameFolder: (oldName: string, newName: string) => void;
  onDeleteFolder?: (folderNameToDelete: string) => void;
}

export const FolderEditModal: React.FC<FolderEditModalProps> = ({
  isOpen,
  onClose,
  folderName,
  articleCount,
  existingFolders,
  onRenameFolder,
  onDeleteFolder,
}) => {
  const [name, setName] = useState(folderName);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(folderName);
    setError('');
  }, [folderName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Veuillez saisir un nom');
      return;
    }
    if (trimmed !== folderName && existingFolders.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ce nom de dossier existe déjà');
      return;
    }

    onRenameFolder(folderName, trimmed);
    onClose();
  };

  const isProtectedFolder = folderName.toLowerCase() === 'antiquités';

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
              <FolderCog className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-cinzel text-sm font-bold text-[#5c3e21]">
                Modifier le dossier
              </h2>
              <p className="text-[10.5px] text-[#6e6259]">
                Renommer ou réorganiser le dossier actif ({articleCount} article{articleCount > 1 ? 's' : ''})
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
              Nom actuel du dossier :
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-sm font-medium"
            />
            {error && <p className="text-red-600 text-[11px] mt-1">{error}</p>}
          </div>

          <div className="bg-[#faf7f2] border border-[#e2d9ce] rounded p-3 text-[11.5px] text-[#5c3e21]">
            <p className="font-medium">
              📁 Contenu : <span className="font-bold">{articleCount} article(s)</span> associés à ce dossier.
            </p>
            <p className="text-stone-500 text-[10.5px] mt-0.5">
              En renommant ce dossier, tous les articles qu'il contient seront automatiquement mis à jour.
            </p>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
            {onDeleteFolder && !isProtectedFolder && existingFolders.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Supprimer le dossier "${folderName}" ? Les ${articleCount} article(s) qu'il contient seront transférés vers le dossier "Antiquités".`)) {
                    onDeleteFolder(folderName);
                    onClose();
                  }
                }}
                className="px-2.5 py-1.5 text-[11px] text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center gap-1 transition-colors"
                title="Supprimer ce dossier et transférer ses articles vers Antiquités"
              >
                <Trash2 className="w-3 h-3" />
                <span>Supprimer le dossier</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
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
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
