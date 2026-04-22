import { ImageBackground, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Imagen remota (cambia la URL por la que necesites)
const imagenMapa = { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mapa-de-Bogot%C3%A1-1980.jpg/960px-Mapa-de-Bogot%C3%A1-1980.jpg' };

export default function HomeScreen() {
  return (
    <ImageBackground
      source={imagenMapa}
      style={styles.fondo}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.tituloApp}>MiApp Bogotá</Text>
        <Text style={styles.bienvenido}>Bienvenido</Text>
        <TouchableOpacity style={styles.boton} onPress={() => alert('Ingresar presionado')}>
          <Text style={styles.textoBoton}>Ingresar</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// Los estilos quedan igual que antes...
const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 20,
  },
  tituloApp: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  bienvenido: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  boton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});