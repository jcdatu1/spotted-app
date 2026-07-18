import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export const unstable_settings = { initialRouteName: 'profile' };

/** Profile tab stack — trip threads and user profiles push inside it, keeping
 *  the tab bar visible (shared routes in the (home,discover,profile) group). */
export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}
    />
  );
}
