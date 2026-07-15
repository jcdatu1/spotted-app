import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/data/auth';
import { useMyProfile, useUpdateMyProfile } from '@/data/profiles';
import { AuthButton, FormError, FormField } from '@/features/auth/form';
import { colors } from '@/theme/tokens';

export function ProfileScreen() {
  const { data: profile, isPending, error } = useMyProfile();
  const update = useUpdateMyProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [seeded, setSeeded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !seeded) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? '');
      setSeeded(true);
    }
  }, [profile, seeded]);

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 px-5 pt-4">
          <FormError message={error instanceof Error ? error.message : 'Could not load profile.'} />
        </View>
      </SafeAreaView>
    );
  }

  const trimmedName = displayName.trim();
  const dirty = trimmedName !== profile.display_name || bio.trim() !== (profile.bio ?? '');
  const nameValid = trimmedName.length >= 1 && trimmedName.length <= 50;

  function handleSave() {
    setSaveError(null);
    update.mutate(
      { display_name: trimmedName, bio: bio.trim() || null },
      { onError: (e) => setSaveError(e instanceof Error ? e.message : 'Save failed.') },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-4">
        <Text accessibilityRole="header" className="font-display text-3xl text-ink">
          Profile
        </Text>
        <Text className="mb-6 mt-1 font-mono text-sm text-inkMuted">@{profile.username}</Text>

        <FormError message={saveError} />
        <FormField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          error={nameValid ? undefined : 'Display name must be 1–50 characters.'}
          placeholder="How you appear to others"
        />
        <FormField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="A line about your travels (optional)"
          multiline
          maxLength={160}
        />
        <AuthButton
          label={update.isPending ? 'Saving…' : 'Save changes'}
          onPress={handleSave}
          disabled={!dirty || !nameValid}
          busy={update.isPending}
        />

        <View className="mt-10">
          <AuthButton label="Sign out" onPress={() => signOut()} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}
