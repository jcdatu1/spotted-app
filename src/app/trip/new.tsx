import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';

import { useCreateTrip } from '@/data/trips';
import { TripForm } from '@/features/trips/trip-form';

export default function NewTripScreen() {
  const [error, setError] = useState<string | null>(null);
  const create = useCreateTrip();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" className="mb-2 font-display text-2xl text-ink">
          Where to next?
        </Text>
        <Text className="mb-6 font-sans text-sm text-inkMuted">
          Trips start as drafts — post updates first, publish once the trip has started.
        </Text>
        <TripForm
          submitLabel="Create trip"
          busyLabel="Creating…"
          busy={create.isPending}
          error={error}
          onSubmit={(input) => {
            setError(null);
            create.mutate(input, {
              // Every step explicit — this flow runs from the ROOT stack,
              // where nothing can be left to resolution rules: a bare
              // /trip/[id] push resolves into the first shared group
              // alphabetically (Discover), and a group-qualified replace
              // swaps out the tab's root screen (both stranded users).
              // Dismiss the form, land the Profile tab on its root, then
              // push the thread above it so back always returns to Profile.
              onSuccess: (trip) => {
                router.back();
                router.navigate('/(tabs)/(profile)/profile');
                router.push({ pathname: '/(tabs)/(profile)/trip/[id]', params: { id: trip.id } });
              },
              onError: (e) => setError(e instanceof Error ? e.message : 'Could not create trip.'),
            });
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
