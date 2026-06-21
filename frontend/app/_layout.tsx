import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import { useStoredAuth } from '../hooks/useStoredAuth';
import { useAuthStore } from '../store/auth.store';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { useNotifications } from '../hooks/useNotifications';
import {
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
} from '@expo-google-fonts/tajawal';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { NetworkAlert } from '../components/NetworkAlert';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.text.white} />
      </View>
    );
  }

  return (
    <>
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
      <NetworkAlert />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.text.white} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <RootLayoutNav />
        </SafeAreaView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}