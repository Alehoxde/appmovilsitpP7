# 📱 SITP Bogotá - Guía Completa de la App

## ✅ Estado Actual

Tu app está **100% funcional** con:
- ✅ Pantalla de inicio con logo y botón "Ingresar"
- ✅ Mapa interactivo con 20 localidades de Bogotá
- ✅ 6 rutas del SITP demarcadas
- ✅ Versión móvil y web
- ✅ Datos organizados en GeoJSON

---

## 📂 Estructura de Carpetas

```
appmovilsitpP7/
├── app/
│   ├── _layout.tsx           # Navegación de la app
│   ├── index.tsx             # Pantalla de inicio (logo + botón)
│   ├── mapa.tsx              # Mapa interactivo (móvil)
│   ├── mapa.web.tsx          # Lista de localidades (web)
│   └── modal.tsx             # Modal existente
├── assets/
│   ├── images/
│   │   ├── logo.png          # Tu logo
│   │   └── ...
│   └── data/
│       ├── localidades.geojson    # 20 localidades de Bogotá
│       ├── rutas-sitp.geojson     # Rutas del SITP
│       └── README.md              # Guía de datos
├── constants/
│   ├── sitpConfig.ts         # Archivo de configuración
│   └── ...
├── package.json
├── app.json
└── tsconfig.json
```

---

## 🚀 Cómo Usar

### 1️⃣ Iniciar la App

```bash
npx expo start
```

Genera un **QR** que puedes escanear con:
- 📱 **Expo Go** (descarga desde App Store o Play Store)
- 📷 **Cámara de iOS** (escanea directamente)

### 2️⃣ Para Versión Web

Presiona `w` en la terminal o ve a `http://localhost:8082`

### 3️⃣ Funcionalidades

**Pantalla de Inicio:**
- Logo de SITP
- Botón "Ingresar" para ir al mapa
- Fondo personalizable

**Pantalla de Mapa (Móvil):**
- 🗺️ Mapa interactivo con Google Maps
- 📍 20 localidades con colores
- 🚌 6 rutas del SITP
- Botón "Localidades" para ver lista
- Toca una localidad para verla resaltada

**Pantalla de Mapa (Web):**
- 📍 Lista de las 20 localidades
- 🚌 Lista de rutas del SITP
- Información organizada por secciones

---

## 🎨 Personalización

### Cambiar Colores de la App

Edita `constants/sitpConfig.ts`:

```typescript
export const SITP_CONFIG = {
  colors: {
    primary: '#1A472A',        // ← Verde principal
    secondary: '#4CAF50',      // ← Verde secundario
    accent: '#E74C3C',         // ← Rojo de resalte
    background: '#1A472A',     // ← Fondo de inicio
  }
}
```

### Cambiar Fondo de Inicio

En `app/index.tsx`, línea ~15:
```typescript
<View style={[styles.backgroundGradient, { backgroundColor: '#TU_COLOR_AQUI' }]} />
```

### Cambiar Logo

Reemplaza `assets/images/logo.png` con tu logo. La app lo cargará automáticamente.

### Cambiar Colores del Botón "Ingresar"

En `app/index.tsx`, busca `buttonIngresar`:
```typescript
backgroundColor: '#4CAF50',  // ← Cambia aquí
```

---

## 🗺️ Agregar Más Datos

### Agregar una Localidad

Edita `assets/data/localidades.geojson` y agrega:

```json
{
  "type": "Feature",
  "properties": {
    "id": 21,
    "nombre": "Mi Localidad",
    "color": "#FF5722"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-74.1000, 4.6000],
      [-74.0900, 4.6000],
      [-74.0900, 4.6100],
      [-74.1000, 4.6100],
      [-74.1000, 4.6000]
    ]]
  }
}
```

### Agregar una Ruta

Edita `assets/data/rutas-sitp.geojson`:

```json
{
  "type": "Feature",
  "properties": {
    "id": "RUTA-7",
    "nombre": "Ruta G (Nueva Ruta)",
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

**Coordenadas de referencia:**
- Centro: `-74.0817, 4.6097`
- Suba (norte): `-74.1300, 4.7800`
- Sumapaz (sur): `-74.2100, 4.5000`

---

## 📋 Localidades Actuales

1. ✅ Usaquén
2. ✅ Chapinero
3. ✅ Santa Fe
4. ✅ San Cristóbal
5. ✅ Useme
6. ✅ Tunjuelito
7. ✅ Bosa
8. ✅ Kennedy
9. ✅ Fontibón
10. ✅ Engativá
11. ✅ Suba
12. ✅ Barrios Unidos
13. ✅ Teusaquillo
14. ✅ Los Mártires
15. ✅ Antonio Nariño
16. ✅ Puente Aranda
17. ✅ La Candelaria
18. ✅ Rafael Uribe Uribe
19. ✅ Ciudad Bolívar
20. ✅ Sumapaz

---

## 🚌 Rutas Actuales

| Ruta | Nombre | Tipo | Color |
|------|--------|------|-------|
| RUTA-1 | Centro - Suba | Principal | Rojo |
| RUTA-2 | Occidente - Oriente | Principal | Azul |
| RUTA-3 | Sur - Norte | Principal | Verde |
| RUTA-4 | Bosa - Centro | Secundaria | Naranja |
| RUTA-5 | Kennedy - Centro | Secundaria | Púrpura |
| RUTA-6 | Engativá - Centro | Secundaria | Turquesa |

---

## 🔧 Solución de Problemas

### El QR no aparece
```bash
npx expo start --clear
```

### La app no carga en móvil
- Asegúrate de descargar **Expo Go**
- Escanea nuevamente el QR
- Recarga con `r` en la terminal

### Los datos no se cargan
- Verifica que los archivos `.geojson` estén en `assets/data/`
- Valida el JSON en https://jsonlint.com/
- Reinicia la app con `r`

### Error de módulos
```bash
npm install
npx expo start --clear
```

---

## 📱 Próximos Pasos Recomendados

1. ✅ Reemplaza `logo.png` con tu logo
2. ✅ Personaliza los colores en `sitpConfig.ts`
3. ✅ Importa datos reales de localidades si los tienes
4. ✅ Agrega más rutas del SITP
5. ✅ Crea un archivo `background.png` personalizado
6. ✅ Agrega información adicional a cada localidad

---

## 📞 Contacto

¿Necesitas ayuda?
- Revisa `assets/data/README.md` para datos
- Consulta `constants/sitpConfig.ts` para configuración
- Valida JSON en https://geojson.io/

---

**Estado**: ✅ Producción  
**Versión**: 1.0.0  
**Última actualización**: Mayo 2026
