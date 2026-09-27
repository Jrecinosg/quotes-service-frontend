import api from "./api";

export const dashboardService = {
  // Totales + este mes vs. mes anterior (Cotizaciones, Clientes, Solicitudes,
  // Garantías) y conteo diario de los últimos 7 días -todo calculado en el
  // servidor contra la base de datos real.
  getStats: async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  }
};
