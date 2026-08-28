/**
 * Convierte un ID numérico en un correlativo tipo SO00001
 */
export const formatQuotationId = (num) => {
  if (!num) return 'SO00000';
  return `SO${String(num).padStart(5, '0')}`;
};

/**
 * Convierte un ID numérico en un correlativo tipo SOL00001 (solicitudes)
 */
export const formatRequestId = (num) => {
  if (!num) return 'SOL00000';
  return `SOL${String(num).padStart(5, '0')}`;
};

/**
 * Redondea a 2 decimales evitando errores de precisión de punto flotante
 * (ej. 10.005 * 1 no debe quedar en 10.004999999999999)
 */
export const roundCurrency = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

/**
 * Formatea un número como moneda Quetzal (Q 1,250.00)
 */
export const formatCurrency = (amount) => {
  const number = Number(amount) || 0;
  return `Q ${number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formatea fechas para que se vean bien en la interfaz
 */
export const formatDate = (dateString) => {
  if (!dateString) return '---';
  return new Date(dateString).toLocaleDateString('es-GT');
};

/**
 * Igual que formatDate pero con hora -para historiales donde importa saber
 * a qué hora exacta pasó cada cosa, no solo el día.
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '---';
  return new Date(dateString).toLocaleString('es-GT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};