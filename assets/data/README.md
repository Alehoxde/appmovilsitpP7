# Guía de Datos SITP Bogotá

## Estructura de Carpetas

```
assets/
├── data/
│   ├── localidades.geojson    # Datos de las 20 localidades
│   ├── rutas-sitp.geojson     # Rutas de transporte del SITP
│   └── README.md              # Este archivo
└── images/
    ├── logo.png               # Logo de la app
    ├── background.png         # Fondo personalizable
    └── ...
```

## Archivos GeoJSON

### 1. **localidades.geojson**
Contiene las 20 localidades de Bogotá con:
- `id`: Número de localidad (1-20)
- `nombre`: Nombre de la localidad
- `color`: Color hexadecimal para mostrar en el mapa (ej: `#E74C3C`)
- `geometry`: Coordenadas del polígono (latitud, longitud)

**Localidades incluidas:**
1. Usaquén
2. Chapinero
3. Santa Fe
4. San Cristóbal
5. Useme
6. Tunjuelito
7. Bosa
8. Kennedy
9. Fontibón
10. Engativá
11. Suba
12. Barrios Unidos
13. Teusaquillo
14. Los Mártires
15. Antonio Nariño
16. Puente Aranda
17. La Candelaria
18. Rafael Uribe Uribe
19. Ciudad Bolívar
20. Sumapaz

### 2. **rutas-sitp.geojson**
Contiene 6 rutas de ejemplo del SITP con:
- `id`: Código de ruta (ej: `RUTA-1`)
- `nombre`: Nombre descriptivo (ej: `Ruta A (Centro - Suba)`)
- `color`: Color hexadecimal
- `tipo`: `"principal"` o `"secundaria"`
- `geometry`: Coordenadas de las rutas (LineString)

## Cómo Personalizar

### Agregar una Nueva Localidad
En `localidades.geojson`, agrega un nuevo objeto en el array `features`:

```json
{
  "type": "Feature",
  "properties": {
    "id": 21,
    "nombre": "Mi Nueva Localidad",
    "color": "#FF5722"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-74.0500, 4.6000],
      [-74.0300, 4.6000],
      [-74.0300, 4.6200],
      [-74.0500, 4.6200],
      [-74.0500, 4.6000]
    ]]
  }
}
```

### Agregar una Nueva Ruta
En `rutas-sitp.geojson`, agrega un nuevo objeto:

```json
{
  "type": "Feature",
  "properties": {
    "id": "RUTA-7",
    "nombre": "Ruta G (Descripción)",
    "color": "#00BCD4",
    "tipo": "principal"
  },
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-74.2000, 4.6800],
      [-74.1500, 4.6850],
      [-74.1000, 4.6900]
    ]
  }
}
```

## Coordenadas de Referencia - Bogotá

- **Centro histórico**: -74.0817, 4.6097
- **Norte (Suba)**: -74.1300, 4.7800
- **Sur (Sumapaz)**: -74.2100, 4.5000
- **Oriente (Usaquén)**: -74.0150, 4.7400
- **Occidente (Fontibón)**: -74.2200, 4.7100

## Formatos de Color

Puedes usar colores hexadecimales:
- `#E74C3C` - Rojo
- `#3498DB` - Azul
- `#2ECC71` - Verde
- `#F39C12` - Naranja
- `#9B59B6` - Púrpura
- `#1ABC9C` - Turquesa
- `#34495E` - Gris oscuro

## Validar tu GeoJSON

Antes de usar, valida tu archivo en:
- https://geojson.io/
- https://jsonlint.com/

## Cambiar Colores de la App

Para personalizar los colores principales de la app, edita el archivo:
```
constants/sitpConfig.ts
```

```typescript
export const SITP_CONFIG = {
  colors: {
    primary: '#1A472A',        // ← Cambia aquí
    secondary: '#4CAF50',      // ← Cambiar aquí
    background: '#1A472A',     // ← Fondo de inicio
    // ...
  }
}
```

## Cambiar Fondo de la Pantalla de Inicio

En `app/index.tsx`, busca esta línea:
```typescript
<View style={[styles.backgroundGradient, { backgroundColor: '#1A472A' }]} />
```

Cambia el código de color `#1A472A` por el que desees.

## Cambiar Logo

Reemplaza el archivo `assets/images/logo.png` con tu logo.

La app automáticamente lo cargará desde:
```typescript
require('@/assets/images/logo.png')
```

## Estructura de un Feature GeoJSON

```json
{
  "type": "Feature",
  "properties": {
    // Datos personalizados aquí
  },
  "geometry": {
    "type": "Polygon|LineString|Point",
    "coordinates": [/* coordenadas */]
  }
}
```

## Tipos de Geometría Soportados

- **Polygon**: Para localidades (formato: array de arrays)
- **LineString**: Para rutas (formato: array simple)
- **Point**: Para ubicaciones (formato: [lon, lat])

## Contacto y Soporte

¿Problemas con los datos? Revisa:
1. La sintaxis del JSON (usa jsonlint.com)
2. Las coordenadas estén en el rango correcto
3. Los nombres tengan caracteres válidos (sin comillas sin escape)

---

**Última actualización**: Mayo 2026
