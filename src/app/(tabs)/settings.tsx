import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/data/auth';

/** First real settings content — the section heading + row card pattern here
 *  is the template for future sections (stays local until a second one exists). */
export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Settings
        </Text>
        <Text
          accessibilityRole="header"
          className="mb-3 mt-6 font-sans-bold text-sm tracking-widest text-inkMuted">
          ACCOUNT MANAGEMENT
        </Text>
        <View className="overflow-hidden rounded-bubble border border-border bg-surfaceRaised">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => signOut()}
            className="px-4 py-3.5">
            <Text className="font-sans-semibold text-base text-primary">Sign out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
