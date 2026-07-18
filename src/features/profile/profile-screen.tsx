import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TripEngagement } from '@/data/engagement';
import { useTripEngagement } from '@/data/engagement';
import { useFollowerCount } from '@/data/follows';
import type { Profile } from '@/data/profiles';
import { profileMediaUrl, useMyProfile } from '@/data/profiles';
import { useSignedUrls } from '@/data/storage';
import type { TripWithStops } from '@/data/trips';
import { getTripState, useMyTrips } from '@/data/trips';
import { FormError } from '@/features/auth/form';
import { TripCard, tripCardMeta } from '@/features/trips/trip-card';
import { colors } from '@/theme/tokens';

const AVATAR_SIZE = 88;

/** Cover band (photo when set, teal when not) + overlapping avatar + identity
 *  block. `action` is the surface's header action (owner: Edit profile;
 *  audience: Follow/Unfollow). `coversStatusBar` extends the band under
 *  the status bar — false on pushed screens whose native header already
 *  clears it (audience profile, self-view via /user/[id]). */
export function ProfileHeader({
  profile,
  action,
  coversStatusBar = true,
}: {
  profile: Profile;
  action: ReactNode;
  coversStatusBar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bandHeight = 84 + (coversStatusBar ? insets.top : 0);
  const initial = profile.display_name.trim().charAt(0).toUpperCase() || '@';
  const coverUrl = profileMediaUrl(profile.cover_path);
  const avatarUrl = profileMediaUrl(profile.avatar_path);

  return (
    <View>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={{ height: bandHeight }} contentFit="cover" />
      ) : (
        <View className="bg-secondary" style={{ height: bandHeight }} />
      )}
      <View className="px-5" style={{ marginTop: -AVATAR_SIZE / 2 }}>
        <View
          className="items-center justify-center overflow-hidden border-4 border-surface bg-primary"
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text className="font-display text-3xl text-inkInverse">{initial}</Text>
          )}
        </View>
        <View className="mt-2.5 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-display text-2xl text-ink">
              {profile.display_name}
            </Text>
            <Text className="mt-0.5 font-mono text-sm text-inkMuted">@{profile.username}</Text>
          </View>
          {action}
        </View>
        {profile.bio ? (
          <Text className="mt-3 font-sans text-base text-ink">{profile.bio}</Text>
        ) : null}
      </View>
    </View>
  );
}

function Stat({ value, label, valueClass }: { value: number; label: string; valueClass?: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5">
      <Text className={`font-mono-bold text-lg ${valueClass ?? 'text-ink'}`}>{value}</Text>
      <Text className="font-sans text-xs text-inkMuted">{label}</Text>
    </View>
  );
}

/** All three are real counts: followers from the follows edge, saves summed
 *  across the user's trips (trip-engagement), trips from the list length. */
export function ProfileStats({
  followers,
  trips,
  saves,
}: {
  followers: number;
  trips: number;
  saves: number;
}) {
  return (
    <View className="mx-5 mt-4 flex-row gap-6 border-y border-border py-3.5">
      <Stat value={followers} label="followers" />
      <Stat value={trips} label="trips" />
      <Stat value={saves} label="saves" valueClass="text-secondary" />
    </View>
  );
}

/** Create-trip CTA leading the trip list — the profile's one coral action. */
function StartTripCard() {
  return (
    <Link href="/trip/new" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start a new trip"
        className="mb-3 items-center rounded-bubble border border-primary bg-primaryFaint px-6 py-3"
        style={{ borderStyle: 'dashed' }}>
        <Text className="font-display text-xl text-primary">+</Text>
        <Text className="text-center font-display-italic text-base text-ink">Where to next?</Text>
        <Text className="text-center font-sans text-sm text-inkMuted">Start a new journal</Text>
      </Pressable>
    </Link>
  );
}

function ProfileTripsSection({
  trips,
  isPending,
  engagement,
}: {
  trips: TripWithStops[] | undefined;
  isPending: boolean;
  engagement: Record<string, TripEngagement> | undefined;
}) {
  const coverPaths = (trips ?? []).flatMap((t) => (t.cover_path ? [t.cover_path] : []));
  const { data: coverUrls } = useSignedUrls('trip-media', coverPaths);

  return (
    <View className="mt-5 px-5">
      <Text
        accessibilityRole="header"
        className="mb-3 font-sans-bold text-sm tracking-widest text-inkMuted">
        TRIPS
      </Text>
      {isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : trips && trips.length > 0 ? (
        <>
          <StartTripCard />
          {trips.map((trip, index) => (
            <Link key={trip.id} href={{ pathname: '/trip/[id]', params: { id: trip.id } }} asChild>
              <Pressable accessibilityRole="button" accessibilityLabel={`Open trip ${trip.title}`}>
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
            </Link>
          ))}
        </>
      ) : (
        <View className="items-center rounded-bubble border border-border bg-surfaceRaised px-6 py-8">
          <Text className="text-center font-display-italic text-base text-inkMuted">
            No trips yet — start your first journal.
          </Text>
          <Link href="/trip/new" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start your first trip"
              className="mt-4 rounded-full bg-primary px-6 py-3">
              <Text className="font-sans-semibold text-base text-white">Start a trip</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </View>
  );
}

/** The owner surface — on the Profile tab and, pushed under a native header
 *  (`coversStatusBar={false}`), when you open yourself via /user/[id]. */
export function ProfileScreen({ coversStatusBar = true }: { coversStatusBar?: boolean }) {
  const router = useRouter();
  const { data: profile, isPending, error } = useMyProfile();
  const { data: trips, isPending: tripsPending } = useMyTrips();
  const { data: followerCount } = useFollowerCount(profile?.id);
  const { data: engagement } = useTripEngagement((trips ?? []).map((t) => t.id));
  const savesTotal = (trips ?? []).reduce((sum, t) => sum + (engagement?.[t.id]?.saves ?? 0), 0);

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 px-5 pt-4">
          <FormError message={error instanceof Error ? error.message : 'Could not load profile.'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface">
      <ProfileHeader
        profile={profile}
        coversStatusBar={coversStatusBar}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => router.push('/profile/edit')}
            className="rounded-full border border-borderStrong bg-surfaceRaised px-5 py-2">
            <Text className="font-sans-bold text-sm text-ink">Edit profile</Text>
          </Pressable>
        }
      />
      <ProfileStats followers={followerCount ?? 0} trips={trips?.length ?? 0} saves={savesTotal} />
      <ProfileTripsSection trips={trips} isPending={tripsPending} engagement={engagement} />
      <View className="mb-10" />
    </ScrollView>
  );
}
