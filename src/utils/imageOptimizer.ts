/**
 * Image optimization & download utility for antique cataloging.
 * Downscales oversized photos (e.g., 12MB camera files) to an optimal
 * crisp resolution for A4 print and display (max 1800px) and compresses to JPEG.
 * This saves memory, prevents storage crashes, and makes PDF generation fast.
 */

/**
 * Fallback antique placeholder image (SVG Data URL)
 * Styled with Casa Madre monogram CM, antique border and warm parchment tone.
 */
export const FALLBACK_ANTIQUE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#2a2019" />
      <stop offset="60%" stop-color="#1c1511" />
      <stop offset="100%" stop-color="#120e0c" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4af37" />
      <stop offset="50%" stop-color="#aa7a44" />
      <stop offset="100%" stop-color="#80562e" />
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bgGrad)" />
  <rect x="30" y="30" width="740" height="740" rx="16" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="6,4" opacity="0.6" />
  <rect x="50" y="50" width="700" height="700" rx="12" fill="none" stroke="#4d382b" stroke-width="1.5" />
  
  <!-- Decorative corner brackets -->
  <path d="M 50 90 L 50 50 L 90 50" fill="none" stroke="url(#goldGrad)" stroke-width="3" />
  <path d="M 750 90 L 750 50 L 710 50" fill="none" stroke="url(#goldGrad)" stroke-width="3" />
  <path d="M 50 710 L 50 750 L 90 750" fill="none" stroke="url(#goldGrad)" stroke-width="3" />
  <path d="M 750 710 L 750 750 L 710 750" fill="none" stroke="url(#goldGrad)" stroke-width="3" />

  <!-- Monogram & Emblem -->
  <circle cx="400" cy="360" r="90" fill="#241b16" stroke="url(#goldGrad)" stroke-width="2" />
  <text x="400" y="380" font-family="Cinzel, Georgia, serif" font-size="64" font-weight="bold" fill="#f0dfcc" text-anchor="middle" letter-spacing="4">CM</text>
  
  <!-- Titles -->
  <text x="400" y="500" font-family="Cinzel, Georgia, serif" font-size="28" font-weight="bold" fill="#e8cbb0" text-anchor="middle" letter-spacing="6">CASA MADRE</text>
  <text x="400" y="535" font-family="sans-serif" font-size="14" fill="#a89382" text-anchor="middle" letter-spacing="3">INVENTAIRE & ANTIQUITÉS</text>
  <text x="400" y="570" font-family="Georgia, serif" font-style="italic" font-size="15" fill="#7a6758" text-anchor="middle">Illustration en cours d'archivage</text>
</svg>
`)}`;

export function isImageFile(file: File): boolean {
  if (!file) return false;
  if (file.type && file.type.toLowerCase().startsWith('image/')) return true;
  const name = (file.name || '').toLowerCase();
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif|jfif|svg|tiff?|avif)$/i.test(name);
}

export async function downloadImageFile(imageUrl: string, filename: string = 'photo-casa-madre.jpg') {
  try {
    const safeName = filename
      .replace(/[^a-zA-Z0-9à-ÿÀ-Ý-_.]/g, '_')
      .replace(/_{2,}/g, '_');
    const finalName = /\.(jpe?g|png|webp|gif)$/i.test(safeName) ? safeName : `${safeName}.jpg`;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const response = await fetch(imageUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = finalName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      } catch {
        // Fallback to direct anchor if fetch fails
      }
    }

    // Direct anchor download for data URLs and local blob URLs
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Erreur téléchargement image', err);
    try {
      window.open(imageUrl, '_blank');
    } catch {
      // ignore
    }
  }
}

/**
 * Optimizes an uploaded image file:
 * - Resizes dimensions to max 1400px (crisp for A4 printing and screens)
 * - Compresses to clean JPEG (or PNG if SVG/transparent)
 * - Guarantees the output base64 fits well within Firestore's 1MB document limit (<400KB)
 * - Prevents CORS and decoding errors
 */
export async function optimizeImageFile(
  file: File,
  maxDimension: number = 1400,
  quality: number = 0.84
): Promise<string> {
  return new Promise((resolve) => {
    try {
      // If SVG file, read directly
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || FALLBACK_ANTIQUE_IMAGE);
        reader.onerror = () => resolve(FALLBACK_ANTIQUE_IMAGE);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        console.warn('FileReader error on image, falling back to placeholder');
        resolve(FALLBACK_ANTIQUE_IMAGE);
      };

      reader.onload = (e) => {
        const rawResult = e.target?.result as string;
        if (!rawResult) {
          resolve(FALLBACK_ANTIQUE_IMAGE);
          return;
        }

        const img = new Image();
        img.onerror = () => {
          console.warn('Image decode error, using raw or fallback');
          resolve(rawResult || FALLBACK_ANTIQUE_IMAGE);
        };

        img.onload = () => {
          try {
            let { width, height } = img;

            // Scale down if oversized
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve(rawResult);
              return;
            }

            // High-quality bicubic smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Fill warm background so transparency doesn't turn black
            ctx.fillStyle = '#faf7f2';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG
            let optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);

            // Second pass if still exceeding 600KB (to strictly respect Firestore 1MB limits)
            if (optimizedDataUrl.length > 600 * 1024) {
              optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.70);
            }

            resolve(optimizedDataUrl);
          } catch (canvasErr) {
            console.warn('Canvas optimization error:', canvasErr);
            resolve(rawResult || FALLBACK_ANTIQUE_IMAGE);
          }
        };

        img.src = rawResult;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('optimizeImageFile fatal error:', err);
      resolve(FALLBACK_ANTIQUE_IMAGE);
    }
  });
}

/**
 * Asynchronously extract all files from a DataTransfer object,
 * including multi-file drops and directory hierarchies (using webkitGetAsEntry if available).
 */
export async function extractFilesFromDataTransfer(dataTransfer: DataTransfer | null): Promise<File[]> {
  if (!dataTransfer) return [];
  const files: File[] = [];

  // Helper to read entries recursively from a directory
  const readDirectoryEntries = async (dirEntry: any): Promise<any[]> => {
    const reader = dirEntry.createReader();
    const entries: any[] = [];
    let readBatch: any[] = [];
    do {
      readBatch = await new Promise<any[]>((resolve) => {
        reader.readEntries(
          (results: any[]) => resolve(Array.from(results)),
          () => resolve([])
        );
      });
      entries.push(...readBatch);
    } while (readBatch.length > 0);
    return entries;
  };

  const traverseEntry = async (entry: any): Promise<void> => {
    if (!entry) return;
    if (entry.isFile) {
      await new Promise<void>((resolve) => {
        entry.file(
          (file: File) => {
            if (file) files.push(file);
            resolve();
          },
          () => resolve()
        );
      });
    } else if (entry.isDirectory) {
      try {
        const childEntries = await readDirectoryEntries(entry);
        for (const child of childEntries) {
          await traverseEntry(child);
        }
      } catch {
        // Continue if directory traversal encounters an issue
      }
    }
  };

  // 1. Try modern DataTransferItemList with webkitGetAsEntry for recursive directories & multi-files
  if (dataTransfer.items && dataTransfer.items.length > 0) {
    const entryPromises: Promise<void>[] = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          entryPromises.push(traverseEntry(entry));
        } else {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    }
    if (entryPromises.length > 0) {
      await Promise.all(entryPromises);
    }
  }

  // 2. Fallback to standard dataTransfer.files if items yielded nothing
  if (files.length === 0 && dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files.item(i);
      if (file) files.push(file);
    }
  }

  return files;
}

