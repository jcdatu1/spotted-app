import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { COVER_ASPECT } from '@/lib/images';

/** Post/trip photo inputs render at this preview ratio. */
const PHOTO_ASPECT = 4 / 3;

type ImageInputFieldProps = {
  /** Geometry variant: full-width 16:9 rect, circle, or 4:3 photo rect. */
  shape: 'cover' | 'avatar' | 'photo';
  /** Display URI (draft or persisted); null renders the empty state. */
  uri: string | null;
  onPress: () => void;
  accessibilityLabel: string;
  /** Circle diameter for the avatar shape. */
  size?: number;
};

/** The app's one image-input pattern (see SPOTTED_BIBLE.md): empty fields are
 *  a dashed warm-gray well with a centered `+`; filled fields show the image
 *  under a light scrim with a centered `+` to signal they stay actionable.
 *  Dashed gray = empty input; dashed coral stays reserved for CTAs. */
export function ImageInputField({
  shape,
  uri,
  onPress,
  accessibilityLabel,
  size = 88,
}: ImageInputFieldProps) {
  const isCircle = shape === 'avatar';
  const frameStyle = isCircle
    ? { width: size, height: size, borderRadius: size / 2 }
    : ({ width: '100%', aspectRatio: shape === 'cover' ? COVER_ASPECT : PHOTO_ASPECT } as const);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={isCircle ? 'self-start' : undefined}>
      {uri ? (
        <View className={`overflow-hidden ${isCircle ? '' : 'rounded-lg'}`} style={frameStyle}>
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
            <Text className="font-display text-2xl text-white">+</Text>
          </View>
        </View>
      ) : (
        <View
          className={`items-center justify-center border border-borderStrong bg-surfaceSunken ${isCircle ? '' : 'rounded-lg'}`}
          style={[frameStyle, { borderStyle: 'dashed' }]}>
          <Text className="font-display text-2xl text-inkMuted">+</Text>
        </View>
      )}
    </Pressable>
  );
}
