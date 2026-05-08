import { localidades } from '@/assets/data/localidades-data';
import { rutas } from '@/assets/data/rutas-data';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mapa de Bogotá - SITP</Text>
        <Text style={styles.headerSubtitle}>Versión Web</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Información Disponible</Text>
          <Text style={styles.infoText}>
            Esta versión web muestra información sobre las localidades y rutas del SITP en Bogotá.
          </Text>
          <Text style={styles.infoText}>
            Para una experiencia completa con mapa interactivo, usa la versión móvil con Expo Go.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📍 Localidades ({localidades.length})
          </Text>
          {localidades.map((localidad, index) => (
            <View
              key={`localidad-${index}`}
              style={[
                styles.localidadCard,
                {
                  borderLeftColor: localidad.color,
                },
              ]}
            >
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: localidad.color },
                ]}
              />
              <Text style={styles.localidadName}>
                {localidad.nombre}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🚌 Rutas del SITP ({rutas.length})
          </Text>
          {rutas.map((ruta, index) => (
            <View
              key={`ruta-${index}`}
              style={[
                styles.rutaCard,
                {
                  borderLeftColor: ruta.color,
                },
              ]}
            >
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: ruta.color },
                ]}
              />
              <View style={styles.rutaInfo}>
                <Text style={styles.rutaName}>{ruta.nombre}</Text>
                <Text style={styles.rutaTipo}>
                  {ruta.tipo === 'principal'
                    ? '● Ruta Principal'
                    : '- - Ruta Secundaria'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sistema Integrado de Transporte Público - SITP Bogotá
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#1A472A',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A472A',
    marginBottom: 12,
  },
  localidadCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  rutaCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  localidadName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  rutaInfo: {
    flex: 1,
  },
  rutaName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  rutaTipo: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
