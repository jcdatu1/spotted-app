import { colors, fontFamily } from '@/theme/tokens';

/** Pushed (non-root) screens show the native themed header — the app's
 *  visible-back-button convention. Chevron-only: without a back title, iOS
 *  would fall back to the previous route's name ("(tabs)"). Shared by the
 *  root stack and the per-tab stacks; screens inside the tab groups apply it
 *  inline via `<Stack.Screen options>` so options survive route moves. */
export const pushedHeader = {
  headerShown: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fontFamily.sansSemibold },
  headerBackButtonDisplayMode: 'minimal',
} as const;
