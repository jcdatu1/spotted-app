import '../global.css';

import { Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SessionProvider, useSession } from '@/data/auth';
import { initObservability } from '@/lib/observability';
import { pushedHeader } from '@/theme/navigation';
import { colors } from '@/theme/tokens';

initObservability();

// Hold the splash screen until fonts and the initial session restore resolve,
// so returning users never see a flash of the auth flow or fallback type.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { session, isLoading } = useSession();
  const ready = fontsReady && !isLoading;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/new" options={{ ...pushedHeader, headerTitle: 'New trip' }} />
        <Stack.Screen
          name="profile/edit"
          options={{ ...pushedHeader, headerTitle: 'Edit profile' }}
        />
        <Stack.Screen
          name="trip/[id]/edit"
          options={{ ...pushedHeader, headerTitle: 'Edit trip' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator fontsReady={fontsLoaded} />
      </SessionProvider>
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
