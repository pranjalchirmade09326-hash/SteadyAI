import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  setTimeout(() => { SplashScreen.hideAsync(); }, 100);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="nutrition" />
        <Stack.Screen name="workouts" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="coach" />
        <Stack.Screen name="member-report" />
      </Stack>
    </AuthProvider>
  );
}
