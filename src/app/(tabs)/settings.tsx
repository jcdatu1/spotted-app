import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Settings
        </Text>
        <Text className="mt-1 font-sans text-base text-inkMuted">
          Account and app settings will live here — functionality to follow.
        </Text>
      </View>
    </SafeAreaView>
  );
}
