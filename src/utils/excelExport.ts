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
      'Aperçu / Photo': 'ÉTABLISSEMENT',
      'Nom de l\'article': `${safeConfig.mainTitle || 'CASA MADRE'} — ${safeConfig.subtitle || 'Dépôt Zerktouni'}`,
      'Dossier': folderTitle,
      'Quantité': `Date: ${safeConfig.dateStr || new Date().toLocaleDateString('fr-FR')}`,
      'Catégorie': `Thème: ${safeConfig.collection || 'Halloween'}`,
      'Remarques': '',
    },
    {
      'N°': '',
      'Aperçu / Photo': '',
      'Nom de l\'article': '',
      'Dossier': '',
      'Quantité': '',
      'Catégorie': '',
      'Remarques': '',
    },
    ...articles.map((art, idx) => ({
      'N°': idx + 1,
      'Aperçu / Photo': art.imageUrl ? 'Photo HD incluse' : 'Aucune photo',
      'Nom de l\'article': art.name,
      'Dossier': art.folder || 'Antiquités',
      'Quantité': art.quantity || '1',
      'Catégorie': art.category || 'Antiquités',
      'Remarques': [art.periodOrStyle, art.material, art.notes].filter(Boolean).join(' • '),
    })),
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column formatting
  worksheet['!cols'] = [
    { wch: 6 },   // N°
    { wch: 20 },  // Aperçu / Photo
    { wch: 45 },  // Nom de l'article
    { wch: 22 },  // Dossier
    { wch: 14 },  // Quantité
    { wch: 26 },  // Catégorie
    { wch: 35 },  // Remarques
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
