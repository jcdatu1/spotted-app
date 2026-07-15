import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '@/data/auth';
import type { Profile } from '@/data/profiles';
import { profileMediaUrl, useMyProfile } from '@/data/profiles';
import type { TripWithStops } from '@/data/trips';
import { useMyTrips } from '@/data/trips';
import { AuthButton, FormError } from '@/features/auth/form';
import { TripCard } from '@/features/trips/trip-card';
import { colors } from '@/theme/tokens';

const AVATAR_SIZE = 88;

/** Cover band (photo when set, teal when not) + overlapping avatar + identity
 *  block. `action` is the slot the audience view will fill with a Follow
 *  button (holder: Edit profile). */
function ProfileHeader({ profile, action }: { profile: Profile; action: ReactNode }) {
  const insets = useSafeAreaInsets();
  const initial = profile.display_name.trim().charAt(0).toUpperCase() || '@';
  const coverUrl = profileMediaUrl(profile.cover_path);
  const avatarUrl = profileMediaUrl(profile.avatar_path);

  return (
    <View>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={{ height: insets.top + 84 }} contentFit="cover" />
      ) : (
        <View className="bg-secondary" style={{ height: insets.top + 84 }} />
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

/** Followers/saves stay 0 until those capabilities ship; trips is the real count. */
function ProfileStats({
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

function tripMeta(createdAt: string): string {
  const d = new Date(createdAt);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
}

/** Create-trip CTA leading the trip list — the profile's one coral action. */
function StartTripCard() {
  return (
    <Link href="/trip/new" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start a new trip"
        className="mb-3 items-center rounded-bubble border border-primary bg-primaryFaint px-6 py-5"
        style={{ borderStyle: 'dashed' }}>
        <Text className="font-display text-xl text-primary">+</Text>
        <Text className="mt-1 text-center font-display-italic text-base text-ink">
          Where to next?
        </Text>
        <Text className="mt-0.5 text-center font-sans text-sm text-inkMuted">
          Start a new journal
        </Text>
      </Pressable>
    </Link>
  );
}

function ProfileTripsSection({
  trips,
  isPending,
}: {
  trips: TripWithStops[] | undefined;
  isPending: boolean;
}) {
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
                  status={trip.status}
                  meta={tripMeta(trip.created_at)}
                  stops={trip.stops}
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

export function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isPending, error } = useMyProfile();
  const { data: trips, isPending: tripsPending } = useMyTrips();

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
      <ProfileStats followers={0} trips={trips?.length ?? 0} saves={0} />
      <ProfileTripsSection trips={trips} isPending={tripsPending} />
      <View className="mb-10 mt-8 px-5">
        <AuthButton label="Sign out" onPress={() => signOut()} variant="secondary" />
      </View>
    </ScrollView>
  );
}
