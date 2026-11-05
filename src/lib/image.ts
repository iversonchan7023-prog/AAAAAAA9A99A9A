/**
 * Compress an uploaded image file to WebP via canvas. Returns a data URL.
 */
export async function compressImage(file: File, maxSize = 900, quality = 0.72): Promise<string> {
  const bitmap = await loadBitmap(file);
  let { width, height } = bitmap;
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  try {
    return canvas.toDataURL('image/webp', quality);
  } catch {
    return canvas.toDataURL('image/jpeg', quality);
  }
}

function loadBitmap(file: File): Promise<HTMLImageElement | ImageBitmap> {
  return new Promise((resolve, reject) => {
    if ('createImageBitmap' in window) {
      createImageBitmap(file)
        .then(resolve)
        .catch(() => fallbackImage(file, resolve, reject));
    } else {
      fallbackImage(file, resolve, reject);
    }
  });
}

function fallbackImage(
  file: File,
  resolve: (img: HTMLImageElement) => void,
  reject: (e: unknown) => void,
): void {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    resolve(img);
  };
  img.onerror = (e) => {
    URL.revokeObjectURL(url);
    reject(e);
  };
  img.src = url;
}

export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
