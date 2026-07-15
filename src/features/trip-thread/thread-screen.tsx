import { useMemo } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { useSession } from '@/data/auth';
import { useSignedPhotoUrls } from '@/data/media';
import { usePublishTrip, type TripWithOwner } from '@/data/trips';
import { useTripBudget, useTripUpdates } from '@/data/updates';
import { AuthButton } from '@/features/auth/form';
import { ComposerBar } from '@/features/composer/composer-bar';
import { BudgetHeader } from '@/features/trip-thread/budget-header';
import { UpdateBubble } from '@/features/trip-thread/update-bubble';

export function TripThreadScreen({ trip }: { trip: TripWithOwner }) {
  const { session } = useSession();
  const isOwner = session?.user.id === trip.owner_id;
  const isDraft = trip.status === 'draft';

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

  function confirmPublish() {
    Alert.alert('Publish this trip?', 'Anyone on Spotted will be able to read it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => publish.mutate(trip.id) },
    ]);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                <View className="mt-2">
                  <AuthButton
                    label={publish.isPending ? 'Publishing…' : 'Publish trip'}
                    onPress={confirmPublish}
                    busy={publish.isPending}
                  />
                </View>
              </View>
            ) : null}
            <BudgetHeader lines={budgetQuery.data ?? []} />
          </View>
        }
        renderItem={({ item }) => (
          <UpdateBubble
            update={item}
            photoUrl={item.type === 'photo' ? photoUrls?.[item.mediaPath] : undefined}
          />
        )}
        ListEmptyComponent={
          updatesQuery.isPending ? null : (
            <View className="rounded-xl border border-border bg-surfaceRaised p-4">
              <Text className="font-sans text-sm text-inkMuted">
                {isOwner
                  ? 'No updates yet — post your first one below.'
                  : 'No updates yet. Check back soon.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View className="h-4" />}
      />
      {isOwner ? <ComposerBar tripId={trip.id} defaultCurrency={lastUsedCurrency} /> : null}
    </KeyboardAvoidingView>
  );
}
