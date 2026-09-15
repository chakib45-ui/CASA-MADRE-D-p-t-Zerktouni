/**
 * Image optimization & download utility for antique cataloging.
 * Downscales oversized photos (e.g., 12MB camera files) to an optimal
 * crisp resolution for A4 print and display (max 1800px) and compresses to JPEG.
 * This saves memory, prevents storage crashes, and makes PDF generation fast.
 */

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
        // If CORS fetch fails, fallback to direct anchor
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
    window.open(imageUrl, '_blank');
  }
}

export async function optimizeImageFile(
  file: File,
  maxDimension: number = 1800,
  quality: number = 0.90
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => {
        console.warn('FileReader error on image, falling back to empty string');
        resolve('');
      };
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) {
          resolve('');
          return;
        }

        // If file is under 3MB, keep intact without canvas re-compression
        if (file.size < 3 * 1024 * 1024) {
          resolve(result);
          return;
        }

        const img = new Image();
        img.onerror = () => resolve(result); // fallback to original dataUrl if decode fails
        img.onload = () => {
          try {
            let { width, height } = img;

            // Calculate scaled dimensions maintaining aspect ratio
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
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve(result);
              return;
            }

            // High quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // White background in case of transparent PNG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);

            const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(optimizedDataUrl);
          } catch {
            // Fallback to original if canvas fails
            resolve(result);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } catch {
      resolve('');
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

