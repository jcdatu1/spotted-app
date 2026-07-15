import { Stack } from 'expo-router';

import { colors, fontFamily } from '@/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        // Pushed screens always show a visible back button (project convention).
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerBackTitleStyle: { fontFamily: fontFamily.sans },
        contentStyle: { backgroundColor: colors.surface },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
