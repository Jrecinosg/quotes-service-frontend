import api from "./api";

export const warrantyService = {
  // search: texto libre (folio, título, cliente, factura, número de serie)
  // clientId: filtra por una empresa concreta
  getAll: async ({ search = "", clientId = "" } = {}) => {
    const response = await api.get("/warranty-projects", {
      params: {
        ...(search ? { search } : {}),
        ...(clientId ? { clientId } : {})
      }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/warranty-projects/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/warranty-projects", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`/warranty-projects/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/warranty-projects/${id}`);
    return response.data;
  }
};
