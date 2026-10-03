import fs from 'fs';
import { execSync } from 'child_process';

const zipCatalogStr = execSync('unzip -p public/casamadre-project.zip src/data/defaultCatalog.ts').toString();
const origArticlesMatch = zipCatalogStr.match(/export const INITIAL_ARTICLES: ArticleItem\[\] = (\[[\s\S]*?\]);\s*$/);
if (!origArticlesMatch) {
  console.error("Could not find INITIAL_ARTICLES in zip");
  process.exit(1);
}

const currentCatalogStr = fs.readFileSync('src/data/defaultCatalog.ts', 'utf8');
const currentArticlesMatch = currentCatalogStr.match(/export const INITIAL_ARTICLES: ArticleItem\[\] = (\[[\s\S]*?\]);\s*$/);
if (!currentArticlesMatch) {
  console.error("Could not find INITIAL_ARTICLES in current defaultCatalog");
  process.exit(1);
}

const evalOrig = new Function(`return ${origArticlesMatch[1]}`)();
const evalCurrent = new Function(`return ${currentArticlesMatch[1]}`)();

// Map by normalized name or id
const map = new Map();

// First, add the 68 items from the PDF
for (const art of evalCurrent) {
  let id = art.id;
  if (id === 'art-antiq-01') id = 'art-vhs-01';
  if (id === 'art-antiq-02') id = 'art-vinyl-01';
  map.set(id, {
    ...art,
    id,
    folder: 'Antiquités'
  });
}

// Then add the 38 original items from the base file
let addedFromOriginal = 0;
for (const art of evalOrig) {
  if (art.id === 'art-vhs-01' || art.id === 'art-vinyl-01') {
    // Already present from PDF
    continue;
  }
  if (!map.has(art.id)) {
    map.set(art.id, {
      ...art,
      folder: art.folder || 'Antiquités'
    });
    addedFromOriginal++;
  }
}

console.log(`Added ${addedFromOriginal} original articles from base file.`);
const finalCombinedList = Array.from(map.values());
console.log(`Total unique combined articles: ${finalCombinedList.length}`);

const headerCode = `import { ArticleItem, ColorTheme, CatalogConfig } from '../types';

export const THEMES: Record<string, ColorTheme> = {
  clair: {
    id: 'clair',
    name: 'Thème Clair',
    bgColor: '#FFFFFF',
    cardBg: '#FAFAF8',
    textColor: '#1E1915',
    mutedTextColor: '#635950',
    accentColor: '#8C6239',
    borderColor: '#E2DBD0',
    headerAccent: '#2C221B',
    badgeBg: '#F3EDE4',
    badgeText: '#4A331E',
  },
  fonce: {
    id: 'fonce',
    name: 'Thème Foncé',
    bgColor: '#171412',
    cardBg: '#211C18',
    textColor: '#F5F2ED',
    mutedTextColor: '#A89E94',
    accentColor: '#D4A373',
    borderColor: '#383028',
    headerAccent: '#FAF6F0',
    badgeBg: '#2E2620',
    badgeText: '#F0DEC8',
  },
  sepia: {
    id: 'clair',
    name: 'Thème Clair',
    bgColor: '#FFFFFF',
    cardBg: '#FAFAF8',
    textColor: '#1E1915',
    mutedTextColor: '#635950',
    accentColor: '#8C6239',
    borderColor: '#E2DBD0',
    headerAccent: '#2C221B',
    badgeBg: '#F3EDE4',
    badgeText: '#4A331E',
  },
};

export const COLOR_THEMES = THEMES;

export const DEFAULT_CONFIG: CatalogConfig = {
  mainTitle: 'CASA MADRE',
  subtitle: 'Dépôt Antiquités',
  collection: '',
  activeFolder: 'Antiquités',
  folders: ['Antiquités', 'Halloween'],
  contactInfo: '',
  dateStr: 'SEPTEMBRE 2026',
  catalogRef: 'INV-2025/01',
  layoutMode: '2-per-page',
  themeId: 'clair',
  showPrices: false,
  showDimensions: false,
  showReference: false,
  headerEveryPage: true,
  notesFooter: "Expertise & authenticité garanties • Visites sur rendez-vous à l'atelier",
  cleanScanEffect: true,
  uiDarkMode: false,
};

export const INITIAL_ARTICLES: ArticleItem[] = ${JSON.stringify(finalCombinedList, null, 2)};
`;

fs.writeFileSync('src/data/defaultCatalog.ts', headerCode);
console.log('Successfully wrote unified catalog to src/data/defaultCatalog.ts');
