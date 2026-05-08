// assets/data/paraderos-data.ts
// Paraderos del SITP en Bogotá - Estructura lista para datos
export interface Paradero {
  id: number;
  nombre: string;
  latlng: { latitude: number; longitude: number };
  localidad: number;
  direccion?: string;
  codigo?: string;
  parada?: string;
}

const paraderosJson: any = require('./paraderos.json');

export const paraderos: Paradero[] = (paraderosJson.features ?? []).map((feature: any) => {
  const attrs = feature.attributes ?? {};
  const geometry = feature.geometry ?? {};

  return {
    id: attrs.objectid ?? attrs.FID ?? Math.floor(Math.random() * 1000000),
    nombre: attrs.nombre_par ?? attrs.consola_pa ?? 'Paradero SITP',
    latlng: {
      latitude: attrs.latitud_pa ?? geometry.y ?? 0,
      longitude: attrs.longitud_p ?? geometry.x ?? 0,
    },
    localidad: attrs.localidad_ ?? 0,
    direccion: attrs.direccion_ ?? undefined,
    codigo: attrs.cenefa_par ?? undefined,
    parada: attrs.panel_para ?? undefined,
  };
});
