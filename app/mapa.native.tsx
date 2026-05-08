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

type Coordenada = {
  latitude: number;
  longitude: number;
};

type ParaderoEnRuta = {
  paradero: Paradero;
  onRouteDistanceKm: number;
  distToRouteKm: number;
};

type RutaVial = {
  coordinates: Coordenada[];
  distance: number;
  duration: number;
};

type PlanSITP = {
  route: Ruta;
  board: Paradero;
  alight: Paradero;
  stops: Paradero[];
  busSegment: Coordenada[];
  walkToBoardMeters: number;
  walkToDestinationMeters: number;
  busDistanceMeters: number;
  totalDistanceMeters: number;
  estimatedTimeMinutes: number;
  arrivalTime: string;
  score: number;
};

const WALKING_METERS_PER_MINUTE = 75;
const BUS_METERS_PER_MINUTE = 280;
const WAITING_TIME_MINUTES = 4;
const CANDIDATES_PER_ROUTE = 5;
const MAX_STOPS_TO_MARK = 25;

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const getArrivalTimeFromMinutes = (minutes: number) => {
  const arrival = new Date(Date.now() + minutes * 60000);
  return `${arrival.getHours().toString().padStart(2, '0')}:${arrival.getMinutes().toString().padStart(2, '0')}`;
};

const getDistanceMeters = (a: Coordenada, b: Coordenada) => {
  return turf.distance(
    turf.point([a.longitude, a.latitude]),
    turf.point([b.longitude, b.latitude]),
    { units: 'kilometers' }
  ) * 1000;
};

const getPathDistanceMeters = (coords: Coordenada[]) => {
  if (coords.length < 2) return 0;

  return turf.length(
    turf.lineString(coords.map(coord => [coord.longitude, coord.latitude])),
    { units: 'kilometers' }
  ) * 1000;
};

const getClosestRouteCoordIndex = (coords: Coordenada[], point: Coordenada) => {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  coords.forEach((coord, index) => {
    const distance = getDistanceMeters(coord, point);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const getRouteSegmentBetweenStops = (route: Ruta, board: Paradero, alight: Paradero) => {
  const startIndex = getClosestRouteCoordIndex(route.coords, board.latlng);
  const endIndex = getClosestRouteCoordIndex(route.coords, alight.latlng);
  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);
  const segment = route.coords.slice(from, to + 1);

  if (segment.length >= 2) return segment;

  return [board.latlng, alight.latlng];
};

// Ruta vial normal con OSRM. Se usa para dibujar los tramos a pie por calles.
const getRutaVialOSRM = async (origen: Coordenada, destino: Coordenada): Promise<RutaVial | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origen.longitude},${origen.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes?.[0]) {
      const route = data.routes[0];

      return {
        coordinates: route.geometry.coordinates.map((coordinate: [number, number]) => ({
          latitude: coordinate[1],
          longitude: coordinate[0],
        })),
        distance: route.distance,
        duration: route.duration,
      };
    }

    return null;
  } catch (error) {
    console.error('Error al conectar con OSRM:', error);
    return null;
  }
};

