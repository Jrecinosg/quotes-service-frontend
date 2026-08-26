import api from "./api";

export const clientService = {
  getAll: async () => {
    const response = await api.get("/clients");
    return response.data;
  },

  create: async (clientData) => {
    const response = await api.post("/clients", clientData);
    return response.data;
  },

  update: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Fusiona el cliente `id` (duplicado) dentro de `intoClientId` (el que se
  // conserva): mueve sus cotizaciones/solicitudes y borra el duplicado.
  merge: async (id, intoClientId) => {
    const response = await api.post(`/clients/${id}/merge`, { intoClientId });
    return response.data;
  }
};