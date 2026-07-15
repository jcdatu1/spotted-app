import { Text, View } from 'react-native';

import type { BudgetLine } from '@/data/updates';
import { formatMoney } from '@/lib/money';

/** Per-currency rollup; renders nothing when the trip has no costed updates. */
export function BudgetHeader({ lines }: { lines: BudgetLine[] }) {
  if (lines.length === 0) return null;
  return (
    <View
      accessible
      accessibilityLabel={`Trip spend: ${lines.map((l) => `${l.total} ${l.currency}`).join(', ')}`}
      className="mb-4 rounded-xl border border-secondaryTint bg-secondaryTint p-3">
      <Text className="font-mono text-2xs uppercase tracking-widest text-secondaryDeep">
        Trip spend
      </Text>
      <View className="mt-1 flex-row flex-wrap items-baseline gap-3">
        {lines.map((line) => (
          <Text key={line.currency} className="font-mono-bold text-lg text-secondaryDeep">
            {formatMoney(line.total, line.currency)}
          </Text>
        ))}
      </View>
    </View>
  );
}
