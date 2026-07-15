import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fontFamily } from '@/theme/tokens';

const PIN_ASPECT = 66 / 92;

/**
 * The brand pin — the "o" in Spotted. Coral pin, amber dot; per brand
 * guidelines the two are never recolored independently, so no color props.
 */
export function PinMark({ height = 40 }: { height?: number }) {
  return (
    <Svg width={height * PIN_ASPECT} height={height} viewBox="0 0 66 92" fill="none">
      <Path
        d="M33 8C19.7 8 9 18.4 9 31.3c0 17.2 20.4 39 23.1 41.8a1.3 1.3 0 0 0 1.9 0C36.6 70.3 57 48.5 57 31.3 57 18.4 46.3 8 33 8z"
        fill={colors.primary}
      />
      <Circle cx="33" cy="31" r="10" fill={colors.accent} />
    </Svg>
  );
}

type WordmarkProps = {
  size?: number;
  /** Ink on light surfaces (default); cream on pine/dark surfaces. */
  onDark?: boolean;
};

/** Primary wordmark: Sp<pin>tted, Fraunces 600, pin sized to the cap height. */
export function SpottedWordmark({ size = 40, onDark = false }: WordmarkProps) {
  const color = onDark ? colors.inkInverse : colors.ink;
  const textStyle = {
    fontFamily: fontFamily.display,
    fontSize: size,
    lineHeight: size * 1.1,
    letterSpacing: -0.5,
    color,
  } as const;
  return (
    <View
      className="flex-row items-center"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Spotted">
      <Text style={textStyle}>Sp</Text>
      <PinMark height={size} />
      <Text style={textStyle}>tted</Text>
    </View>
  );
}
