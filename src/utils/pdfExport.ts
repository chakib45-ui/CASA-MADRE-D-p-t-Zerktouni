import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { ArticleItem, CatalogConfig, ColorTheme } from '../types';

export interface ExportProgressCallback {
  (currentPage: number, totalPages: number, status: string): void;
}

export async function exportCatalogToPDF(
  pageContainerId: string = 'catalog-print-area',
  filename: string = 'CASA-MADRE-Depot-Antiquites-Catalogue.pdf',
  onProgress?: ExportProgressCallback
): Promise<void> {
  const container = document.getElementById(pageContainerId);
  if (!container) {
    throw new Error('Conteneur de pages introuvable.');
  }

  // Find all printable pages
  const pageElements = container.querySelectorAll<HTMLElement>('.print-page');
  if (pageElements.length === 0) {
    throw new Error('Aucune page à exporter.');
  }

  const totalPages = pageElements.length;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < totalPages; i++) {
    const pageEl = pageElements[i];

    if (onProgress) {
      onProgress(i + 1, totalPages, `Rendu haute définition de la page ${i + 1} sur ${totalPages}...`);
    }

    // Determine correct background color from the page or default
    const bgColor = window.getComputedStyle(pageEl).backgroundColor || '#ffffff';

    // Capture using html2canvas-pro with full support for oklch, modern CSS and crisp DPI
    const canvas = await html2canvas(pageEl, {
      scale: 2, // 2x DPI for crisp print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      logging: false,
      windowWidth: 1200,
      imageTimeout: 15000,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // Exact A4 dimensions in mm: 210 x 297
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress(totalPages, totalPages, 'Finalisation et téléchargement du PDF...');
  }

  pdf.save(filename);
}

export function printCatalogViaBrowser(): void {
  try {
    window.print();
  } catch (err) {
    console.error('Erreur lors du déclenchement de window.print()', err);
  }
}

/**
 * Opens a dedicated standalone printable window containing only the A4 catalog pages.
 * This completely bypasses iframe sandboxing or parent scroll/overflow limits.
 */
export function openPrintWindow(
  articles: ArticleItem[],
  config: CatalogConfig,
  theme: ColorTheme,
  singlePageNumber?: number
): void {
  const container = document.getElementById('catalog-print-area');
  if (!container) {
    printCatalogViaBrowser();
    return;
  }

  const allPages = Array.from(container.querySelectorAll<HTMLElement>('.print-page'));
  if (allPages.length === 0) {
    printCatalogViaBrowser();
    return;
  }

  const pagesToPrint = singlePageNumber
    ? [allPages[singlePageNumber - 1] || allPages[0]]
    : allPages;

  // Clone each page's outerHTML
  const pagesHtml = pagesToPrint.map((p) => p.outerHTML).join('\n');

  // Collect all styles from current document
  const styleSheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  const printWindow = window.open('', '_blank', 'width=950,height=1050');
  if (!printWindow) {
    // If popup blocker intervened, fallback to native print
    printCatalogViaBrowser();
    return;
  }

  const printDocumentHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>CASA MADRE — Impression Catalogue A4</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  ${styleSheets}
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f0eee9;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-bar {
      position: sticky;
      top: 0;
      width: 100%;
      background: #2a221d;
      color: #faf6f0;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .print-btn {
      background: #8c6239;
      color: #fff;
      border: 1px solid #a87f54;
      padding: 8px 20px;
      font-weight: 600;
      font-size: 14px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn:hover {
      background: #a07142;
    }
    .page-wrapper {
      margin: 20px auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    @media print {
      body {
        background: transparent !important;
      }
      .print-bar {
        display: none !important;
      }
      .page-wrapper {
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .print-page {
        margin: 0 !important;
        box-shadow: none !important;
        width: 210mm !important;
        height: 297mm !important;
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <strong style="font-family: 'Cinzel', serif; font-size: 16px;">CASA MADRE — Catalogue A4</strong>
      <span style="opacity: 0.8; font-size: 12px; margin-left: 12px;">${pagesToPrint.length} page(s) prête(s) pour l'imprimante</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="print-btn" onclick="window.print()">
        🖨️ Imprimer cette page (Ctrl+P)
      </button>
      <button onclick="window.close()" style="background: #3e332c; color: #d0c4b6; border: 1px solid #55463c; padding: 8px 14px; border-radius: 4px; cursor: pointer;">
        Fermer
      </button>
    </div>
  </div>

  ${pagesToPrint.map((p) => `<div class="page-wrapper">${p.outerHTML}</div>`).join('\n')}

  <script>
    // Automatically open print dialog once fonts/images are ready
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(printDocumentHtml);
  printWindow.document.close();
}
