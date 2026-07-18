import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import { useSession } from '@/data/auth';
import { useSignedPhotoUrls } from '@/data/media';
import { getPublishBlocker, usePublishTrip, type TripWithOwner } from '@/data/trips';
import { useTripBudget, useTripUpdates } from '@/data/updates';
import { AuthButton } from '@/features/auth/form';
import { ComposerSheet } from '@/features/composer/composer-sheet';
import { useComposerStore } from '@/features/composer/composer-store';
import { BudgetHeader } from '@/features/trip-thread/budget-header';
import { UpdateBubble } from '@/features/trip-thread/update-bubble';
import { formatTripDate } from '@/lib/dates';

export function TripThreadScreen({ trip }: { trip: TripWithOwner }) {
  const router = useRouter();
  const { session } = useSession();
  const isOwner = session?.user.id === trip.owner_id;
  const isDraft = trip.status === 'draft';
  const publishBlocker = getPublishBlocker(trip);

  const updatesQuery = useTripUpdates(trip.id);
  const budgetQuery = useTripBudget(trip.id);
  const publish = usePublishTrip();

  const updates = useMemo(() => updatesQuery.data ?? [], [updatesQuery.data]);
  const photoPaths = useMemo(
    () => updates.filter((u) => u.type === 'photo').map((u) => u.mediaPath),
    [updates],
  );
  const { data: photoUrls } = useSignedPhotoUrls(photoPaths);

  const lastUsedCurrency = useMemo(() => {
    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i];
      if ((u.type === 'purchase' || u.type === 'attraction') && u.currency) return u.currency;
    }
    return 'USD';
  }, [updates]);

  // While the owner's own thread is focused, the tab bar's + button becomes
  // "Add update" (opens the type picker) instead of "New trip".
  const registerOwnedTrip = useComposerStore((s) => s.registerOwnedTrip);
  const clearOwnedTrip = useComposerStore((s) => s.clearOwnedTrip);
  useFocusEffect(
    useCallback(() => {
      if (!isOwner) return;
      registerOwnedTrip({ tripId: trip.id, defaultCurrency: lastUsedCurrency });
      return clearOwnedTrip;
    }, [isOwner, trip.id, lastUsedCurrency, registerOwnedTrip, clearOwnedTrip]),
  );

  function confirmPublish() {
    Alert.alert('Publish this trip?', 'Anyone on Spotted will be able to read it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => publish.mutate(trip.id) },
    ]);
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        className="flex-1 px-4 pt-3"
        data={updates}
        keyExtractor={(u) => u.id}
        onRefresh={() => {
          updatesQuery.refetch();
          budgetQuery.refetch();
        }}
        refreshing={updatesQuery.isRefetching}
        ListHeaderComponent={
          <View>
            <Text className="mb-1 font-sans text-sm text-inkMuted">
              by {trip.owner.display_name} · @{trip.owner.username}
            </Text>
            {trip.description ? (
              <Text className="mb-3 font-display-italic text-base text-inkMuted">
                {trip.description}
              </Text>
            ) : (
              <View className="mb-3" />
            )}
            {isOwner && isDraft ? (
              <View className="mb-4 rounded-xl border border-accent bg-accentTint p-3">
                <Text className="font-sans text-sm text-ink">
                  This trip is a draft — only you can see it.
                </Text>
                {publishBlocker === 'not-started' && trip.start_date ? (
                  <Text className="mt-1.5 font-mono text-xs text-accentPressed">
                    PUBLISHING OPENS {formatTripDate(trip.start_date)}
                  </Text>
                ) : publishBlocker === 'missing-dates' ? (
                  <Text className="mt-1.5 font-mono text-xs text-accentPressed">
                    ADD TRIP DATES TO PUBLISH
                  </Text>
                ) : null}
                <View className="mt-2 flex-row gap-2">
                  <View className="flex-1">
                    <AuthButton
                      label="Edit details"
                      variant="secondary"
                      onPress={() =>
                        router.push({ pathname: '/trip/[id]/edit', params: { id: trip.id } })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <AuthButton
                      label={publish.isPending ? 'Publishing…' : 'Publish trip'}
                      onPress={confirmPublish}
                      disabled={publishBlocker !== null}
                      busy={publish.isPending}
                    />
                  </View>
                </View>
              </View>
            ) : null}
            <BudgetHeader lines={budgetQuery.data ?? []} />
          </View>
        }
        renderItem={({ item }) => (
          <UpdateBubble
            update={item}
            own={isOwner}
            photoUrl={item.type === 'photo' ? photoUrls?.[item.mediaPath] : undefined}
          />
        )}
        ListEmptyComponent={
          updatesQuery.isPending ? null : (
            <View className="rounded-xl border border-border bg-surfaceRaised p-4">
              <Text className="font-sans text-sm text-inkMuted">
                {isOwner
                  ? 'No updates yet — tap + below to post your first one.'
                  : 'No updates yet. Check back soon.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View className="h-4" />}
      />
      {isOwner ? <ComposerSheet tripId={trip.id} defaultCurrency={lastUsedCurrency} /> : null}
    </View>
  );
}
