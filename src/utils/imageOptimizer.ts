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

