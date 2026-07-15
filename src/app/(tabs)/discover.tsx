import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Discover
        </Text>
        <Text className="mt-1 font-sans text-base text-inkMuted">
          Trips and creators worth following will live here (add-follows-and-discovery).
        </Text>
      </View>
    </SafeAreaView>
  );
}
