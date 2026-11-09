import api from "./api";

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
  getPhotoBlob: async (photoId) => (await api.get(`/bitacora/photos/${photoId}`, { responseType: "blob" })).data,
  updatePhoto: async (id, payload) => (await api.put(`/bitacora/photos/${id}`, payload)).data,
  deletePhoto: async (id) => (await api.delete(`/bitacora/photos/${id}`)).data,

  createPending: async (projectId, payload) => (await api.post(`/bitacora/projects/${projectId}/pendings`, payload)).data,
  updatePending: async (id, payload) => (await api.put(`/bitacora/pendings/${id}`, payload)).data,
  deletePending: async (id) => (await api.delete(`/bitacora/pendings/${id}`)).data
};
