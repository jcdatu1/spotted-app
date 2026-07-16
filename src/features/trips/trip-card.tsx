import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import type { Trip, TripState } from '@/data/trips';
import { flagEmoji } from '@/lib/countries';
import { formatTripRange } from '@/lib/dates';

/** Space Mono meta line: date range + country flags when the trip has dates,
 *  creation month/year for legacy trips that don't. */
export function tripCardMeta(
  trip: Pick<Trip, 'start_date' | 'end_date' | 'country_codes' | 'created_at'>,
): string {
  const flags = trip.country_codes.map(flagEmoji).join('');
  const range =
    trip.start_date && trip.end_date
      ? formatTripRange(trip.start_date, trip.end_date)
      : new Date(trip.created_at)
          .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          .toUpperCase();
  return flags ? `${range} ${flags}` : range;
}

const CHIP_STYLES: Record<TripState, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-accentTint', text: 'text-accentPressed', label: 'Draft' },
  live: { bg: 'bg-primaryTint', text: 'text-primaryPressed', label: 'Live' },
  completed: { bg: 'bg-surfaceRaised', text: 'text-inkMuted', label: 'Completed' },
};

export function StatusChip({ state }: { state: TripState }) {
  const chip = CHIP_STYLES[state];
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${chip.bg}`}>
      <Text className={`font-mono text-2xs uppercase ${chip.text}`}>{chip.label}</Text>
    </View>
  );
}

/** Placeholder cover tints for trips without a cover photo. */
const COVER_TINTS = ['bg-secondaryLight', 'bg-accent', 'bg-primaryPressed'] as const;

type TripCardProps = {
  title: string;
  subtitle: string;
  state?: TripState;
  /** Space Mono meta line, e.g. "FEB 12–26 2026 🇵🇭". */
  meta?: string;
  /** Update count; renders the "stops" chip when provided. */
  stops?: number;
  /** Signed display URL of the trip's cover photo; tint fallback when absent. */
  coverUrl?: string;
  /** Rotates the placeholder cover tint (list index). */
  tintIndex?: number;
};

/** Boarding-pass style list card; wrap in a Link/Pressable for navigation. */
export function TripCard({
  title,
  subtitle,
  state,
  meta,
  stops,
  coverUrl,
  tintIndex = 0,
}: TripCardProps) {
  return (
    <View className="mb-3 flex-row overflow-hidden rounded-bubble border border-borderStrong bg-white">
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={{ width: 80 }} contentFit="cover" />
      ) : (
        <View className={`w-20 ${COVER_TINTS[tintIndex % COVER_TINTS.length]}`} />
      )}
      <View className="relative flex-1 p-4">
        {/* boarding-pass perforation between cover and body */}
        <View
          className="absolute bottom-3 top-3 border-l-2 border-border"
          style={{ left: -1, borderStyle: 'dashed' }}
        />
        {meta ? (
          <Text className="font-mono text-2xs uppercase tracking-widest text-inkMuted">{meta}</Text>
        ) : null}
        <Text numberOfLines={1} className="font-display text-lg text-ink">
          {title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 font-sans text-sm text-inkMuted">
          {subtitle}
        </Text>
        {state !== undefined || stops !== undefined ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            {state ? <StatusChip state={state} /> : null}
            {stops !== undefined ? (
              <View className="self-start rounded-full bg-surfaceRaised px-2.5 py-0.5">
                <Text className="font-mono text-2xs text-secondary">
                  {stops} {stops === 1 ? 'stop' : 'stops'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
