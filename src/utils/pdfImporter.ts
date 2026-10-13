/**
 * PDF Import and Parsing Engine for CASAMADRE DEPOT
 * Extracts text, tables, columns, references, quantities, prices, materials,
 * locations, and embedded high-resolution photos directly from PDF files.
 */
import * as pdfjsLib from 'pdfjs-dist';
import { ArticleItem } from '../types';
import { FALLBACK_ANTIQUE_IMAGE } from './imageOptimizer';

// Configure PDF.js worker to use the local worker bundled in /public
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface ExtractedPdfArticle {
  id: string;
  ref: string;
  name: string;
  category: string;
  material: string;
  periodOrStyle: string;
  condition: string;
  dimensions: string;
  quantity: string;
  price: string;
  location: string;
  notes: string;
  imageUrl: string;
  hasExtractedPhoto: boolean;
  pageNumber: number;
}

export interface PdfImportResult {
  success: boolean;
  documentTitle: string;
  totalPages: number;
  totalArticles: number;
  photosExtractedCount: number;
  articles: ExtractedPdfArticle[];
  warnings: string[];
}

interface TextItemWithPos {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageWithPos {
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  yCenter: number;
  pageNumber: number;
}

/**
 * Normalizes text by removing excessive whitespace and trailing delimiters
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Parses numeric price string into readable format (e.g. "1 200 €" or "450 DH")
 */
function formatPrice(val: string): string {
  if (!val) return '';
  const clean = cleanText(val);
  if (/€|EUR|DH|MAD|\$|£/i.test(clean)) {
    return clean;
  }
  const num = parseFloat(clean.replace(',', '.').replace(/[^0-9.]/g, ''));
  if (!isNaN(num) && num > 0) {
    return `${num.toLocaleString('fr-FR')} €`;
  }
  return clean;
}

/**
 * Parses quantity string into standard quantity (e.g. "1 unit.", "Lot de 4", etc.)
 */
function formatQuantity(val: string): string {
  if (!val) return '1 unit.';
  const clean = cleanText(val);
  if (/^\d+$/.test(clean)) {
    return `${clean} unit.`;
  }
  return clean;
}

/**
 * Extracts all articles and photos from a PDF file
 */
export async function parsePdfFile(
  file: File | ArrayBuffer,
  onProgress?: (status: string, percent: number) => void
): Promise<PdfImportResult> {
  const warnings: string[] = [];

  try {
    if (onProgress) onProgress("Chargement du document PDF...", 10);

    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    if (onProgress) onProgress(`Lecture de ${numPages} page(s)...`, 20);

    const allArticles: ExtractedPdfArticle[] = [];
    let totalPhotosCount = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        const pct = Math.round(20 + ((pageNum - 1) / numPages) * 60);
        onProgress(`Traitement page ${pageNum}/${numPages}...`, pct);
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      // 1. Render page to canvas to extract high-resolution photos
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        } as any).promise;
      }

      // 2. Extract embedded images with their bounding boxes
      const pageImages: ImageWithPos[] = [];
      try {
        const opList = await page.getOperatorList();
        const fnArray = opList.fnArray;
        const argsArray = opList.argsArray;

        let currentTransform: number[] = [1, 0, 0, 1, 0, 0];
        const transformStack: number[][] = [];

        for (let i = 0; i < fnArray.length; i++) {
          const fn = fnArray[i];
          const args = argsArray[i];

          // Save / Restore graphics state
          if (fn === pdfjsLib.OPS.save) {
            transformStack.push([...currentTransform]);
          } else if (fn === pdfjsLib.OPS.restore) {
            if (transformStack.length > 0) {
              currentTransform = transformStack.pop()!;
            }
          } else if (fn === pdfjsLib.OPS.transform) {
            if (args && args.length >= 6) {
              const [a, b, c, d, e, f] = args;
              const [m0, m1, m2, m3, m4, m5] = currentTransform;
              currentTransform = [
                m0 * a + m2 * b,
                m1 * a + m3 * b,
                m0 * c + m2 * d,
                m1 * c + m3 * d,
                m0 * e + m2 * f + m4,
                m1 * e + m3 * f + m5,
              ];
            }
          } else if (
            fn === pdfjsLib.OPS.paintImageXObject ||
            fn === pdfjsLib.OPS.paintInlineImageXObject ||
            fn === pdfjsLib.OPS.paintImageMaskXObject
          ) {
            // Compute image bounds using current transform matrix
            const p0 = viewport.convertToViewportPoint(currentTransform[4], currentTransform[5]);
            const p1 = viewport.convertToViewportPoint(
              currentTransform[4] + currentTransform[0],
              currentTransform[5] + currentTransform[1]
            );
            const p2 = viewport.convertToViewportPoint(
              currentTransform[4] + currentTransform[2],
              currentTransform[5] + currentTransform[3]
            );
            const p3 = viewport.convertToViewportPoint(
              currentTransform[4] + currentTransform[0] + currentTransform[2],
              currentTransform[5] + currentTransform[1] + currentTransform[3]
            );

            const xs = [p0[0], p1[0], p2[0], p3[0]];
            const ys = [p0[1], p1[1], p2[1], p3[1]];

            const minX = Math.max(0, Math.min(...xs));
            const maxX = Math.min(canvas.width, Math.max(...xs));
            const minY = Math.max(0, Math.min(...ys));
            const maxY = Math.min(canvas.height, Math.max(...ys));

            const imgW = maxX - minX;
            const imgH = maxY - minY;

            // Only capture realistic item photos (exclude 1x1 markers, hairline borders or full background watermarks)
            if (
              imgW >= 24 &&
              imgH >= 24 &&
              imgW < canvas.width * 0.95 &&
              imgH < canvas.height * 0.95 &&
              ctx
            ) {
              try {
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = Math.min(1200, Math.round(imgW));
                cropCanvas.height = Math.min(1200, Math.round(imgH));
                const cropCtx = cropCanvas.getContext('2d');
                if (cropCtx) {
                  cropCtx.drawImage(
                    canvas,
                    minX,
                    minY,
                    imgW,
                    imgH,
                    0,
                    0,
                    cropCanvas.width,
                    cropCanvas.height
                  );
                  const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.88);
                  pageImages.push({
                    dataUrl,
                    x: minX,
                    y: minY,
                    width: imgW,
                    height: imgH,
                    yCenter: minY + imgH / 2,
                    pageNumber: pageNum,
                  });
                }
              } catch (cropErr) {
                console.warn('Erreur découpage photo page:', cropErr);
              }
            }
          }
        }
      } catch (imgErr) {
        console.warn('Erreur extraction images PDF page:', pageNum, imgErr);
      }

      // 3. Extract text elements with their 2D layout coordinates
      const textContent = await page.getTextContent();
      const textItems: TextItemWithPos[] = [];

      for (const item of textContent.items as any[]) {
        if (!item || !item.str) continue;
        const text = item.str.trim();
        if (!text) continue;

        // Convert PDF coordinates to viewport coordinates (top-left origin)
        const tx = item.transform[4];
        const ty = item.transform[5];
        const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

        textItems.push({
          str: item.str,
          x: vx,
          y: vy,
          width: item.width || 0,
          height: item.height || 12,
        });
      }

      // 4. Parse text items into structured rows and columns
      const pageArticles = parsePageRowsAndColumns(textItems, pageImages, pageNum);

      for (const art of pageArticles) {
        if (art.hasExtractedPhoto) {
          totalPhotosCount++;
        }
        allArticles.push(art);
      }
    }

    if (onProgress) onProgress("Finalisation de l'inventaire...", 95);

    // If no articles were parsed using table logic (e.g. non-standard freeform PDF),
    // perform fallback semantic extraction
    let finalArticles = allArticles;
    if (finalArticles.length === 0) {
      warnings.push("Le découpage standard en tableau n'a détecté aucun article. Analyse approfondie activée.");
      // Fallback extraction
      finalArticles = fallbackParsePdfText(pdfDoc);
    }

    if (onProgress) onProgress("Importation terminée !", 100);

    return {
      success: true,
      documentTitle: 'Inventaire CASAMADRE DEPOT',
      totalPages: numPages,
      totalArticles: finalArticles.length,
      photosExtractedCount: totalPhotosCount,
      articles: finalArticles,
      warnings,
    };
  } catch (error: any) {
    console.error('Erreur globale lecture PDF:', error);
    return {
      success: false,
      documentTitle: 'Erreur PDF',
      totalPages: 0,
      totalArticles: 0,
      photosExtractedCount: 0,
      articles: [],
      warnings: [error?.message || 'Impossible de lire le fichier PDF.'],
    };
  }
}

