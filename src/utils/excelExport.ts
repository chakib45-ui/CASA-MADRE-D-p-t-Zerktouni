import * as XLSX from 'xlsx';
import { ArticleItem, CatalogConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultCatalog';

export function exportCatalogToExcel(
  articles: ArticleItem[], 
  config?: CatalogConfig,
  folderScopeName?: string
): void {
  const safeConfig = config || DEFAULT_CONFIG;
  const folderTitle = folderScopeName && folderScopeName !== 'all' ? `Dossier: ${folderScopeName}` : 'Inventaire Global';

  // Title & header rows
  const rows = [
    {
      'N°': '',
      'Référence': 'ÉTABLISSEMENT',
      'Nom de l\'article': `${safeConfig.mainTitle || 'CASA MADRE'} — ${safeConfig.subtitle || 'Dépôt Zerktouni'}`,
      'Dossier': folderTitle,
      'Quantité': `Date: ${safeConfig.dateStr || new Date().toLocaleDateString('fr-FR')}`,
      'Catégorie': 'Inventaire Stock Dépôt',
      'Dimensions': '',
      'État / Condition': '',
      'Époque & Style': '',
      'Matériaux': '',
      'Prix': '',
      'Photo HD': '',
      'Notes & Remarques': '',
    },
    {
      'N°': '',
      'Référence': '',
      'Nom de l\'article': '',
      'Dossier': '',
      'Quantité': '',
      'Catégorie': '',
      'Dimensions': '',
      'État / Condition': '',
      'Époque & Style': '',
      'Matériaux': '',
      'Prix': '',
      'Photo HD': '',
      'Notes & Remarques': '',
    },
    ...articles.map((art, idx) => ({
      'N°': idx + 1,
      'Référence': art.ref || `CM-${String(idx + 1).padStart(4, '0')}`,
      'Nom de l\'article': art.name,
      'Dossier': art.folder || 'Antiquités',
      'Quantité': art.quantity || '1',
      'Catégorie': art.category || 'Antiquités',
      'Dimensions': art.dimensions || '',
      'État / Condition': art.condition || '',
      'Époque & Style': art.periodOrStyle || '',
      'Matériaux': art.material || '',
      'Prix': art.price || '',
      'Photo HD': art.imageUrl ? 'Oui' : 'Non',
      'Notes & Remarques': art.notes || '',
    })),
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column formatting
  worksheet['!cols'] = [
    { wch: 6 },   // N°
    { wch: 14 },  // Référence
    { wch: 45 },  // Nom de l'article
    { wch: 18 },  // Dossier
    { wch: 12 },  // Quantité
    { wch: 24 },  // Catégorie
    { wch: 25 },  // Dimensions
    { wch: 30 },  // État / Condition
    { wch: 30 },  // Époque & Style
    { wch: 30 },  // Matériaux
    { wch: 14 },  // Prix
    { wch: 10 },  // Photo HD
    { wch: 45 },  // Notes & Remarques
  ];

  const workbook = XLSX.utils.book_new();
  const sheetName = folderScopeName && folderScopeName !== 'all' 
    ? folderScopeName.slice(0, 31).replace(/[:\/\\?*\[\]]/g, '_')
    : 'Stock CASA MADRE';
    
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const cleanTitle = (safeConfig.mainTitle || 'CASA_MADRE').replace(/\s+/g, '_');
  const cleanSub = (safeConfig.subtitle || 'Depot_Zerktouni').replace(/\s+/g, '_');
  const scopeSuffix = folderScopeName && folderScopeName !== 'all' ? `_${folderScopeName.replace(/\s+/g, '_')}` : '_Global';
  const fileName = `${cleanTitle}_${cleanSub}${scopeSuffix}_Stock.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
