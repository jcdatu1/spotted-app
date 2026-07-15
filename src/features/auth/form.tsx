import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { colors } from '@/theme/tokens';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, ...inputProps }: FormFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 font-sans-semibold text-sm text-ink">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkFaint}
        className={`rounded-lg border bg-white px-4 py-3 font-sans text-base text-ink ${
          error ? 'border-primary' : 'border-borderStrong'
        }`}
        {...inputProps}
      />
      {error ? <Text className="mt-1 font-sans text-sm text-primary">{error}</Text> : null}
    </View>
  );
}

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({
  label,
  onPress,
  disabled,
  busy,
  variant = 'primary',
}: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || busy}
      onPress={onPress}
      className={`mt-2 items-center rounded-full px-6 py-3 ${
        isPrimary ? 'bg-primary' : 'border border-borderStrong bg-surfaceRaised'
      } ${disabled || busy ? 'opacity-50' : ''}`}>
      {busy ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.ink} />
      ) : (
        <Text className={`font-sans-semibold text-base ${isPrimary ? 'text-white' : 'text-ink'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-lg bg-primaryTint p-3">
      <Text className="font-sans text-sm text-ink">{message}</Text>
    </View>
  );
}
