import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import type { Update } from '@/data/updates';
import { formatMoney } from '@/lib/money';
import { colors } from '@/theme/tokens';

function Timestamp({ iso }: { iso: string }) {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <Text className="mt-1.5 font-mono text-2xs uppercase text-inkFaint">{`${day} · ${time}`}</Text>
  );
}

function Caption({ body }: { body: string | null }) {
  if (!body) return null;
  return <Text className="mt-2 font-sans text-base text-ink">{body}</Text>;
}

type UpdateBubbleProps = {
  update: Update;
  /** Resolved signed URL for photo updates; undefined while loading. */
  photoUrl?: string;
};

export function UpdateBubble({ update, photoUrl }: UpdateBubbleProps) {
  switch (update.type) {
    case 'note':
      return (
        <View className="mb-3 max-w-[85%] self-start">
          <View className="rounded-bubble border border-border bg-surfaceRaised px-4 py-3">
            <Text className="font-sans text-base text-ink">{update.body}</Text>
          </View>
          <Timestamp iso={update.happenedAt} />
        </View>
      );

    case 'photo':
      return (
        <View className="mb-3 max-w-[85%] self-start">
          <View className="overflow-hidden rounded-bubble border border-border bg-white">
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={{ width: 260, height: 200 }}
                contentFit="cover"
                accessibilityLabel={update.body ?? 'Trip photo'}
              />
            ) : (
              <View className="h-40 w-64 items-center justify-center bg-surfaceMuted">
                <Ionicons name="image" size={28} color={colors.inkFaint} />
              </View>
            )}
            {update.body ? (
              <Text className="px-3 py-2 font-sans text-sm text-ink">{update.body}</Text>
            ) : null}
          </View>
          <Timestamp iso={update.happenedAt} />
        </View>
      );

    case 'purchase':
      return (
        <View className="mb-3 max-w-[85%] self-start">
          <View className="rounded-bubble border border-secondaryTint bg-white p-4">
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-secondaryTint">
                <Ionicons name="cart" size={14} color={colors.secondary} />
              </View>
              <Text numberOfLines={1} className="flex-1 font-sans-semibold text-base text-ink">
                {update.vendorName}
              </Text>
            </View>
            <Text className="mt-2 font-mono-bold text-lg text-secondary">
              {formatMoney(update.amount, update.currency)}
            </Text>
            <Caption body={update.body} />
          </View>
          <Timestamp iso={update.happenedAt} />
        </View>
      );

    case 'attraction':
      return (
        <View className="mb-3 max-w-[85%] self-start">
          <View className="rounded-bubble border border-accentTint bg-white p-4">
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-accentTint">
                <Ionicons name="location" size={14} color={colors.accentPressed} />
              </View>
              <Text numberOfLines={2} className="flex-1 font-sans-semibold text-base text-ink">
                {update.placeName}
              </Text>
            </View>
            {update.amount != null && update.currency ? (
              <Text className="mt-2 font-mono text-sm text-secondary">
                Entry {formatMoney(update.amount, update.currency)}
              </Text>
            ) : null}
            <Caption body={update.body} />
          </View>
          <Timestamp iso={update.happenedAt} />
        </View>
      );
  }
}
