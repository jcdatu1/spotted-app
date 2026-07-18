import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { useSession } from '@/data/auth';
import { useIsTripSaved, useRecordTripView, useSaveTrip, useUnsaveTrip } from '@/data/engagement';
import { useSignedPhotoUrls } from '@/data/media';
import { getPublishBlocker, usePublishTrip, type TripWithOwner } from '@/data/trips';
import { useTripBudget, useTripUpdates } from '@/data/updates';
import { AuthButton } from '@/features/auth/form';
import { ComposerSheet } from '@/features/composer/composer-sheet';
import { useComposerStore } from '@/features/composer/composer-store';
import { BudgetHeader } from '@/features/trip-thread/budget-header';
import { UpdateBubble } from '@/features/trip-thread/update-bubble';
import { formatTripDate } from '@/lib/dates';
import { colors } from '@/theme/tokens';

/** Save/Saved toggle for non-owner readers (teal = saves, per brand).
 *  Nothing renders while the saved state loads. */
function SavePill({ tripId }: { tripId: string }) {
  const { data: saved, isPending } = useIsTripSaved(tripId, true);
  const save = useSaveTrip();
  const unsave = useUnsaveTrip();
  const busy = save.isPending || unsave.isPending;

  if (isPending) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Unsave this trip' : 'Save this trip'}
      disabled={busy}
      onPress={() => (saved ? unsave.mutate(tripId) : save.mutate(tripId))}
      className={`flex-row items-center gap-1 rounded-full px-3 py-1 ${
        saved ? 'bg-secondary' : 'border border-secondary bg-white'
      }`}>
      <Ionicons
        name={saved ? 'bookmark' : 'bookmark-outline'}
        size={13}
        color={saved ? colors.white : colors.secondary}
      />
      <Text className={`font-sans-bold text-xs ${saved ? 'text-white' : 'text-secondary'}`}>
        {saved ? 'Saved' : 'Save'}
      </Text>
    </Pressable>
  );
}

export function TripThreadScreen({ trip }: { trip: TripWithOwner }) {
  const router = useRouter();
  const { session } = useSession();
  const isOwner = session?.user.id === trip.owner_id;
  const isDraft = trip.status === 'draft';
  const publishBlocker = getPublishBlocker(trip);

  const updatesQuery = useTripUpdates(trip.id);
  const budgetQuery = useTripBudget(trip.id);
  const publish = usePublishTrip();

  // One idempotent view per reader; owners and drafts record nothing.
  useRecordTripView(trip);

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
            <View className="mb-1 flex-row items-center gap-2">
              <Text className="flex-1 font-sans text-sm text-inkMuted" numberOfLines={1}>
                by {trip.owner.display_name} · @{trip.owner.username}
              </Text>
              {!isOwner && trip.status === 'published' ? <SavePill tripId={trip.id} /> : null}
            </View>
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
