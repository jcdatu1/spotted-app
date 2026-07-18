import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useTrip } from '@/data/trips';
import { TripThreadScreen } from '@/features/trip-thread/thread-screen';
import { pushedHeader } from '@/theme/navigation';
import { colors } from '@/theme/tokens';

export default function TripRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id);
  const { data: trip, isPending, error } = useTrip(id);

  return (
    <>
      <Stack.Screen options={{ ...pushedHeader, headerTitle: trip?.title ?? '' }} />
      {isPending ? (
        <View className="flex-1 items-center justify-center bg-surface">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !trip || error ? (
        <View className="flex-1 bg-surface px-5 pt-6">
          <View className="rounded-xl border border-border bg-surfaceRaised p-4">
            <Text className="font-sans-semibold text-base text-ink">
              This trip isn&apos;t available
            </Text>
            <Text className="mt-1 font-sans text-sm text-inkMuted">
              It may be a draft, deleted, or the link is wrong.
            </Text>
          </View>
        </View>
      ) : (
        <TripThreadScreen trip={trip} />
      )}
    </>
  );
}
