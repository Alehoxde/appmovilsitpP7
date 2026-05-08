// app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      {/* Esta es la pantalla de bienvenida */}
      <Stack.Screen name="index" options={{ title: 'Bienvenida', headerShown: false }} />
      {/* Esta es la nueva pantalla del mapa */}
      <Stack.Screen name="mapa" options={{ title: 'Mapa de Bogotá' }} />
      {/* Esta es una pantalla de modal que veo que ya tienes */}
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Información' }} />
    </Stack>
  );
}