import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useTripEngagement } from '@/data/engagement';
import {
  useFollow,
  useFollowerCount,
  useFollowingCount,
  useIsFollowing,
  useUnfollow,
} from '@/data/follows';
import { useProfile } from '@/data/profiles';
import { useSignedUrls } from '@/data/storage';
import { getTripState, usePublishedTripsByOwner } from '@/data/trips';
import { FormError } from '@/features/auth/form';
import { ProfileHeader, ProfileStats } from '@/features/profile/profile-screen';
import { ProfileTabBar, SavedTripsSection, TabEmptyState } from '@/features/profile/profile-tabs';
import { TripCard, tripCardMeta } from '@/features/trips/trip-card';
import { colors } from '@/theme/tokens';

const AUDIENCE_TABS = [
  { key: 'trips', label: 'Trips' },
  { key: 'saved', label: 'Saved' },
] as const;

type AudienceTabKey = (typeof AUDIENCE_TABS)[number]['key'];

/** Follow (coral primary) / Unfollow (secondary, matching Edit profile).
 *  Renders nothing while the follow state loads — the slot stays empty
 *  rather than flashing the wrong button. */
function FollowButton({
  userId,
  onError,
}: {
  userId: string;
  onError: (message: string | null) => void;
}) {
  const { data: following, isPending } = useIsFollowing(userId);
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();
  const busy = followMutation.isPending || unfollowMutation.isPending;

  if (isPending) return null;

  const toggle = () => {
    const mutation = following ? unfollowMutation : followMutation;
    mutation.mutate(userId, {
      onSuccess: () => onError(null),
      onError: (error) => onError(error.message),
    });
  };

  return following ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Unfollow"
      disabled={busy}
      onPress={toggle}
      className="rounded-full border border-borderStrong bg-surfaceRaised px-5 py-2">
      <Text className="font-sans-bold text-sm text-ink">Unfollow</Text>
    </Pressable>
  ) : (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Follow"
      disabled={busy}
      onPress={toggle}
      className="rounded-full bg-primary px-5 py-2">
      <Text className="font-sans-bold text-sm text-white">Follow</Text>
    </Pressable>
  );
}

/** Read-only audience view of another user's profile: public identity +
 *  published trips only. The header's action slot holds Follow/Unfollow;
 *  no owner actions (edit / sign out / create) are offered here. */
export function AudienceProfileScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: profile, isPending, error } = useProfile(userId);
  const { data: trips, isPending: tripsPending } = usePublishedTripsByOwner(userId);
  const { data: followerCount } = useFollowerCount(userId);
  const { data: followingCount } = useFollowingCount(userId);
  const [followError, setFollowError] = useState<string | null>(null);
  const [tab, setTab] = useState<AudienceTabKey>('trips');
  const coverPaths = (trips ?? []).flatMap((t) => (t.cover_path ? [t.cover_path] : []));
  const { data: coverUrls } = useSignedUrls('trip-media', coverPaths);
  const { data: engagement } = useTripEngagement((trips ?? []).map((t) => t.id));
  const savesTotal = (trips ?? []).reduce((sum, t) => sum + (engagement?.[t.id]?.saves ?? 0), 0);

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
      <ProfileHeader
        profile={profile}
        action={<FollowButton userId={userId} onError={setFollowError} />}
        coversStatusBar={false}
      />
      {followError ? (
        <View className="mt-3 px-5">
          <FormError message={followError} />
        </View>
      ) : null}
      <ProfileStats
        followers={followerCount ?? 0}
        following={followingCount ?? 0}
        trips={trips?.length ?? 0}
        saves={savesTotal}
      />
      <View className="mb-10 mt-5 px-5">
        <ProfileTabBar tabs={[...AUDIENCE_TABS]} active={tab} onChange={setTab} />
        <View className="mt-4">
          {tab === 'trips' ? (
            tripsPending ? (
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
                    views={engagement?.[trip.id]?.views ?? 0}
                    saves={engagement?.[trip.id]?.saves ?? 0}
                    coverUrl={trip.cover_path ? coverUrls?.[trip.cover_path] : undefined}
                    tintIndex={index}
                  />
                </Pressable>
              ))
            ) : (
              <TabEmptyState message="No published trips yet." />
            )
          ) : (
            <SavedTripsSection userId={userId} emptyMessage="No saved trips yet." />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