export default function MapaScreen() {
  const [selectedLocalidadId, setSelectedLocalidadId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Paradero | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocalidadInModal, setSelectedLocalidadInModal] = useState<number | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [sitpPlan, setSitpPlan] = useState<PlanSITP | null>(null);
  const [walkToBoardSegment, setWalkToBoardSegment] = useState<Coordenada[]>([]);
  const [busSegment, setBusSegment] = useState<Coordenada[]>([]);
  const [walkToDestinationSegment, setWalkToDestinationSegment] = useState<Coordenada[]>([]);

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
    () => selectedLocalidad ? paraderos.filter(paradero => paradero.localidad === selectedLocalidad.id) : [],
    [selectedLocalidad]
  );

  const regionLocalidad = useMemo(() => {
    if (!selectedLocalidad) return regionBogota;

    const latitudes = selectedLocalidad.coords.map(coord => coord.latitude);
    const longitudes = selectedLocalidad.coords.map(coord => coord.longitude);

    return {
      latitude: latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length,
      longitude: longitudes.reduce((sum, value) => sum + value, 0) / longitudes.length,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [selectedLocalidad, regionBogota]);

  const searchParaderos = useMemo(
    () => (selectedLocalidad ? paraderosFiltrados : paraderos),
    [selectedLocalidad, paraderosFiltrados]
  );

  const routeStopIds = useMemo(
    () => new Set((sitpPlan?.stops ?? []).map(stop => stop.id)),
    [sitpPlan]
  );

  const paraderosVisibles = useMemo(
    () => paraderosFiltrados.filter(paradero => !routeStopIds.has(paradero.id)),
    [paraderosFiltrados, routeStopIds]
  );

  useEffect(() => {
    if (selectedLocalidad && mapRef.current) {
      mapRef.current.animateToRegion(regionLocalidad, 600);
    }
  }, [selectedLocalidad, regionLocalidad]);

  useEffect(() => {
    handleLocateUser(false);
  }, []);

  const handleLocateUser = async (showErrorAlert = true) => {
    try {
      setIsLocating(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (showErrorAlert) {
          Alert.alert('Permiso denegado', 'Activa el permiso de ubicación para localizarte en el mapa.');
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation(location);

      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        700
      );
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      if (showErrorAlert) {
        Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
      }
    } finally {
      setIsLocating(false);
    }
  };

  const getRouteStops = (route: Ruta): ParaderoEnRuta[] => {
    if (route.coords.length < 2) return [];

    const line = turf.lineString(route.coords.map(coord => [coord.longitude, coord.latitude]));
    const startPoint = turf.point([route.coords[0].longitude, route.coords[0].latitude]);

    return paraderos
      .map(paradero => {
        const stopPoint = turf.point([paradero.latlng.longitude, paradero.latlng.latitude]);
        const nearestOnRoute = turf.nearestPointOnLine(line, stopPoint);
        const onRouteDistanceKm = turf.distance(startPoint, nearestOnRoute, { units: 'kilometers' });
        const distToRouteKm = turf.distance(stopPoint, nearestOnRoute, { units: 'kilometers' });

        return { paradero, onRouteDistanceKm, distToRouteKm };
      })
      .sort((a, b) => a.onRouteDistanceKm - b.onRouteDistanceKm);
  };

  const getBestStopForPoint = (
    stopsOnRoute: ParaderoEnRuta[],
    point: Coordenada,
    excludeStopId?: number
  ) => {
    return stopsOnRoute
      .filter(stop => stop.paradero.id !== excludeStopId)
      .map(stop => {
        const distanceToPointMeters = getDistanceMeters(point, stop.paradero.latlng);
        const distanceToRouteMeters = stop.distToRouteKm * 1000;

        return {
          ...stop,
          distanceToPointMeters,
          // No bloquea por distancia: solo ayuda a escoger el paradero que tenga más sentido para esa ruta.
          score: distanceToPointMeters + distanceToRouteMeters * 2,
        };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, CANDIDATES_PER_ROUTE);
  };

  const getStopsBetween = (
    stopsOnRoute: ParaderoEnRuta[],
    board: Paradero,
    alight: Paradero
  ) => {
    const boardStop = stopsOnRoute.find(stop => stop.paradero.id === board.id);
    const alightStop = stopsOnRoute.find(stop => stop.paradero.id === alight.id);

    if (!boardStop || !alightStop) return [];

    const from = Math.min(boardStop.onRouteDistanceKm, alightStop.onRouteDistanceKm);
    const to = Math.max(boardStop.onRouteDistanceKm, alightStop.onRouteDistanceKm);

    return stopsOnRoute
      .filter(stop => stop.onRouteDistanceKm >= from && stop.onRouteDistanceKm <= to)
      .sort((a, b) => a.distToRouteKm - b.distToRouteKm)
      .slice(0, MAX_STOPS_TO_MARK)
      .sort((a, b) => a.onRouteDistanceKm - b.onRouteDistanceKm)
      .map(stop => stop.paradero);
  };

  const calculateBestSITPRoute = (origin: Coordenada, destination: Coordenada): PlanSITP | null => {
    const options: PlanSITP[] = [];

    rutas.forEach(route => {
      if (route.coords.length < 2) return;

      const stopsOnRoute = getRouteStops(route);
      if (stopsOnRoute.length < 2) return;

      const boardingCandidates = getBestStopForPoint(stopsOnRoute, origin);
      const alightingCandidates = getBestStopForPoint(stopsOnRoute, destination);

      boardingCandidates.forEach(boardingCandidate => {
        alightingCandidates.forEach(alightingCandidate => {
          if (boardingCandidate.paradero.id === alightingCandidate.paradero.id) return;

          const busSegment = getRouteSegmentBetweenStops(
            route,
            boardingCandidate.paradero,
            alightingCandidate.paradero
          );

          const stops = getStopsBetween(
            stopsOnRoute,
            boardingCandidate.paradero,
            alightingCandidate.paradero
          );

          const walkToBoardMeters = getDistanceMeters(origin, boardingCandidate.paradero.latlng);
          const walkToDestinationMeters = getDistanceMeters(destination, alightingCandidate.paradero.latlng);
          const busDistanceMeters = getPathDistanceMeters(busSegment);
          const totalDistanceMeters = walkToBoardMeters + busDistanceMeters + walkToDestinationMeters;

          const estimatedTimeMinutes = Math.max(
            1,
            Math.round(
              walkToBoardMeters / WALKING_METERS_PER_MINUTE +
              busDistanceMeters / BUS_METERS_PER_MINUTE +
              walkToDestinationMeters / WALKING_METERS_PER_MINUTE +
              WAITING_TIME_MINUTES
            )
          );

          const score =
            estimatedTimeMinutes +
            walkToBoardMeters / 150 +
            walkToDestinationMeters / 150 +
            boardingCandidate.distToRouteKm * 5 +
            alightingCandidate.distToRouteKm * 5;

          options.push({
            route,
            board: boardingCandidate.paradero,
            alight: alightingCandidate.paradero,
            stops,
            busSegment,
            walkToBoardMeters,
            walkToDestinationMeters,
            busDistanceMeters,
            totalDistanceMeters,
            estimatedTimeMinutes,
            arrivalTime: getArrivalTimeFromMinutes(estimatedTimeMinutes),
            score,
          });
        });
      });
    });

    return options.sort((a, b) => a.score - b.score)[0] ?? null;
  };

  const applySITPPlan = async (plan: PlanSITP, origin: Coordenada, destination: Coordenada) => {
    const [walkToBoardRoute, walkToDestinationRoute] = await Promise.all([
      getRutaVialOSRM(origin, plan.board.latlng),
      getRutaVialOSRM(plan.alight.latlng, destination),
    ]);

    const walkToBoardCoordinates = walkToBoardRoute?.coordinates ?? [origin, plan.board.latlng];
    const walkToDestinationCoordinates = walkToDestinationRoute?.coordinates ?? [plan.alight.latlng, destination];

    const walkToBoardMeters = walkToBoardRoute?.distance ?? plan.walkToBoardMeters;
    const walkToDestinationMeters = walkToDestinationRoute?.distance ?? plan.walkToDestinationMeters;
    const totalDistanceMeters = walkToBoardMeters + plan.busDistanceMeters + walkToDestinationMeters;

    const estimatedTimeMinutes = Math.max(
      1,
      Math.round(
        walkToBoardMeters / WALKING_METERS_PER_MINUTE +
        plan.busDistanceMeters / BUS_METERS_PER_MINUTE +
        walkToDestinationMeters / WALKING_METERS_PER_MINUTE +
        WAITING_TIME_MINUTES
      )
    );

    const finalPlan: PlanSITP = {
      ...plan,
      walkToBoardMeters,
      walkToDestinationMeters,
      totalDistanceMeters,
      estimatedTimeMinutes,
      arrivalTime: getArrivalTimeFromMinutes(estimatedTimeMinutes),
    };

    setSitpPlan(finalPlan);
    setWalkToBoardSegment(walkToBoardCoordinates);
    setBusSegment(finalPlan.busSegment);
    setWalkToDestinationSegment(walkToDestinationCoordinates);

    const allCoordinates = [
      ...walkToBoardCoordinates,
      ...finalPlan.busSegment,
      ...walkToDestinationCoordinates,
    ];

    mapRef.current?.fitToCoordinates(allCoordinates, {
      edgePadding: {
        top: 130,
        right: 60,
        bottom: 160,
        left: 60,
      },
      animated: true,
    });
  };

  const handleSearchRoute = async () => {
    if (!currentLocation) {
      Alert.alert('Ubicación requerida', 'Primero presiona el botón Localizarme.');
      return;
    }

    if (!selectedDestination) {
      Alert.alert('Destino requerido', 'Selecciona un destino.');
      return;
    }

    setIsLoadingRoute(true);

    const origin = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };

    const destination = selectedDestination.latlng;
    const plan = calculateBestSITPRoute(origin, destination);

    if (plan) {
      await applySITPPlan(plan, origin, destination);
      setSearchModalVisible(false);
    } else {
      Alert.alert('Ruta no encontrada', 'No se pudo calcular una ruta SITP con los datos actuales.');
    }

    setIsLoadingRoute(false);
  };

  const resetMap = () => {
    setSelectedDestination(null);
    setSitpPlan(null);
    setWalkToBoardSegment([]);
    setBusSegment([]);
    setWalkToDestinationSegment([]);
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={regionBogota}>
        {selectedLocalidad && (
          <Polygon
            coordinates={selectedLocalidad.coords}
            strokeColor={selectedLocalidad.color}
            fillColor={`${selectedLocalidad.color}33`}
            strokeWidth={3}
          />
        )}

        {/* Tramo a pie: ubicación actual -> paradero donde subes */}
        {walkToBoardSegment.length > 0 && (
          <Polyline
            coordinates={walkToBoardSegment}
            strokeColor="#2ECC71"
            strokeWidth={4}
            lineDashPattern={[8, 8]}
          />
        )}

        {/* Tramo SITP: paradero donde subes -> paradero donde bajas */}
        {busSegment.length > 0 && sitpPlan && (
          <Polyline
            coordinates={busSegment}
            strokeColor={sitpPlan.route.color ?? '#2196F3'}
            strokeWidth={6}
          />
        )}

        {/* Tramo a pie: paradero donde bajas -> destino */}
        {walkToDestinationSegment.length > 0 && sitpPlan && sitpPlan.walkToDestinationMeters > 5 && (
          <Polyline
            coordinates={walkToDestinationSegment}
            strokeColor="#2ECC71"
            strokeWidth={4}
            lineDashPattern={[8, 8]}
          />
        )}

        {/* Marcadores principales */}
        {currentLocation && (
          <Marker coordinate={currentLocation.coords} title="Tu ubicación" pinColor="green" />
        )}

        {selectedDestination && (
          <Marker coordinate={selectedDestination.latlng} title="Destino" description={selectedDestination.nombre} pinColor="red" />
        )}

        {sitpPlan && (
          <>
            <Marker
              coordinate={sitpPlan.board.latlng}
              title="Sube aquí"
              description={`${sitpPlan.board.nombre} · SITP ${sitpPlan.route.id}`}
              pinColor="#F39C12"
            />
            <Marker
              coordinate={sitpPlan.alight.latlng}
              title="Baja aquí"
              description={`${sitpPlan.alight.nombre} · SITP ${sitpPlan.route.id}`}
              pinColor="#9B59B6"
            />
          </>
        )}

        {/* Paraderos sugeridos en el tramo de la ruta */}
        {sitpPlan?.stops
          .filter(stop => stop.id !== sitpPlan.board.id && stop.id !== sitpPlan.alight.id)
          .map((stop, index) => (
            <Marker
              key={`route-stop-${stop.id}`}
              coordinate={stop.latlng}
              title={`Paradero ${index + 1} de la ruta`}
              description={stop.nombre}
              pinColor="#34495E"
            />
          ))}

        {/* Paraderos de la localidad seleccionada */}
        {paraderosVisibles.map(p => (
          <Marker key={`p-${p.id}`} coordinate={p.latlng} title={p.nombre} pinColor="#007AFF" />
        ))}
      </MapView>

      {/* Info del SITP recomendado */}
      {sitpPlan && selectedDestination && (
        <View style={styles.selectedRouteInfo}>
          <View style={styles.selectedRouteHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedRouteName}>SITP {sitpPlan.route.id} - {sitpPlan.route.nombre}</Text>
              <Text style={styles.selectedRouteDetail}>Sube en: {sitpPlan.board.nombre}</Text>
              <Text style={styles.selectedRouteDetail}>Baja en: {sitpPlan.alight.nombre}</Text>
              <Text style={styles.selectedRouteDetail}>Destino: {selectedDestination.nombre}</Text>
            </View>
            <Pressable onPress={resetMap}>
              <Text style={styles.selectedRouteClose}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.routeMetricsRow}>
            <Text style={styles.selectedRouteTime}>⏱️ {sitpPlan.estimatedTimeMinutes} min</Text>
            <Text style={styles.selectedRouteTime}>📏 {formatDistance(sitpPlan.totalDistanceMeters)}</Text>
            <Text style={styles.selectedRouteTime}>Llegada {sitpPlan.arrivalTime}</Text>
          </View>

          <Text style={styles.selectedRouteDetail}>
            🚶 A pie: {formatDistance(sitpPlan.walkToBoardMeters + sitpPlan.walkToDestinationMeters)} · 🚌 SITP: {formatDistance(sitpPlan.busDistanceMeters)}
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.floatingButtons}>
        <Pressable
          style={[styles.buttonAction, styles.buttonLocate, isLocating && styles.buttonDisabled]}
          onPress={() => handleLocateUser(true)}
          disabled={isLocating}
        >
          <Text style={styles.buttonText}>{isLocating ? 'Localizando...' : 'Localizarme'}</Text>
        </Pressable>

        <Pressable style={styles.buttonAction} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>Localidades</Text>
        </Pressable>

        <Pressable
          style={[styles.buttonAction, styles.buttonSearch, isLoadingRoute && styles.buttonDisabled]}
          onPress={() => setSearchModalVisible(true)}
          disabled={isLoadingRoute}
        >
          <Text style={styles.buttonText}>{isLoadingRoute ? 'Calculando...' : 'Buscar SITP'}</Text>
        </Pressable>
      </View>

      {/* Modal de Búsqueda */}
      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿A dónde vas?</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar destino..."
              value={destinationQuery}
              onChangeText={setDestinationQuery}
            />
            <ScrollView style={{ maxHeight: 300 }}>
              {searchParaderos
                .filter(p => p.nombre.toLowerCase().includes(destinationQuery.toLowerCase()))
                .map(p => (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.searchItem,
                      selectedDestination?.id === p.id && { backgroundColor: '#E3F2FD' },
                    ]}
                    onPress={() => setSelectedDestination(p)}
                  >
                    <Text>{p.nombre}</Text>
                  </Pressable>
                ))}
            </ScrollView>
            <Pressable
              style={[styles.buttonBuscar, (!selectedDestination || isLoadingRoute) && { backgroundColor: '#CCC' }]}
              onPress={handleSearchRoute}
              disabled={!selectedDestination || isLoadingRoute}
            >
              <Text style={styles.buttonBuscarText}>{isLoadingRoute ? 'Calculando SITP...' : 'Calcular SITP recomendado'}</Text>
            </Pressable>
            <Pressable onPress={() => setSearchModalVisible(false)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: 'red' }}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Localidades */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona Localidad</Text>
            <ScrollView>
              {localidades.map(l => (
                <Pressable
                  key={l.id}
                  style={[
                    styles.searchItem,
                    selectedLocalidadInModal === l.id && { backgroundColor: '#E8F5E9' },
                  ]}
                  onPress={() => {
                    setSelectedLocalidadInModal(l.id);
                    setSelectedLocalidadId(l.id);
                    setModalVisible(false);
                  }}
                >
                  <Text>{l.nombre}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setModalVisible(false)} style={{ padding: 10 }}>
              <Text>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    gap: 10,
  },
  buttonAction: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
    alignItems: 'center',
  },
  buttonLocate: {
    backgroundColor: '#FF9800',
  },
  buttonSearch: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedRouteInfo: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 12,
    elevation: 10,
  },
  selectedRouteHeader: {
    flexDirection: 'row',
  },
  selectedRouteName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  selectedRouteTime: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  selectedRouteDetail: {
    color: 'white',
    fontSize: 12,
    marginTop: 3,
  },
  selectedRouteClose: {
    color: 'white',
    fontSize: 20,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  searchItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  buttonBuscar: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonBuscarText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
