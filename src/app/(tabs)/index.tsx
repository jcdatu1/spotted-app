import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHealthCheck } from '@/data/health';

function HealthCard() {
  const { data, isPending, refetch } = useHealthCheck();

  let statusLabel: string;
  let dotClass: string;
  let detail: string;

  if (isPending) {
    statusLabel = 'Checking backend…';
    dotClass = 'bg-accent';
    detail = 'Contacting local Supabase';
  } else if (data?.ok) {
    statusLabel = 'Backend connected';
    dotClass = 'bg-secondary';
    detail = `Local Supabase responded in ${data.latencyMs}ms`;
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
        <Text className="font-sans text-base font-semibold text-ink">{statusLabel}</Text>
      </View>
      <Text className="mt-1 font-sans text-sm text-inkMuted">{detail}</Text>
      <Text
        accessibilityRole="button"
        className="mt-3 font-sans text-sm font-semibold text-secondary"
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
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Spotted
        </Text>
        <Text className="mt-1 font-sans text-base text-inkMuted">Walk in a traveler’s shoes.</Text>
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
