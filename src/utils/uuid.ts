/**
 * Polyfill para crypto.randomUUID() para navegadores que não suportam
 * ou contextos não-seguros (não-HTTPS)
 */
export function generateUUID(): string {
  // Tenta usar crypto.randomUUID() nativo se disponível
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Falha silenciosa, usa fallback
    }
  }

  // Fallback: gera UUID v4 usando Math.random()
  // Formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Exporta também como default para facilitar importação
export default generateUUID;
