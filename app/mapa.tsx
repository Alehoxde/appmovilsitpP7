import { Platform } from 'react-native';
import MapaNative from './mapa.native';
import MapaWeb from './mapa.web';

const MapaScreen = Platform.OS === 'web' ? MapaWeb : MapaNative;

export default MapaScreen;
