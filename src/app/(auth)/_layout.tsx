import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        // Pushed screens always show a visible back button (project convention),
        // chevron-only — no back title text.
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.surface },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
