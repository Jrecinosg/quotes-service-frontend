import api from "./api";

export const userService = {
  // --- Rutas de Perfil ---
  updateProfileName: async (name) => {
    const response = await api.put("/profile/name", { name });
    return response.data;
  },

  // Invitar a un nuevo usuario (Solo ADMIN). clientId solo aplica si role === 'CLIENT'.
  inviteUser: async (email, role, clientId) => {
    const response = await api.post("/users/invite", { email, role, clientId });
    return response.data;
  },

  // Listar correos ya autorizados
  getAuthorizedEmails: async () => {
    const response = await api.get("/users/authorized");
    return response.data;
  },
  
  // Revocar una invitación
  removeInvitation: async (email) => {
    const response = await api.delete(`/users/authorized/${email}`);
    return response.data;
  }
};