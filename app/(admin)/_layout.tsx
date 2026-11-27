import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../../hooks/useAuth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="citizen" />
        <Stack.Screen name="gps" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </AuthProvider>
  );
}
