import api from "./api";

export const requestService = {
  getAll: async (page = 1, limit = 10, status = "") => {
    const response = await api.get("/requests", { params: { page, limit, status } });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/requests", data);
    return response.data;
  },

  updateStatus: async (id, status, note) => {
    const response = await api.put(`/requests/${id}/status`, { status, note });
    return response.data;
  },

  addNote: async (id, body) => {
    const response = await api.post(`/requests/${id}/notes`, { body });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/requests/stats");
    return response.data;
  }
};
