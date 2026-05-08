// app/index.tsx
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  const handleIngresar = () => {
    router.push('/mapa');
  };

  return (
    <View style={styles.container}>
      {/* Fondo personalizable - Cambia el color de gradientoBg aquí */}
      <View style={[styles.backgroundGradient, { backgroundColor: '#1A472A' }]} />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Título */}
        <Text style={styles.welcomeTitle}>¡Bienvenido a SITP Bogotá!</Text>
        <Text style={styles.welcomeSubtitle}>
          Explora las localidades y rutas de transporte de Bogotá
        </Text>

        {/* Botón Ingresar */}
        <Pressable style={styles.buttonIngresar} onPress={handleIngresar}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Sistema Integrado de Transporte Público</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonIngresar: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    zIndex: 1,
  },
  footerText: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
  },
});