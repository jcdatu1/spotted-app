import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useProfile } from '@/data/profiles';
import { useSignedUrls } from '@/data/storage';
import { getTripState, usePublishedTripsByOwner } from '@/data/trips';
import { FormError } from '@/features/auth/form';
import { ProfileHeader, ProfileStats } from '@/features/profile/profile-screen';
import { TripCard, tripCardMeta } from '@/features/trips/trip-card';
import { colors } from '@/theme/tokens';

/** Read-only audience view of another user's profile: public identity +
 *  published trips only. The header's action slot stays empty until follows
 *  ship; no owner actions (edit / sign out / create) are offered here. */
export function AudienceProfileScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: profile, isPending, error } = useProfile(userId);
  const { data: trips, isPending: tripsPending } = usePublishedTripsByOwner(userId);
  const coverPaths = (trips ?? []).flatMap((t) => (t.cover_path ? [t.cover_path] : []));
  const { data: coverUrls } = useSignedUrls('trip-media', coverPaths);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 bg-surface px-5 pt-4">
        <FormError
          message={error instanceof Error ? error.message : 'Could not load this profile.'}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface">
      <ProfileHeader profile={profile} action={null} coversStatusBar={false} />
      <ProfileStats followers={0} trips={trips?.length ?? 0} saves={0} />
      <View className="mb-10 mt-5 px-5">
        <Text
          accessibilityRole="header"
          className="mb-3 font-sans-bold text-sm tracking-widest text-inkMuted">
          TRIPS
        </Text>
        {tripsPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : trips && trips.length > 0 ? (
          trips.map((trip, index) => (
            <Pressable
              key={trip.id}
              accessibilityRole="button"
              accessibilityLabel={`Open trip ${trip.title}`}
              onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}>
              <TripCard
                title={trip.title}
                subtitle={trip.description ?? 'No description'}
                state={getTripState(trip)}
                meta={tripCardMeta(trip)}
                coverUrl={trip.cover_path ? coverUrls?.[trip.cover_path] : undefined}
                tintIndex={index}
              />
            </Pressable>
          ))
        ) : (
          <Text className="font-sans text-sm text-inkMuted">No published trips yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}
