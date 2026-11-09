import { bitacoraService } from "../services/bitacora.service";
import { resizeImage } from "./imageResize";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_TRIES = 5;

// Sube UNA foto con reintento ante 429 (respeta Retry-After si viene; si no, espera creciente).
async function uploadWithRetry(entryId, blob, meta) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await bitacoraService.uploadPhoto(entryId, blob, meta);
    } catch (error) {
      const status = error.response?.status;
      if (status === 429 && attempt < MAX_TRIES) {
        const retryAfter = Number(error.response.headers?.["retry-after"]);
        await sleep((retryAfter > 0 ? retryAfter : 2 * attempt) * 1000);
        continue;
      }
      throw error;
    }
  }
}

/**
 * Reduce y sube las fotos de una en una.
 * items: [{ id, file, caption, includeInReport?, stage? }]. onProgress({ done, total, current, step }) para la barra.
 * Devuelve { uploaded: [id...], failed: [{ id, name, message }] }: nunca falla en silencio.
 */
export async function uploadPhotosSequentially(entryId, items, onProgress, firstSortOrder = 0) {
  const uploaded = [];
  const failed = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    try {
      onProgress({ done: i, total: items.length, current: it.file.name, step: "Reduciendo" });
      const { blob } = await resizeImage(it.file, { maxSide: 1600, quality: 0.8 });
      onProgress({ done: i, total: items.length, current: it.file.name, step: "Subiendo" });
      await uploadWithRetry(entryId, blob, { caption: (it.caption || "").trim() || undefined, sortOrder: firstSortOrder + i, includeInReport: it.includeInReport !== false, stage: it.stage || undefined });
      uploaded.push(it.id);
    } catch (error) {
      const status = error.response?.status;
      const message = error.name === "PhotoDecodeError" || error.constructor?.name === "PhotoDecodeError"
        ? error.message
        : status === 429
          ? "El servidor está ocupado. Vuelve a intentarlo en un momento."
          : error.response?.data?.error || "No se pudo subir esta foto.";
      failed.push({ id: it.id, name: it.file.name, message });
    }
    onProgress({ done: i + 1, total: items.length, current: "", step: "" });
  }
  return { uploaded, failed };
}
