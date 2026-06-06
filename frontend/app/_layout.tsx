import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nManager } from 'react-native';
import { useStoredAuth } from '../hooks/useStoredAuth';
import { useAuthStore } from '../store/auth.store';

I18nManager.forceRTL(true);

const queryClient = new QueryClient();

function RootLayoutNav() {
  useStoredAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" redirect={isAuthenticated} />
      <Stack.Screen name="(tabs)" redirect={!isAuthenticated} />
      <Stack.Screen name="exam/[id]" />
      <Stack.Screen name="exam/report" />
      <Stack.Screen name="result/[sessionId]" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/password" />
      <Stack.Screen name="profile/subscription" />
      <Stack.Screen name="profile/privacy" />
      <Stack.Screen name="profile/support" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <RootLayoutNav />
    </QueryClientProvider>
  );
}