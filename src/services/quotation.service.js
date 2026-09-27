import api from "./api";

export const quotationService = {
  // sort: "" = agrupadas por cliente (listado normal); "recent" = las más
  // recientes primero (Dashboard y buscador global).
  getAll: async (page = 1, limit = 10, search = "", sort = "") => {
    const response = await api.get("/quotations", {
      params: {
        page,
        limit,
        search,
        ...(sort ? { sort } : {})
      }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  create: async (quotationData) => {
    const response = await api.post("/quotations", quotationData);
    return response.data;
  },

  update: async (id, quotationData) => {
    const response = await api.put(`/quotations/${id}`, quotationData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/quotations/stats");
    return response.data;
  },

  addPayment: async (quotationId, paymentData) => {
    const response = await api.post(`/quotations/${quotationId}/payments`, paymentData);
    return response.data;
  },

  deletePayment: async (quotationId, paymentId) => {
    const response = await api.delete(`/quotations/${quotationId}/payments/${paymentId}`);
    return response.data;
  },
};