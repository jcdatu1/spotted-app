import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Profile
        </Text>
        <Text className="mt-1 font-sans text-base text-inkMuted">
          Sign-in and your trips as boarding-pass cards arrive with add-auth-and-profiles.
        </Text>
      </View>
    </SafeAreaView>
  );
}
