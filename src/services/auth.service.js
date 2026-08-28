import api from "./api";

export const authService = {
  // Llama al backend cuando existe en firebase. Registra en la DB
  syncUser: async () => {
    const response = await api.post("/auth/sync");
    return response.data;
  },
  
  // Obtener perfil
  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data;
  },

  // Restablecer contraseña: el backend genera el link real de Firebase y lo
  // envia con nuestro diseño desde info@grupo-ac.com.gt, en vez de dejar que
  // Firebase mande su correo generico.
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  }
};