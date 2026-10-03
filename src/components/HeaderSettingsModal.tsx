import React, { useState, useRef } from 'react';
import { 
  X, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Database, 
  Download, 
  Upload, 
  Laptop, 
  AlertCircle 
} from 'lucide-react';
import { CatalogConfig, ArticleItem } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';
import { exportDatabaseBackup, importDatabaseBackup } from '../utils/storage';
import { playSuccessSound, playAlertNotificationSound } from '../utils/audioFeedback';

interface HeaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: CatalogConfig;
  onSave: (newConfig: CatalogConfig) => void;
  onRepairLibrary?: () => Promise<{ restoredCount: number; info: string }>;
  articles?: ArticleItem[];
  onImportBackup?: (articles: ArticleItem[], config?: CatalogConfig) => void;
}

export const HeaderSettingsModal: React.FC<HeaderSettingsModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_CONFIG,
  onSave,
  onRepairLibrary,
  articles = [],
  onImportBackup,
}) => {
  const [formData, setFormData] = React.useState<CatalogConfig>(config || DEFAULT_CONFIG);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleRepair = async () => {
    if (!onRepairLibrary) return;
    try {
      setIsRepairing(true);
      setRepairStatus(null);
      const res = await onRepairLibrary();
      playSuccessSound();
      setRepairStatus(`Succès : ${res.restoredCount} article(s) synchronisés et restaurés.`);
    } catch (err) {
      console.error(err);
      playAlertNotificationSound();
      setRepairStatus('Erreur lors de la réparation de la bibliothèque.');
    } finally {
      setIsRepairing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      exportDatabaseBackup(articles, formData);
      playSuccessSound();
      setRepairStatus(`Fichier de sauvegarde téléchargé (${articles.length} articles sauvegardés).`);
    } catch (err: any) {
      console.error('Erreur export backup:', err);
      playAlertNotificationSound();
      setRepairStatus("Erreur lors de l'exportation du fichier de sauvegarde.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError(null);
      setImportStatus(null);
      const result = await importDatabaseBackup(file);
      playSuccessSound();
      setImportStatus(result.message);
      if (onImportBackup) {
        onImportBackup(result.articles, result.config);
      }
      if (result.config) {
        setFormData(result.config);
        onSave(result.config);
      }
    } catch (err: any) {
      console.error('Erreur import backup:', err);
      playAlertNotificationSound();
      setImportError(err?.message || "Impossible d'importer le fichier de sauvegarde.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print select-none">
      <div
        className="bg-white dark:bg-[#1e1712] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-[#e2d9ce] dark:border-[#3d2f24] transition-colors max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#e2d9ce] dark:border-[#382b21] flex justify-between items-center bg-[#faf7f2] dark:bg-[#261d17]">
          <div>
            <h2 className="font-cinzel text-base font-bold text-[#5c3e21] dark:text-[#f3dfcc]">
              Personnaliser l'en-tête & mentions
            </h2>
            <p className="text-xs text-[#6e6259] dark:text-[#a8988a]">
              Configuration générale et sauvegarde pour transfert machine
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
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

          {/* Section Sauvegarde & Transfert sur Nouvelle Machine */}
          <div className="p-3.5 bg-[#fbf9f6] dark:bg-[#271e18] border border-[#e2d9ce] dark:border-[#453426] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#8c6239] dark:text-[#d4a373]" />
                <span className="font-semibold text-xs text-stone-800 dark:text-[#f0dfcc]">
                  Transfert vers Nouvelle Machine & Sauvegarde
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                {articles.length} article(s)
              </span>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-[#a8988a] leading-relaxed">
              Pour transférer facilement le catalogue complet sur un nouvel ordinateur, téléchargez le fichier de sauvegarde puis importez-le sur la nouvelle machine :
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-2 text-xs font-semibold text-white bg-[#8c6239] hover:bg-[#734f2d] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter Sauvegarde (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-3 py-2 text-xs font-semibold text-[#5c3e21] dark:text-[#f3dfcc] bg-white dark:bg-[#34271f] hover:bg-stone-50 dark:hover:bg-[#403026] border border-[#8c6239]/60 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-[#8c6239] dark:text-[#d4a373]" />
                <span>{isImporting ? 'Import en cours...' : 'Importer sur ce poste'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {importStatus && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            {importError && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          {/* Section Réparation & Synchronisation de la bibliothèque */}
          {onRepairLibrary && (
            <div className="p-3 bg-[#faf7f2] dark:bg-[#271e18] border border-[#e2d9ce] dark:border-[#453426] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#8c6239] dark:text-[#d4a373]" />
                  <span className="font-semibold text-xs text-stone-800 dark:text-[#f0dfcc]">
                    Maintenance locale (IndexedDB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRepair}
                  disabled={isRepairing}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#5c3e21] hover:bg-[#432d18] disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                  <span>{isRepairing ? 'Synchronisation...' : 'Réparer la bibliothèque'}</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-[#a8988a] leading-relaxed">
                Force la réconciliation entre mémoire vive et IndexedDB, restaure les éléments orphelins et répare les dossiers.
              </p>
              {repairStatus && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{repairStatus}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 dark:border-[#382b21] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-stone-600 dark:text-[#dfd4c7] hover:bg-stone-100 dark:hover:bg-[#2e231b] rounded-lg border border-stone-200 dark:border-[#4d3b2d] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8c6239] hover:bg-[#734f2d] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
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
