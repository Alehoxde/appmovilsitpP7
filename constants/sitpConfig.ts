// constants/sitpConfig.ts
// Archivo de configuración para personalizar la app SITP

export const SITP_CONFIG = {
  // Colores principales
  colors: {
    primary: '#1A472A',        // Verde oscuro (Puedes cambiar aquí)
    secondary: '#4CAF50',      // Verde claro
    accent: '#E74C3C',         // Rojo (Para resaltar)
    background: '#1A472A',     // Fondo de pantalla inicio
    text: '#FFFFFF',
    textDark: '#333333',
    border: '#E0E0E0',
  },

  // Información de la app
  app: {
    nombre: 'SITP Bogotá',
    descripcion: 'Sistema Integrado de Transporte Público',
    version: '1.0.0',
  },

  // Configuración del mapa
  mapa: {
    // Centro de Bogotá
    centerLat: 4.6097,
    centerLng: -74.0817,
    zoom: 0.5,
    minZoom: 0.3,
    maxZoom: 1.5,
  },

  // Estilos de las localidades
  localidades: {
    strokeWidth: 2,
    fillOpacity: 0.2, // 0.2 = 20% opacity
  },

  // Estilos de las rutas
  rutas: {
    strokeWidth: 3,
    strokeWidthSecundaria: 2,
  },
};

// Exportar para fácil acceso
export default SITP_CONFIG;
