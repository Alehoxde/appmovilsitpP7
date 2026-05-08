// app/mapa.native.tsx
import * as turf from '@turf/turf';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';

import { localidades } from '@/assets/data/localidades-data';
import { paraderos } from '@/assets/data/paraderos-data';
import { rutas } from '@/assets/data/rutas-data';

type Paradero = typeof paraderos[number];
type Ruta = typeof rutas[number];

export default function MapaScreen() {
  const [selectedLocalidadId, setSelectedLocalidadId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Paradero | null>(null);
  const [recommendedRoute, setRecommendedRoute] = useState<Ruta | null>(null);
  const [routeSegment, setRouteSegment] = useState<typeof rutas[0]['coords']>([]);
  const [boardingStop, setBoardingStop] = useState<Paradero | null>(null);
  const [alightingStop, setAlightingStop] = useState<Paradero | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocalidadInModal, setSelectedLocalidadInModal] = useState<number | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const regionBogota = useMemo(
    () => ({
      latitude: 4.6097,
      longitude: -74.0817,
      latitudeDelta: 0.6,
      longitudeDelta: 0.6,
    }),
    []
  );

  const selectedLocalidad = useMemo(
    () => localidades.find(localidad => localidad.id === selectedLocalidadId) ?? null,
    [selectedLocalidadId]
  );

  const paraderosFiltrados = useMemo(
    () =>
      selectedLocalidad
        ? paraderos.filter(paradero => paradero.localidad === selectedLocalidad.id)
        : [],
    [selectedLocalidad]
  );

  const regionLocalidad = useMemo(() => {
    if (!selectedLocalidad) {
      return regionBogota;
    }

    const latitudes = selectedLocalidad.coords.map(coord => coord.latitude);
    const longitudes = selectedLocalidad.coords.map(coord => coord.longitude);

    return {
      latitude: latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length,
      longitude: longitudes.reduce((sum, value) => sum + value, 0) / longitudes.length,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [selectedLocalidad, regionBogota]);

  const paraderosInModal = useMemo(
    () => selectedLocalidadInModal ? paraderos.filter(p => p.localidad === selectedLocalidadInModal) : [],
    [selectedLocalidadInModal]
  );

  const paraderosInRoute = useMemo(() => {
    if (!recommendedRoute || !boardingStop || !alightingStop) return [];

    const line = turf.lineString(recommendedRoute.coords.map(c => [c.longitude, c.latitude]));
    const boardingPoint = turf.point([boardingStop.latlng.longitude, boardingStop.latlng.latitude]);
    const alightingPoint = turf.point([alightingStop.latlng.longitude, alightingStop.latlng.latitude]);

    const boardingOnLine = turf.nearestPointOnLine(line, boardingPoint);
    const alightingOnLine = turf.nearestPointOnLine(line, alightingPoint);

    const boardingDist = turf.distance(turf.point([recommendedRoute.coords[0].longitude, recommendedRoute.coords[0].latitude]), boardingOnLine, { units: 'kilometers' });
    const alightingDist = turf.distance(turf.point([recommendedRoute.coords[0].longitude, recommendedRoute.coords[0].latitude]), alightingOnLine, { units: 'kilometers' });

    const minDist = Math.min(boardingDist, alightingDist);
    const maxDist = Math.max(boardingDist, alightingDist);

    return paraderos.filter(paradero => {
      if (paradero.id === boardingStop.id || paradero.id === alightingStop.id) return false;
      
      const pPoint = turf.point([paradero.latlng.longitude, paradero.latlng.latitude]);
      const pOnLine = turf.nearestPointOnLine(line, pPoint);
      const pDist = turf.distance(turf.point([recommendedRoute.coords[0].longitude, recommendedRoute.coords[0].latitude]), pOnLine, { units: 'kilometers' });
      
      return pDist > minDist && pDist < maxDist && turf.distance(pPoint, pOnLine, { units: 'kilometers' }) < 0.3;
    });
  }, [recommendedRoute, boardingStop, alightingStop]);

  const searchParaderos = useMemo(
    () => (selectedLocalidad ? paraderosFiltrados : paraderos),
    [selectedLocalidad, paraderosFiltrados]
  );

  useEffect(() => {
    if (selectedLocalidad && mapRef.current) {
      mapRef.current.animateToRegion(regionLocalidad, 600);
    }
  }, [selectedLocalidad, regionLocalidad]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para recomendaciones de rutas.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    })();
  }, []);

  const getNearestParaderoForRoute = (route: Ruta, target: [number, number]) => {
    const routeLine = turf.lineString(route.coords.map(coord => [coord.longitude, coord.latitude]));
    const nearbyStops = paraderos
      .map(paradero => {
        const stopPoint = turf.point([paradero.latlng.longitude, paradero.latlng.latitude]);
        const nearestOnRoute = turf.nearestPointOnLine(routeLine, stopPoint);
        const distToRoute = turf.distance(stopPoint, nearestOnRoute, { units: 'kilometers' });
        const targetPoint = turf.point(target);
        const distToTarget = turf.distance(stopPoint, targetPoint, { units: 'kilometers' });
        return { paradero, distToRoute, distToTarget };
      })
      .filter(item => item.distToRoute <= 0.4);

    if (nearbyStops.length === 0) {
      return paraderos
        .map(paradero => ({
          paradero,
          distToTarget: turf.distance(
            turf.point([paradero.latlng.longitude, paradero.latlng.latitude]),
            turf.point(target),
            { units: 'kilometers' }
          ),
        }))
        .sort((a, b) => a.distToTarget - b.distToTarget)[0]?.paradero ?? null;
    }

    return nearbyStops.sort((a, b) => a.distToTarget - b.distToTarget)[0].paradero;
  };

  const calculateBestRoute = (origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) => {
    const originPoint = turf.point([origin.longitude, origin.latitude]);
    const destPoint = turf.point([destination.longitude, destination.latitude]);

    const scoredRoutes = rutas.map(route => {
      const line = turf.lineString(route.coords.map(coord => [coord.longitude, coord.latitude]));
      const nearestOrigin = turf.nearestPointOnLine(line, originPoint);
      const nearestDest = turf.nearestPointOnLine(line, destPoint);
      const originDist = turf.distance(originPoint, nearestOrigin, { units: 'kilometers' });
      const destDist = turf.distance(destPoint, nearestDest, { units: 'kilometers' });
      const score = originDist + destDist;
      return { route, score, originDist, destDist, line, nearestOrigin, nearestDest };
    });

    const best = scoredRoutes.sort((a, b) => a.score - b.score)[0];
    if (!best) return null;

    const boarding = getNearestParaderoForRoute(best.route, [origin.longitude, origin.latitude]);
    const alighting = getNearestParaderoForRoute(best.route, [destination.longitude, destination.latitude]);

    if (!boarding || !alighting) return null;

    // Crear segmento de ruta entre paraderos
    const boardingPoint = turf.point([boarding.latlng.longitude, boarding.latlng.latitude]);
    const alightingPoint = turf.point([alighting.latlng.longitude, alighting.latlng.latitude]);
    
    // Obtener índices de los puntos más cercanos en la ruta
    const routeCoords = best.route.coords.map(c => [c.longitude, c.latitude]);
    const boardingOnLine = turf.nearestPointOnLine(best.line, boardingPoint);
    const alightingOnLine = turf.nearestPointOnLine(best.line, alightingPoint);
    
    const boardingDist = turf.distance(turf.point(routeCoords[0]), boardingOnLine, { units: 'kilometers' });
    const alightingDist = turf.distance(turf.point(routeCoords[0]), alightingOnLine, { units: 'kilometers' });
    
    // Construir el segmento de ruta entre las paradas
    let routeSegment: typeof best.route.coords = [];
    let accumulatedDistance = 0;
    const minDist = Math.min(boardingDist, alightingDist);
    const maxDist = Math.max(boardingDist, alightingDist);
    
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const segmentStart = turf.point(routeCoords[i]);
      const segmentEnd = turf.point(routeCoords[i + 1]);
      const segmentLength = turf.distance(segmentStart, segmentEnd, { units: 'kilometers' });
      
      if (accumulatedDistance + segmentLength >= minDist && accumulatedDistance <= maxDist) {
        routeSegment.push(best.route.coords[i]);
        if (accumulatedDistance + segmentLength >= maxDist) {
          routeSegment.push(best.route.coords[i + 1]);
          break;
        }
      }
      accumulatedDistance += segmentLength;
    }

    // Si no hay segmento válido, usar la ruta completa
    if (routeSegment.length < 2) {
      routeSegment = best.route.coords;
    }

    // Calcular distancia solo del segmento de bus entre paradas
    const segmentLine = turf.lineString(routeSegment.map(c => [c.longitude, c.latitude]));
    const busSegmentDistance = turf.length(segmentLine, { units: 'kilometers' });

    // Estimar tiempos:
    // Caminar a la parada: ~1.4 m/s (5 km/h)
    // Bus: ~3 m/s (11 km/h en Bogotá, SITP es lento)
    // Caminar desde parada al destino: ~1.4 m/s (5 km/h)
    const walkingSpeed = 5; // km/h
    const busSpeed = 11; // km/h
    const walkToBoardingTime = (best.originDist / walkingSpeed) * 60; // en minutos
    const busTime = (busSegmentDistance / busSpeed) * 60; // en minutos - SOLO segmento entre paradas
    const walkFromAlightingTime = (best.destDist / walkingSpeed) * 60; // en minutos
    const totalTime = Math.round(walkToBoardingTime + busTime + walkFromAlightingTime);

    return {
      route: best.route,
      routeSegment,
      board: boarding,
      alight: alighting,
      score: best.score,
      originDist: best.originDist,
      destDist: best.destDist,
      busSegmentDistance,
      totalTime,
    };
  };

  const handleSearchRoute = () => {
    if (!currentLocation) {
      Alert.alert('Ubicación no disponible', 'No se pudo obtener tu ubicación actual.');
      return;
    }

    if (selectedDestination) {
      const plan = calculateBestRoute(currentLocation.coords, selectedDestination.latlng);
      if (!plan) {
        Alert.alert('Ruta no encontrada', 'No se encontró una ruta adecuada para el destino.');
        return;
      }

      setRecommendedRoute(plan.route);
      setRouteSegment(plan.routeSegment);
      setBoardingStop(plan.board);
      setAlightingStop(plan.alight);
      setEstimatedTime(plan.totalTime);
      setSearchModalVisible(false);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: plan.board?.latlng.latitude ?? selectedDestination.latlng.latitude,
          longitude: plan.board?.latlng.longitude ?? selectedDestination.latlng.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 600);
      }
    }
  };

  const handleGoToCurrentLocation = () => {
    if (!currentLocation) {
      Alert.alert('Ubicación no disponible', 'No se pudo obtener tu ubicación actual.');
      return;
    }

    mapRef.current?.animateToRegion({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 600);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={regionBogota}
      >
        {selectedLocalidad && (
          <Polygon
            coordinates={selectedLocalidad.coords}
            strokeColor={selectedLocalidad.color}
            fillColor={`${selectedLocalidad.color}33`}
            strokeWidth={3}
          />
        )}

        {currentLocation && boardingStop && (
          <Polyline
            coordinates={[
              { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
              boardingStop.latlng,
            ]}
            strokeColor="#2ECC71"
            strokeWidth={4}
            lineDashPattern={[6, 4]}
          />
        )}

        {recommendedRoute && boardingStop && alightingStop && routeSegment.length > 0 && (
          <Polyline
            coordinates={routeSegment}
            strokeColor={recommendedRoute.color}
            strokeWidth={6}
          />
        )}

        {alightingStop && selectedDestination && (
          <Polyline
            coordinates={[
              alightingStop.latlng,
              selectedDestination.latlng,
            ]}
            strokeColor="#9B59B6"
            strokeWidth={4}
            lineDashPattern={[6, 4]}
          />
        )}

        {paraderosFiltrados.map(paradero => (
          <Marker
            key={`paradero-${paradero.id}`}
            coordinate={paradero.latlng}
            title={paradero.nombre}
            description={paradero.direccion ?? 'Paradero SITP'}
            pinColor={selectedLocalidad ? '#007AFF' : 'blue'}
          />
        ))}

        {selectedDestination && (
          <Marker
            coordinate={selectedDestination.latlng}
            title={selectedDestination.nombre}
            description="Destino seleccionado"
            pinColor="red"
          />
        )}

        {currentLocation && (
          <Marker
            coordinate={currentLocation.coords}
            title="Tu ubicación"
            description="Ubicación actual"
            pinColor="green"
          />
        )}

        {boardingStop && (
          <Marker
            coordinate={boardingStop.latlng}
            title="Sube aquí"
            description={boardingStop.nombre}
            pinColor="#F39C12"
          />
        )}

        {alightingStop && (
          <Marker
            coordinate={alightingStop.latlng}
            title="Baja aquí"
            description={alightingStop.nombre}
            pinColor="#9B59B6"
          />
        )}

        {paraderosInRoute.map(paradero => (
          <Marker
            key={`route-stop-${paradero.id}`}
            coordinate={paradero.latlng}
            title={paradero.nombre}
            description="Parada en ruta"
            pinColor="#3498DB"
          />
        ))}
      </MapView>

      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>Mapa de Bogotá - SITP</Text>
        <Text style={styles.headerSubtitle}>
          {recommendedRoute
            ? `Mejor ruta: ${recommendedRoute.nombre} → ${selectedDestination?.nombre}`
            : selectedLocalidad
            ? `${paraderosFiltrados.length} paraderos en ${selectedLocalidad.nombre}`
            : 'Selecciona una localidad'}
        </Text>
      </View>

      <Pressable style={styles.buttonLocalidades} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonLocalidadesText}>Seleccionar localidad</Text>
      </Pressable>

      <Pressable style={styles.buttonSearch} onPress={() => setSearchModalVisible(true)}>
        <Text style={styles.buttonSearchText}>Buscar ruta</Text>
      </Pressable>

      <Pressable style={styles.buttonLocation} onPress={handleGoToCurrentLocation}>
        <Text style={styles.buttonLocationText}>Mi ubicación</Text>
      </Pressable>

      {selectedLocalidad && (
        <View style={styles.selectedLocalidadInfo}>
          <Text style={styles.selectedLocalidadName}>
            {selectedLocalidad.nombre} · {paraderosFiltrados.length} paraderos
          </Text>
          <Pressable onPress={() => setSelectedLocalidadId(null)}>
            <Text style={styles.selectedLocalidadClose}>Cerrar</Text>
          </Pressable>
        </View>
      )}

      {recommendedRoute && selectedDestination && (
        <View style={styles.selectedRouteInfo}>
          <View>
            <Text style={styles.selectedRouteName}>{recommendedRoute.nombre}</Text>
            <Text style={styles.selectedRouteDetail}>
              Sube en: {boardingStop?.nombre ?? 'N/A'}
            </Text>
            <Text style={styles.selectedRouteDetail}>
              Baja en: {alightingStop?.nombre ?? 'N/A'}
            </Text>
            {estimatedTime && (
              <Text style={styles.selectedRouteTime}>
                ⏱️ Tiempo aprox: {estimatedTime} min
              </Text>
            )}
          </View>
          <Pressable onPress={() => { setRecommendedRoute(null); setRouteSegment([]); setSelectedDestination(null); setBoardingStop(null); setAlightingStop(null); setEstimatedTime(null); }}>
            <Text style={styles.selectedRouteClose}>Cerrar</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedLocalidadInModal ? `Paraderos en ${localidades.find(l => l.id === selectedLocalidadInModal)?.nombre}` : 'Selecciona una localidad'}
              </Text>
              <Pressable onPress={() => { setModalVisible(false); setSelectedLocalidadInModal(null); }}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>
            {!selectedLocalidadInModal ? (
              <ScrollView style={styles.localidadesList}>
                <Pressable
                  style={[
                    styles.localidadItem,
                    selectedLocalidadId === null && styles.localidadItemActive,
                  ]}
                  onPress={() => {
                    setSelectedLocalidadId(null);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.localidadName}>Todas las localidades</Text>
                </Pressable>
                {localidades.map(localidad => (
                  <Pressable
                    key={`localidad-${localidad.id}`}
                    style={[
                      styles.localidadItem,
                      selectedLocalidadId === localidad.id && styles.localidadItemActive,
                    ]}
                    onPress={() => setSelectedLocalidadInModal(localidad.id)}
                  >
                    <View style={[styles.localidadColor, { backgroundColor: localidad.color }]} />
                    <Text style={styles.localidadName}>{localidad.nombre}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={styles.paraderosList}>
                {paraderosInModal.map(paradero => (
                  <View key={`paradero-${paradero.id}`} style={styles.paraderoItem}>
                    <Text style={styles.paraderoName}>{paradero.nombre}</Text>
                    <Text style={styles.paraderoAddress}>{paradero.direccion}</Text>
                  </View>
                ))}
                <Pressable
                  style={styles.buttonAplicar}
                  onPress={() => {
                    setSelectedLocalidadId(selectedLocalidadInModal);
                    setModalVisible(false);
                    setSelectedLocalidadInModal(null);
                  }}
                >
                  <Text style={styles.buttonAplicarText}>Aplicar selección</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar ruta a destino</Text>
              <Pressable onPress={() => setSearchModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar paradero destino..."
              value={destinationQuery}
              onChangeText={setDestinationQuery}
            />
            <ScrollView style={styles.searchList}>
              {searchParaderos
                .filter(paradero =>
                  paradero.nombre.toLowerCase().includes(destinationQuery.toLowerCase())
                )
                .map(paradero => (
                  <Pressable
                    key={`dest-${paradero.id}`}
                    style={[
                      styles.searchItem,
                      selectedDestination?.id === paradero.id && styles.searchItemActive,
                    ]}
                    onPress={() => setSelectedDestination(paradero)}
                  >
                    <Text style={styles.searchItemText}>{paradero.nombre}</Text>
                    <Text style={styles.searchItemSubtext}>{paradero.direccion}</Text>
                  </Pressable>
                ))}
            </ScrollView>
            <Pressable
              style={[styles.buttonBuscar, !selectedDestination && styles.buttonDisabled]}
              onPress={handleSearchRoute}
              disabled={!selectedDestination}
            >
              <Text style={styles.buttonBuscarText}>Buscar ruta</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  headerOverlay: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A472A', marginBottom: 4 },
  headerSubtitle: { fontSize: 12, color: '#666' },
  buttonLocalidades: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonLocalidadesText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  buttonSearch: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonSearchText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  buttonLocation: {
    position: 'absolute',
    bottom: 136,
    right: 16,
    backgroundColor: '#16A085',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonLocationText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A472A' },
  closeButton: { fontSize: 24, color: '#666' },
  localidadesList: { paddingHorizontal: 12, paddingVertical: 8 },
  localidadItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, marginVertical: 4, borderRadius: 8, backgroundColor: '#F5F5F5' },
  localidadItemActive: { backgroundColor: '#E8F5E9' },
  localidadColor: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  localidadName: { fontSize: 14, fontWeight: '500', color: '#333', flex: 1 },
  paraderosList: { paddingHorizontal: 12, paddingVertical: 8 },
  paraderoItem: { paddingVertical: 8, paddingHorizontal: 12, marginVertical: 4, borderRadius: 8, backgroundColor: '#F0F0F0' },
  paraderoName: { fontSize: 14, fontWeight: '500', color: '#333' },
  paraderoAddress: { fontSize: 12, color: '#666' },
  buttonAplicar: { marginVertical: 10, backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonAplicarText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  searchInput: { marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, fontSize: 16 },
  searchList: { paddingHorizontal: 12, maxHeight: 200 },
  searchItem: { paddingVertical: 12, paddingHorizontal: 12, marginVertical: 4, borderRadius: 8, backgroundColor: '#F5F5F5' },
  searchItemActive: { backgroundColor: '#E3F2FD' },
  searchItemText: { fontSize: 14, fontWeight: '500', color: '#333' },
  searchItemSubtext: { fontSize: 12, color: '#666' },
  buttonBuscar: { marginHorizontal: 20, marginVertical: 10, backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#CCC' },
  buttonBuscarText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  selectedLocalidadInfo: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1A472A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedLocalidadName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  selectedLocalidadClose: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  selectedRouteInfo: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedRouteName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  selectedRouteDetail: { fontSize: 12, color: '#E8F6F3', marginTop: 4 },
  selectedRouteTime: { fontSize: 13, fontWeight: '600', color: '#FFD700', marginTop: 6 },
  selectedRouteClose: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
});
