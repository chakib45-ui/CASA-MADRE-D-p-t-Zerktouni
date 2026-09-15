import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Trash2, HelpCircle, Loader2, Download } from 'lucide-react';
import { ArticleItem } from '../types';
import { optimizeImageFile, downloadImageFile, isImageFile } from '../utils/imageOptimizer';

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ArticleItem | null;
  onSave: (updatedArticle: ArticleItem) => void;
  onDelete?: (id: string) => void;
  availableFolders?: string[];
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  onClose,
  article,
  onSave,
  onDelete,
  availableFolders = ['Antiquités', 'Halloween'],
}) => {
  const [formData, setFormData] = useState<ArticleItem>({
    id: '',
    ref: '',
    name: '',
    imageUrl: '',
    folder: 'Antiquités',
    category: '',
    material: '',
    periodOrStyle: '',
    condition: '',
    dimensions: '',
    quantity: '1 unit.',
    price: '',
    notes: '',
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (article) {
      setFormData(article);
    }
  }, [article]);

  if (!isOpen || !article) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessingImage(true);
      try {
        const optimized = await optimizeImageFile(file, 1400, 0.85);
        setFormData(prev => ({ ...prev, imageUrl: optimized }));
      } catch (err) {
        console.error('Erreur traitement image', err);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleQuickQuantity = (qty: string) => {
    setFormData(prev => ({ ...prev, quantity: qty }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#e2d9ce]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[#e2d9ce] flex justify-between items-center bg-[#faf7f2]">
          <div>
            <h2 className="font-cinzel text-base font-bold text-[#5c3e21]">
              Modifier la fiche article
            </h2>
            <p className="text-[11px] text-[#6e6259]">
              Réf : {formData.ref || 'Non définie'} — Style Antiquités / Brocante
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Photo preview + change */}
          <div className="flex gap-4 items-start p-3 bg-stone-50 border border-stone-200 rounded">
            <div className="w-28 h-28 rounded border border-stone-300 overflow-hidden bg-stone-200 flex-shrink-0 relative group">
              {isProcessingImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-600 gap-1 text-[10px]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#8c6239]" />
                  <span>Optimisation...</span>
                </div>
              ) : formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  Pas d'image
                </div>
              )}
              {!isProcessingImage && (
                <label
                  htmlFor="photo-replace-input"
                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] cursor-pointer transition-opacity"
                >
                  <Upload className="w-4 h-4 mb-1" />
                  Changer la photo
                </label>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Photo de l'article :
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="photo-replace-input"
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.jfif,.avif,.bmp"
                    onChange={handleImageFileChange}
                    className="text-xs text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#f0e8dd] file:text-[#5c3e21] hover:file:bg-[#e6dbce] cursor-pointer"
                  />
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => downloadImageFile(formData.imageUrl, `${formData.name || 'article'}.jpg`)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 rounded text-xs flex items-center gap-1.5 transition-colors"
                      title="Enregistrer / Télécharger la photo sur votre ordinateur"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8c6239]" />
                      <span>Télécharger photo</span>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-600 mb-0.5">
                  Ou URL d'image web :
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded focus:outline-none focus:border-[#8c6239]"
                />
              </div>
            </div>
          </div>

          {/* Item Name & Ref */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Nom du meuble / objet d'art * :
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Commode sauteuse Louis XV en noyer"
                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239] font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Référence :
              </label>
              <input
                type="text"
                value={formData.ref}
                onChange={e => setFormData({ ...formData, ref: e.target.value })}
                placeholder="CM-0101"
                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239] font-mono"
              />
            </div>
          </div>

          {/* Quantité & Catégorie */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#faf7f2] border border-[#e2d9ce] rounded">
            <div>
              <label className="block font-bold text-[#5c3e21] mb-1">
                Quantité disponible * :
              </label>
              <input
                type="text"
                required
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Ex: 1 unit. / Lot de 4 / Paire"
                className="w-full px-3 py-1.5 border border-[#c4a482] rounded bg-white font-semibold text-[#5c3e21] focus:outline-none focus:ring-1 focus:ring-[#8c6239]"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['1 unit.', 'Paire (2 unit.)', 'Lot de 3', 'Lot de 4', 'Lot de 6', '1 pièce'].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickQuantity(q)}
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      formData.quantity === q
                        ? 'bg-[#8c6239] text-white border-[#8c6239]'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Dossier de classement :
              </label>
              <select
                value={formData.folder || 'Antiquités'}
                onChange={e => setFormData({ ...formData, folder: e.target.value })}
                className="w-full px-3 py-1.5 border border-[#c4a482] rounded bg-white font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8c6239] cursor-pointer"
              >
                {availableFolders.map(f => (
                  <option key={f} value={f}>
                    📂 Dossier « {f} »
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-stone-500 mt-1">
                Permet de déplacer cet article vers un autre dossier.
              </p>
            </div>
          </div>

          {/* Matière, Époque/Style, État */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Époque ou Style :
              </label>
              <input
                type="text"
                value={formData.periodOrStyle}
                onChange={e => setFormData({ ...formData, periodOrStyle: e.target.value })}
                placeholder="Ex: Époque Louis XV, XVIIIe siècle"
                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Matière(s) & finitions :
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={e => setFormData({ ...formData, material: e.target.value })}
                placeholder="Ex: Noyer massif sculpté, bronzes dorés"
                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                État de conservation :
              </label>
              <input
                type="text"
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                placeholder="Ex: Superbe patine d'origine, usures d'usage"
                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Dimensions :
              </label>
              <input
                type="text"
                value={formData.dimensions || ''}
                onChange={e => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="Ex: H: 86 cm × L: 124 cm × P: 62 cm"
                className="w-full px-3 py-1.5 border border-stone-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#8c6239]"
              />
            </div>
          </div>

          {/* Prix / Estimation (Optionnel) & Remarques */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Prix / Estimation (optionnel) :
              </label>
              <input
                type="text"
                value={formData.price || ''}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="Ex: 1 850 €"
                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239]"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Remarques / Historique / Détails :
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Ouvrant par 3 tiroirs, serrures d'origine..."
                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#8c6239]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Supprimer définitivement l'article "${formData.name}" ?`)) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer l'article
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded border border-stone-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8c6239] hover:bg-[#734f2d] rounded shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Enregistrer la fiche
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
