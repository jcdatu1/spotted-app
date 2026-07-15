import { Link } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHealthCheck } from '@/data/health';
import { usePublishedTrips } from '@/data/trips';
import { SpottedWordmark } from '@/features/brand/wordmark';
import { TripCard } from '@/features/trips/trip-card';

function HealthCard() {
  const { data, isPending, refetch } = useHealthCheck();

  let statusLabel: string;
  let dotClass: string;
  let detail: string;
  let detailIsMono = false;

  if (isPending) {
    statusLabel = 'Checking backend…';
    dotClass = 'bg-accent';
    detail = 'Contacting Supabase';
  } else if (data?.ok) {
    statusLabel = 'Backend connected';
    dotClass = 'bg-secondary';
    detail = `${data.latencyMs}MS · STAGING`;
    detailIsMono = true;
  } else {
    statusLabel = 'Backend unreachable';
    dotClass = 'bg-primary';
    detail = data?.reason ?? 'Unknown error';
  }

  return (
    <View
      accessible
      accessibilityLabel={`${statusLabel}. ${detail}`}
      className="rounded-bubble border border-border bg-surfaceRaised p-4">
      <View className="flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <Text className="font-sans-semibold text-base text-ink">{statusLabel}</Text>
      </View>
      <Text
        className={`mt-1 ${detailIsMono ? 'font-mono text-sm' : 'font-sans text-sm'} text-inkMuted`}>
        {detail}
      </Text>
      <Text
        accessibilityRole="button"
        className="mt-3 font-sans-semibold text-sm text-secondary"
        onPress={() => refetch()}>
        Check again
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { data: trips, isPending, refetch, isRefetching } = usePublishedTrips();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <FlatList
        className="flex-1 px-5 pt-4"
        data={trips ?? []}
        keyExtractor={(trip) => trip.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View className="mb-5">
            <SpottedWordmark size={30} />
            <Text className="mt-1 font-display-italic text-base text-inkMuted">
              Follow real trips as they happen.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: '/trip/[id]', params: { id: item.id } }} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open trip ${item.title}`}>
              <TripCard title={item.title} subtitle={`by ${item.owner.display_name}`} />
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          isPending ? null : (
            <View className="mb-4 rounded-xl border border-border bg-surfaceRaised p-4">
              <Text className="font-sans text-sm text-inkMuted">
                No trips published yet — create one from your Profile and be the first.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View className="mb-8 mt-4">
            <HealthCard />
          </View>
        }
      />
    </SafeAreaView>
  );
}
