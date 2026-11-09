import api from "./api";

const MAX_PHOTO_RETRIES = 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Lee una foto reintentando ante 429 (limitador del servidor): respeta Retry-After
// (segundos o fecha HTTP) y, si no viene, espera de forma creciente (1,2,4,8,16 s). Máx. 5 reintentos.
async function fetchPhotoBlob(photoId, onRetry) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return (await api.get(`/bitacora/photos/${photoId}`, { responseType: "blob" })).data;
    } catch (err) {
      if (err?.response?.status !== 429 || attempt >= MAX_PHOTO_RETRIES) throw err;
      const header = err.response.headers?.["retry-after"];
      let wait = Number(header) * 1000;
      if (!Number.isFinite(wait) && header) wait = new Date(header).getTime() - Date.now();
      if (!Number.isFinite(wait) || wait <= 0) wait = 1000 * 2 ** attempt;
      wait = Math.min(Math.max(wait, 500), 30000) + Math.random() * 250;
      if (onRetry) onRetry({ attempt: attempt + 1, waitMs: wait });
      await sleep(wait);
    }
  }
}

// Módulo interno (ADMIN/USER). Las fotos NO van en JSON: se piden aparte por /photos/:id
// con la sesión (un <img src> directo no envía la cabecera Authorization).
export const bitacoraService = {
  getClients: async () => (await api.get("/bitacora/clients")).data,

  getProjects: async ({ clientId, status } = {}) => {
    const response = await api.get("/bitacora/projects", {
      params: { limit: 300, ...(clientId ? { clientId } : {}), ...(status ? { status } : {}) }
    });
    return response.data.data;
  },

  getProject: async (id) => (await api.get(`/bitacora/projects/${id}`)).data,
  createProject: async (payload) => (await api.post("/bitacora/projects", payload)).data,
  updateProject: async (id, payload) => (await api.put(`/bitacora/projects/${id}`, payload)).data,
  closeProject: async (id, payload) => (await api.post(`/bitacora/projects/${id}/close`, payload)).data,
  reopenProject: async (id) => (await api.post(`/bitacora/projects/${id}/reopen`)).data,

  createEntry: async (projectId, payload) => (await api.post(`/bitacora/projects/${projectId}/entries`, payload)).data,
  updateEntry: async (id, payload) => (await api.put(`/bitacora/entries/${id}`, payload)).data,
  deleteEntry: async (id) => (await api.delete(`/bitacora/entries/${id}`)).data,

  // Un archivo por petición (el servidor las procesa de una en una)
  uploadPhoto: async (entryId, blob, { caption, sortOrder } = {}) => {
    const form = new FormData();
    form.append("photo", blob, "foto.jpg");
    if (caption) form.append("caption", caption);
    if (sortOrder !== undefined) form.append("sortOrder", String(sortOrder));
    return (await api.post(`/bitacora/entries/${entryId}/photos`, form)).data;
  },
  getPhotoBlob: (photoId, onRetry) => fetchPhotoBlob(photoId, onRetry),
  updatePhoto: async (id, payload) => (await api.put(`/bitacora/photos/${id}`, payload)).data,
  deletePhoto: async (id) => (await api.delete(`/bitacora/photos/${id}`)).data,

  createPending: async (projectId, payload) => (await api.post(`/bitacora/projects/${projectId}/pendings`, payload)).data,
  updatePending: async (id, payload) => (await api.put(`/bitacora/pendings/${id}`, payload)).data,
  deletePending: async (id) => (await api.delete(`/bitacora/pendings/${id}`)).data
};
