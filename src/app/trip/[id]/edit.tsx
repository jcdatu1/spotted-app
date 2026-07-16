import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { useSession } from '@/data/auth';
import { useSignedUrls } from '@/data/storage';
import { getTripState, useTrip, useUpdateTrip } from '@/data/trips';
import { FormError } from '@/features/auth/form';
import { TripForm } from '@/features/trips/trip-form';
import { colors } from '@/theme/tokens';

export default function EditTripScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id);
  const { session } = useSession();
  const { data: trip, isPending, error } = useTrip(id);
  const update = useUpdateTrip();
  const [saveError, setSaveError] = useState<string | null>(null);

  const coverPaths = trip?.cover_path ? [trip.cover_path] : [];
  const { data: coverUrls } = useSignedUrls('trip-media', coverPaths);

  const isOwner = !!trip && session?.user.id === trip.owner_id;
  const editable = !!trip && isOwner && getTripState(trip) === 'draft';

  // Only drafts are editable — bounce published/foreign trips back to the thread.
  useEffect(() => {
    if (trip && !editable) {
      router.replace({ pathname: '/trip/[id]', params: { id } });
    }
  }, [trip, editable, id]);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View className="flex-1 bg-surface px-5 pt-4">
        <FormError message={error instanceof Error ? error.message : 'Could not load this trip.'} />
      </View>
    );
  }

  if (!editable) {
    return <View className="flex-1 bg-surface" />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled">
        <TripForm
          initial={trip}
          initialCoverUri={trip.cover_path ? (coverUrls?.[trip.cover_path] ?? null) : null}
          submitLabel="Save changes"
          busyLabel="Saving…"
          busy={update.isPending}
          error={saveError}
          onSubmit={(input) => {
            setSaveError(null);
            update.mutate(
              { trip, input },
              {
                onSuccess: () => router.back(),
                onError: (e) =>
                  setSaveError(e instanceof Error ? e.message : 'Could not save changes.'),
              },
            );
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
