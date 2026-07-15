import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpottedWordmark } from '@/features/brand/wordmark';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 justify-between px-6 pb-8 pt-16">
        <View className="items-center pt-16">
          <SpottedWordmark size={56} />
          <Text className="mt-4 text-center font-display-italic text-lg text-inkMuted">
            The living travel journal — follow real trips as they happen.
          </Text>
        </View>

        <View>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create account"
              className="items-center rounded-full bg-primary px-6 py-3">
              <Text className="font-sans-semibold text-base text-white">Create account</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              className="mt-3 items-center rounded-full border border-borderStrong bg-surfaceRaised px-6 py-3">
              <Text className="font-sans-semibold text-base text-ink">
                I already have an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
