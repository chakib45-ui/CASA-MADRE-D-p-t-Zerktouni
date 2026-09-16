import React from 'react';
import { X, Check } from 'lucide-react';
import { CatalogConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';

interface HeaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: CatalogConfig;
  onSave: (newConfig: CatalogConfig) => void;
}

export const HeaderSettingsModal: React.FC<HeaderSettingsModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_CONFIG,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<CatalogConfig>(config || DEFAULT_CONFIG);

  React.useEffect(() => {
    if (config) {
      setFormData({
        ...DEFAULT_CONFIG,
        ...config,
      });
    }
  }, [config]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div
        className="bg-white dark:bg-[#1e1712] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-[#e2d9ce] dark:border-[#3d2f24] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#e2d9ce] dark:border-[#382b21] flex justify-between items-center bg-[#faf7f2] dark:bg-[#261d17]">
          <div>
            <h2 className="font-cinzel text-base font-bold text-[#5c3e21] dark:text-[#f3dfcc]">
              Personnaliser l'en-tête & mentions
            </h2>
            <p className="text-xs text-[#6e6259] dark:text-[#a8988a]">
              Configuration générale du document A4
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1">
              Titre principal :
            </label>
            <input
              type="text"
              required
              value={formData.mainTitle}
              onChange={e => setFormData({ ...formData, mainTitle: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-[#291f18] border border-stone-300 dark:border-[#4d3b2d] rounded font-cinzel font-bold text-sm text-[#5c3e21] dark:text-[#f3dfcc]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1">
              Sous-titre / Section :
            </label>
            <input
              type="text"
              required
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Ex: Dépôt Zerktouni"
              className="w-full px-3 py-1.5 bg-white dark:bg-[#291f18] border border-stone-300 dark:border-[#4d3b2d] rounded font-garamond italic text-sm text-stone-800 dark:text-[#faf6f0]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1">
              Thème / Collection :
            </label>
            <input
              type="text"
              value={formData.collection || ''}
              onChange={e => setFormData({ ...formData, collection: e.target.value })}
              placeholder="Ex: Halloween"
              className="w-full px-3 py-1.5 border border-[#8c6239] dark:border-[#a87d4f] rounded font-medium text-sm text-[#8c6239] dark:text-[#f3dfcc] bg-[#faf7f2] dark:bg-[#2c2119]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1">
                Date du document :
              </label>
              <input
                type="text"
                value={formData.dateStr}
                onChange={e => setFormData({ ...formData, dateStr: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-[#291f18] text-stone-800 dark:text-[#faf6f0] border border-stone-300 dark:border-[#4d3b2d] rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1">
                Numéro / Réf Inventaire :
              </label>
              <input
                type="text"
                value={formData.catalogRef}
                onChange={e => setFormData({ ...formData, catalogRef: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-[#291f18] text-stone-800 dark:text-[#faf6f0] border border-stone-300 dark:border-[#4d3b2d] rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1">
              Coordonnées / Adresse (optionnel) :
            </label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="Laisser vide si non requis"
              className="w-full px-3 py-1.5 bg-white dark:bg-[#291f18] text-stone-800 dark:text-[#faf6f0] border border-stone-300 dark:border-[#4d3b2d] rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-[#dfd4c7] mb-1">
              Mention de bas de page :
            </label>
            <input
              type="text"
              value={formData.notesFooter}
              onChange={e => setFormData({ ...formData, notesFooter: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-[#291f18] text-stone-800 dark:text-[#faf6f0] border border-stone-300 dark:border-[#4d3b2d] rounded font-garamond italic"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-[#382b21] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-stone-600 dark:text-[#dfd4c7] hover:bg-stone-100 dark:hover:bg-[#2e231b] rounded border border-stone-200 dark:border-[#4d3b2d] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8c6239] hover:bg-[#734f2d] rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Appliquer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
