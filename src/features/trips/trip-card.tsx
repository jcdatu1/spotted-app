import { Text, View } from 'react-native';

import type { Trip } from '@/data/trips';

export function StatusChip({ status }: { status: Trip['status'] }) {
  const isDraft = status === 'draft';
  return (
    <View
      className={`self-start rounded-full px-2.5 py-0.5 ${isDraft ? 'bg-accentTint' : 'bg-secondaryTint'}`}>
      <Text
        className={`font-mono text-2xs uppercase ${isDraft ? 'text-accentPressed' : 'text-secondary'}`}>
        {isDraft ? 'Draft' : 'Published'}
      </Text>
    </View>
  );
}

/** Placeholder cover tints until trips have real cover media. */
const COVER_TINTS = ['bg-secondaryLight', 'bg-accent', 'bg-primaryPressed'] as const;

type TripCardProps = {
  title: string;
  subtitle: string;
  status?: Trip['status'];
  /** Space Mono meta line, e.g. "FEB 2026". */
  meta?: string;
  /** Update count; renders the "stops" chip when provided. */
  stops?: number;
  /** Rotates the placeholder cover tint (list index). */
  tintIndex?: number;
};

/** Boarding-pass style list card; wrap in a Link/Pressable for navigation. */
export function TripCard({ title, subtitle, status, meta, stops, tintIndex = 0 }: TripCardProps) {
  return (
    <View className="mb-3 flex-row overflow-hidden rounded-bubble border border-borderStrong bg-white">
      <View className={`w-20 ${COVER_TINTS[tintIndex % COVER_TINTS.length]}`} />
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
        {status !== undefined || stops !== undefined ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            {status ? <StatusChip status={status} /> : null}
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
