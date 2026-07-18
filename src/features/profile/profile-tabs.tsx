import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useSavedTrips, useTripEngagement } from '@/data/engagement';
import { useSignedUrls } from '@/data/storage';
import { getTripState } from '@/data/trips';
import { TripCard, tripCardMeta } from '@/features/trips/trip-card';
import { colors } from '@/theme/tokens';

export type ProfileTabOption<K extends string> = { key: K; label: string };

/** Segmented pill row switching the profile's trip lists (Trips/Drafts/Saved
 *  on the owner surface, Trips/Saved on the audience surface). Active pill
 *  matches the Edit-profile secondary style; plain local state, no navigator. */
export function ProfileTabBar<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ProfileTabOption<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <View className="flex-row rounded-full border border-border bg-surfaceSunken p-1">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            className={`flex-1 items-center rounded-full py-2 ${
              selected ? 'border border-borderStrong bg-white' : ''
            }`}>
            <Text className={`font-sans-bold text-sm ${selected ? 'text-ink' : 'text-inkMuted'}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Italic empty-state card shared by the profile tabs. */
export function TabEmptyState({ message }: { message: string }) {
  return (
    <View className="items-center rounded-bubble border border-border bg-surfaceRaised px-6 py-8">
      <Text className="text-center font-display-italic text-base text-inkMuted">{message}</Text>
    </View>
  );
}

/** The Saved tab's list: trips this user saved from other creators, newest
 *  save first, with creator attribution. Mount only while the tab is active —
 *  the query fires on first activation and is cached after. */
export function SavedTripsSection({
  userId,
  emptyMessage,
}: {
  userId: string;
  emptyMessage: string;
}) {
  const router = useRouter();
  const { data: trips, isPending } = useSavedTrips(userId, true);
  const coverPaths = (trips ?? []).flatMap((t) => (t.cover_path ? [t.cover_path] : []));
  const { data: coverUrls } = useSignedUrls('trip-media', coverPaths);
  const { data: engagement } = useTripEngagement((trips ?? []).map((t) => t.id));

  if (isPending) return <ActivityIndicator color={colors.primary} />;
  if (!trips || trips.length === 0) return <TabEmptyState message={emptyMessage} />;

  return (
    <>
      {trips.map((trip, index) => (
        <Pressable
          key={trip.id}
          accessibilityRole="button"
          accessibilityLabel={`Open trip ${trip.title}`}
          onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}>
          <TripCard
            title={trip.title}
            subtitle={`by @${trip.owner.username}`}
            state={getTripState(trip)}
            meta={tripCardMeta(trip)}
            views={engagement?.[trip.id]?.views ?? 0}
            saves={engagement?.[trip.id]?.saves ?? 0}
            coverUrl={trip.cover_path ? coverUrls?.[trip.cover_path] : undefined}
            tintIndex={index}
          />
        </Pressable>
      ))}
    </>
  );
}
