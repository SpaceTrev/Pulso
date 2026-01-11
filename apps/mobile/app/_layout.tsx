import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Register', headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="provably-fair" options={{ title: 'Provably Fair' }} />
        <Stack.Screen name="redemptions" options={{ title: 'Redemption Status' }} />
        <Stack.Screen name="coins" options={{ title: 'Get Coins' }} />
      </Stack>
    </AuthProvider>
  );
}
