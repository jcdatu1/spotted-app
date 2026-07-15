import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHealthCheck } from '@/data/health';
import { SpottedWordmark } from '@/features/brand/wordmark';

function HealthCard() {
  const { data, isPending, refetch } = useHealthCheck();

  let statusLabel: string;
  let dotClass: string;
  let detail: string;
  let detailIsMono = false;

  if (isPending) {
    statusLabel = 'Checking backend…';
    dotClass = 'bg-accent';
    detail = 'Contacting Supabase';
  } else if (data?.ok) {
    statusLabel = 'Backend connected';
    dotClass = 'bg-secondary';
    detail = `${data.latencyMs}MS · STAGING`;
    detailIsMono = true;
  } else {
    statusLabel = 'Backend unreachable';
    dotClass = 'bg-primary';
    detail = data?.reason ?? 'Unknown error';
  }

  return (
    <View
      accessible
      accessibilityLabel={`${statusLabel}. ${detail}`}
      className="rounded-bubble border border-border bg-surfaceRaised p-4">
      <View className="flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <Text className="font-sans-semibold text-base text-ink">{statusLabel}</Text>
      </View>
      <Text
        className={`mt-1 ${detailIsMono ? 'font-mono text-sm' : 'font-sans text-sm'} text-inkMuted`}>
        {detail}
      </Text>
      <Text
        accessibilityRole="button"
        className="mt-3 font-sans-semibold text-sm text-secondary"
        onPress={() => refetch()}>
        Check again
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-4">
        <SpottedWordmark size={30} />
        <Text className="mt-1 font-display-italic text-base text-inkMuted">
          Follow real trips as they happen.
        </Text>
        <View className="mt-6">
          <HealthCard />
        </View>
        <Text className="mt-6 font-sans text-sm text-inkFaint">
          Discovery feed arrives with add-follows-and-discovery.
        </Text>
      </View>
    </SafeAreaView>
  );
}