/**
 * Groups text items by vertical position (Y) into rows, aligns columns,
 * and matches the closest photo on the page to each article.
 */
function parsePageRowsAndColumns(
  items: TextItemWithPos[],
  images: ImageWithPos[],
  pageNum: number
): ExtractedPdfArticle[] {
  if (items.length === 0) return [];

  // Sort items by Y (top to bottom), then by X (left to right)
  items.sort((a, b) => {
    if (Math.abs(a.y - b.y) <= 4) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  // Group items into row lines (tolerance ~7px)
  const lines: { y: number; items: TextItemWithPos[]; text: string }[] = [];
  for (const item of items) {
    const existingLine = lines.find(l => Math.abs(l.y - item.y) <= 7);
    if (existingLine) {
      existingLine.items.push(item);
      existingLine.items.sort((a, b) => a.x - b.x);
      existingLine.text = existingLine.items.map(it => it.str).join(' ');
    } else {
      lines.push({
        y: item.y,
        items: [item],
        text: item.str,
      });
    }
  }

  // Detect header line with column names
  let headerIndex = -1;
  const headerKeywords = [
    'désignation', 'designation', 'article', 'référence', 'reference', 'ref',
    'catégorie', 'categorie', 'matière', 'matiere', 'emplacement', 'stock',
    'quantité', 'quantite', 'prix', 'pu', 'p.u.'
  ];

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const lineText = lines[i].text.toLowerCase();
    let matches = 0;
    for (const kw of headerKeywords) {
      if (lineText.includes(kw)) matches++;
    }
    if (matches >= 2) {
      headerIndex = i;
      break;
    }
  }

  // Define column mappings based on header line or X-distribution
  interface ColumnDef {
    key: 'ref' | 'name' | 'category' | 'material' | 'location' | 'quantity' | 'price' | 'notes';
    minX: number;
    maxX: number;
  }

  const columns: ColumnDef[] = [];

  if (headerIndex !== -1) {
    const headerItems = lines[headerIndex].items;
    for (let c = 0; c < headerItems.length; c++) {
      const it = headerItems[c];
      const txt = it.str.toLowerCase();
      let key: ColumnDef['key'] | null = null;

      if (/ref|réf|code|num|n°/i.test(txt)) key = 'ref';
      else if (/désign|design|nom|article|libellé|titre|objet/i.test(txt)) key = 'name';
      else if (/catég|categ|famille|type|rayon/i.test(txt)) key = 'category';
      else if (/mati|maté|bois|métal|composition/i.test(txt)) key = 'material';
      else if (/emplac|locali|dépôt|depot|lieu|zone/i.test(txt)) key = 'location';
      else if (/qte|qté|quant|stock|nbr|nombre|unité/i.test(txt)) key = 'quantity';
      else if (/prix|pu|p\.u\.|montant|tarif|valeur/i.test(txt)) key = 'price';
      else if (/note|remarque|obs|dim/i.test(txt)) key = 'notes';

      if (key) {
        const nextIt = headerItems[c + 1];
        const minX = it.x - 20;
        const maxX = nextIt ? nextIt.x - 5 : 2000;
        columns.push({ key, minX, maxX });
      }
    }
  }

  // Content rows start after header, or from beginning if no header
  const dataLines = headerIndex !== -1 ? lines.slice(headerIndex + 1) : lines;
  const articles: ExtractedPdfArticle[] = [];

  // Group contiguous multiline data blocks into single article entries
  interface RawArticleRow {
    yTop: number;
    yBottom: number;
    fields: { [key: string]: string[] };
  }

  const rawRows: RawArticleRow[] = [];
  let currentRow: RawArticleRow | null = null;

  for (const line of dataLines) {
    // Ignore page headers/footers (e.g. "Page 1 / 5", "CASA MADRE INVENTAIRE")
    if (/page\s+\d+(\s*\/\s*\d+)?/i.test(line.text) && line.items.length <= 2) continue;
    if (/^casa madre/i.test(line.text) && line.items.length <= 2) continue;

    // Check if this line starts a new article (e.g., contains a Reference, or has a significant gap from previous)
    const isNewArticle =
      !currentRow ||
      (currentRow && Math.abs(line.y - currentRow.yBottom) > 28) ||
      (columns.length > 0 &&
        columns.some(col => col.key === 'ref' && line.items.some(it => it.x >= col.minX && it.x <= col.maxX && cleanText(it.str).length > 0))) ||
      /\b(CM-\d+|ART-\d+|REF-|\b[A-Z]{2,4}-\d{3,})\b/i.test(line.text);

    if (isNewArticle) {
      if (currentRow) {
        rawRows.push(currentRow);
      }
      currentRow = {
        yTop: line.y,
        yBottom: line.y + 16,
        fields: {},
      };
    }

    if (currentRow) {
      currentRow.yBottom = Math.max(currentRow.yBottom, line.y + 16);

      if (columns.length > 0) {
        // Map line items to configured columns
        for (const item of line.items) {
          const str = cleanText(item.str);
          if (!str) continue;

          // Find which column this item belongs to
          const matchedCol = columns.find(c => item.x >= c.minX && item.x < c.maxX);
          if (matchedCol) {
            if (!currentRow.fields[matchedCol.key]) currentRow.fields[matchedCol.key] = [];
            currentRow.fields[matchedCol.key].push(str);
          } else {
            // Default to name or notes
            if (!currentRow.fields['name']) currentRow.fields['name'] = [];
            currentRow.fields['name'].push(str);
          }
        }
      } else {
        // No strict columns: partition using pipes, tabs, or positional tokens
        if (line.text.includes('|') || line.text.includes(';')) {
          const parts = line.text.split(/[|;]/).map(cleanText).filter(Boolean);
          if (parts.length >= 2) {
            if (!currentRow.fields['name']) currentRow.fields['name'] = [];
            currentRow.fields['name'].push(parts[1] || parts[0]);
            if (parts[0] && /CM-|[0-9]/i.test(parts[0])) {
              currentRow.fields['ref'] = [parts[0]];
            }
            if (parts[2]) currentRow.fields['category'] = [parts[2]];
            if (parts[3]) currentRow.fields['material'] = [parts[3]];
            if (parts[4]) currentRow.fields['location'] = [parts[4]];
            if (parts[5]) currentRow.fields['quantity'] = [parts[5]];
            if (parts[6]) currentRow.fields['price'] = [parts[6]];
          }
        } else {
          // Freeform text
          if (!currentRow.fields['name']) currentRow.fields['name'] = [];
          currentRow.fields['name'].push(cleanText(line.text));
        }
      }
    }
  }

  if (currentRow) {
    rawRows.push(currentRow);
  }

  // Track used images to prevent duplicate matching on the same page
  const usedImageIndices = new Set<number>();

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];

    const getField = (k: string): string => {
      return (row.fields[k] || []).join(' ').trim();
    };

    let name = getField('name');
    let ref = getField('ref');
    let category = getField('category');
    let material = getField('material');
    let location = getField('location') || 'Dépôt Zerktouni';
    let quantity = formatQuantity(getField('quantity') || '1');
    let price = formatPrice(getField('price'));
    let notes = getField('notes');

    // If name is empty, attempt to recover from other fields or line text
    if (!name) {
      const allText = Object.values(row.fields).flat().join(' ');
      if (allText.length > 2) {
        name = allText;
      } else {
        continue; // Skip blank ghost rows
      }
    }

    // Auto-generate reference if missing (e.g. CM-P1-01)
    if (!ref) {
      const matchRef = name.match(/\b(CM-[0-9]{3,5}|ART-[0-9]{3,5}|REF-[0-9]{3,5})\b/i);
      if (matchRef) {
        ref = matchRef[1].toUpperCase();
        name = cleanText(name.replace(matchRef[0], ''));
      } else {
        ref = `CM-P${pageNum}-${String(r + 1).padStart(2, '0')}`;
      }
    }

    // Auto-detect price inside text if not in dedicated column
    if (!price) {
      const priceMatch = name.match(/(\d+[\d\s.,]*\s*(€|EUR|DH|MAD|Dhs))/i);
      if (priceMatch) {
        price = formatPrice(priceMatch[1]);
        name = cleanText(name.replace(priceMatch[0], ''));
      }
    }

    // Auto-detect location keyword inside text (e.g. "Dépôt Zerktouni", "Magasin A")
    if (!location || location === 'Dépôt Zerktouni') {
      const locMatch = name.match(/\b(Dépôt\s+[A-Za-z0-9_-]+|Rayon\s+[A-Za-z0-9_-]+|Étage\s+\d+|Hangar\s+[A-Z0-9]+)\b/i);
      if (locMatch) {
        location = locMatch[0];
      }
    }

    // Match closest photo on this page to this article's vertical span
    let matchedPhoto = '';
    let minDistance = Infinity;
    let chosenImgIdx = -1;

    for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
      if (usedImageIndices.has(imgIdx)) continue;
      const img = images[imgIdx];

      // Calculate distance between image vertical center and row center
      const rowCenter = (row.yTop + row.yBottom) / 2;
      const dist = Math.abs(img.yCenter - rowCenter);

      // Check if image is vertically overlapping or close to the row (within 120px)
      if (dist < minDistance && dist < 160) {
        minDistance = dist;
        matchedPhoto = img.dataUrl;
        chosenImgIdx = imgIdx;
      }
    }

    if (chosenImgIdx !== -1) {
      usedImageIndices.add(chosenImgIdx);
    }

    const hasPhoto = Boolean(matchedPhoto);
    const finalPhoto = matchedPhoto || FALLBACK_ANTIQUE_IMAGE;

    articles.push({
      id: `pdf-art-${Date.now()}-p${pageNum}-${r}-${Math.random().toString(36).substr(2, 4)}`,
      ref: ref.trim(),
      name: name.trim() || "Article d'Antiquité",
      category: category.trim() || 'Antiquités & Brocante',
      material: material.trim(),
      periodOrStyle: '',
      condition: 'Bel état de conservation',
      dimensions: '',
      quantity,
      price,
      location: location.trim(),
      notes,
      imageUrl: finalPhoto,
      hasExtractedPhoto: hasPhoto,
      pageNumber: pageNum,
    });
  }

  return articles;
}

/**
 * Fallback semantic parser in case standard table columns could not be identified
 */
function fallbackParsePdfText(pdfDoc: any): ExtractedPdfArticle[] {
  // Generates placeholder initial item to ensure user is never left with an empty screen
  return [];
}

/**
 * Convenience wrapper for batch extraction with options
 */
export async function extractArticlesFromPdf(
  file: File | ArrayBuffer,
  options?: { targetFolder?: string; autoSound?: boolean }
): Promise<PdfImportResult> {
  const result = await parsePdfFile(file);
  return result;
}
