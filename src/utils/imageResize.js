// Reduce una foto en el navegador antes de subirla: lado largo máx. 1600 px, JPEG ~0.8,
// respetando la orientación EXIF. Si el navegador no puede decodificar el archivo
// (p. ej. HEIC sin soporte) lanza PhotoDecodeError con un mensaje claro.
export class PhotoDecodeError extends Error {}

const decode = async (file) => {
  // 1) createImageBitmap con orientación EXIF explícita
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* se intenta con <img> */ }
  }
  // 2) <img>: los navegadores modernos aplican EXIF al dibujar (image-orientation: from-image por defecto)
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode'));
      img.src = url;
    });
  } catch {
    throw new PhotoDecodeError(
      `Este navegador no puede leer «${file.name || 'la foto'}». Si es una foto HEIC/HEIF de iPhone, cámbiala a JPEG ` +
      '(Ajustes > Cámara > Formatos > Más compatible) o súbela desde otro navegador.'
    );
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
};

export async function resizeImage(fileOrBlob, { maxSide = 1600, quality = 0.8 } = {}) {
  const src = await decode(fileOrBlob);
  const w = src.width || src.naturalWidth;
  const h = src.height || src.naturalHeight;
  if (!w || !h) throw new PhotoDecodeError(`No se pudo leer el tamaño de «${fileOrBlob.name || 'la foto'}».`);
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNG con transparencia -> fondo blanco en JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  if (src.close) src.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new PhotoDecodeError('No se pudo comprimir la foto.');
  return { blob, width: canvas.width, height: canvas.height };
}

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
