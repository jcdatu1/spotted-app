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

type TripCardProps = {
  title: string;
  subtitle: string;
  status?: Trip['status'];
};

/** Boarding-pass style list card; wrap in a Link/Pressable for navigation. */
export function TripCard({ title, subtitle, status }: TripCardProps) {
  return (
    <View className="mb-3 rounded-xl border border-borderStrong bg-surfaceRaised p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text numberOfLines={1} className="flex-1 font-display text-lg text-ink">
          {title}
        </Text>
        {status ? <StatusChip status={status} /> : null}
      </View>
      <Text numberOfLines={1} className="mt-1 font-sans text-sm text-inkMuted">
        {subtitle}
      </Text>
    </View>
  );
}
