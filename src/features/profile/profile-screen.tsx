import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/data/auth';
import { useMyProfile, useUpdateMyProfile } from '@/data/profiles';
import { useMyTrips } from '@/data/trips';
import { AuthButton, FormError, FormField } from '@/features/auth/form';
import { TripCard } from '@/features/trips/trip-card';
import { colors } from '@/theme/tokens';

function MyTripsSection() {
  const { data: trips, isPending } = useMyTrips();

  return (
    <View className="mt-8">
      <Text accessibilityRole="header" className="mb-3 font-display text-xl text-ink">
        Your trips
      </Text>
      {isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : trips && trips.length > 0 ? (
        trips.map((trip) => (
          <Link key={trip.id} href={{ pathname: '/trip/[id]', params: { id: trip.id } }} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open trip ${trip.title}`}>
              <TripCard
                title={trip.title}
                subtitle={trip.description ?? 'No description'}
                status={trip.status}
              />
            </Pressable>
          </Link>
        ))
      ) : (
        <Text className="mb-3 font-sans text-sm text-inkMuted">
          No trips yet — start your first journal.
        </Text>
      )}
      <Link href="/trip/new" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New trip"
          className="mt-1 items-center rounded-full bg-primary px-6 py-3">
          <Text className="font-sans-semibold text-base text-white">New trip</Text>
        </Pressable>
      </Link>
    </View>
  );
}

export function ProfileScreen() {
  const { data: profile, isPending, error } = useMyProfile();
  const update = useUpdateMyProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [seeded, setSeeded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !seeded) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? '');
      setSeeded(true);
    }
  }, [profile, seeded]);

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

  const trimmedName = displayName.trim();
  const dirty = trimmedName !== profile.display_name || bio.trim() !== (profile.bio ?? '');
  const nameValid = trimmedName.length >= 1 && trimmedName.length <= 50;

  function handleSave() {
    setSaveError(null);
    update.mutate(
      { display_name: trimmedName, bio: bio.trim() || null },
      { onError: (e) => setSaveError(e instanceof Error ? e.message : 'Save failed.') },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Profile
        </Text>
        <Text className="mb-6 mt-1 font-mono text-sm text-inkMuted">@{profile.username}</Text>

        <FormError message={saveError} />
        <FormField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          error={nameValid ? undefined : 'Display name must be 1–50 characters.'}
          placeholder="How you appear to others"
        />
        <FormField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="A line about your travels (optional)"
          multiline
          maxLength={160}
        />
        <AuthButton
          label={update.isPending ? 'Saving…' : 'Save changes'}
          onPress={handleSave}
          disabled={!dirty || !nameValid}
          busy={update.isPending}
        />

        <MyTripsSection />

        <View className="mb-10 mt-10">
          <AuthButton label="Sign out" onPress={() => signOut()} variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
