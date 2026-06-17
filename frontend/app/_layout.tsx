import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import { useStoredAuth } from '../hooks/useStoredAuth';
import { useAuthStore } from '../store/auth.store';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { useNotifications } from '../hooks/useNotifications';

I18nManager.forceRTL(true);

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading } = useStoredAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useNotifications();

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    }

    if (!__DEV__) {
      checkForUpdates();
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D4ED8' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

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