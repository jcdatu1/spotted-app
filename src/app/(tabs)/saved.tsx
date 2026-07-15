import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Saved
        </Text>
        <Text className="mt-1 font-sans text-base text-inkMuted">
          Your passport of saved stops and trips will live here (add-reactions-and-saves).
        </Text>
      </View>
    </SafeAreaView>
  );
}
