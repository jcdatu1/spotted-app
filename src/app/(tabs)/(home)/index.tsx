import { Link } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { profileMediaUrl } from '@/data/profiles';
import { useSignedUrls } from '@/data/storage';
import { getTripState, usePublishedTrips } from '@/data/trips';
import { SpottedWordmark } from '@/features/brand/wordmark';
import { FeedTripCard, tripCardMeta } from '@/features/trips/trip-card';
import { tripDayCount } from '@/lib/dates';

export default function HomeScreen() {
  const { data: trips, isPending, refetch, isRefetching } = usePublishedTrips();
  const coverPaths = (trips ?? []).flatMap((t) => (t.cover_path ? [t.cover_path] : []));
  const { data: coverUrls } = useSignedUrls('trip-media', coverPaths);

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
        renderItem={({ item, index }) => (
          <Link href={{ pathname: '/trip/[id]', params: { id: item.id } }} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open trip ${item.title}`}>
              <FeedTripCard
                title={item.title}
                meta={tripCardMeta(item)}
                creatorName={item.owner.display_name}
                creatorUsername={item.owner.username}
                avatarUrl={profileMediaUrl(item.owner.avatar_path) ?? undefined}
                state={getTripState(item)}
                stops={item.stops}
                days={
                  item.start_date && item.end_date
                    ? tripDayCount(item.start_date, item.end_date)
                    : undefined
                }
                coverUrl={item.cover_path ? coverUrls?.[item.cover_path] : undefined}
                tintIndex={index}
              />
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
      />
    </SafeAreaView>
  );
}
