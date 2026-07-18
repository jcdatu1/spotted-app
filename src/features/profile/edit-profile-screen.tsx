import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import {
  getMyProfile,
  profileMediaUrl,
  setMyAvatar,
  setMyCover,
  updateMyProfile,
  useMyProfile,
} from '@/data/profiles';
import { AuthButton, FormError, FormField } from '@/features/auth/form';
import { ImageInputField } from '@/features/ui/image-input-field';
import { pickAndPrepareImage, type PreparedImage } from '@/lib/images';
import { colors, fontFamily } from '@/theme/tokens';

const AVATAR_SIZE = 88;

/** Empty is allowed (birthday is optional); otherwise a real YYYY-MM-DD date,
 *  1900 or later, implying age >= 13 — mirrors the database CHECK. */
function validateBirthday(raw: string): { value: string | null; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { value: null, error: 'Use YYYY-MM-DD.' };
  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal) return { value: null, error: 'That date does not exist.' };
  if (year < 1900) return { value: null, error: 'Enter a date after 1900.' };
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 13);
  if (date.getTime() > cutoff.getTime())
    return { value: null, error: 'You must be at least 13 to use Spotted.' };
  return { value: trimmed, error: null };
}

export function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isPending, error } = useMyProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarDraft, setAvatarDraft] = useState<PreparedImage | null>(null);
  const [coverDraft, setCoverDraft] = useState<PreparedImage | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile && !seeded) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? '');
      setBirthday(profile.birthday ?? '');
      setSeeded(true);
    }
  }, [profile, seeded]);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 bg-surface px-5 pt-4">
        <FormError message={error instanceof Error ? error.message : 'Could not load profile.'} />
      </View>
    );
  }

  const userId = profile.id;
  const trimmedName = displayName.trim();
  const nameValid = trimmedName.length >= 1 && trimmedName.length <= 50;
  const birthdayCheck = validateBirthday(birthday);

  const fieldsDirty =
    trimmedName !== profile.display_name ||
    bio.trim() !== (profile.bio ?? '') ||
    birthdayCheck.value !== profile.birthday;
  const dirty = fieldsDirty || avatarDraft !== null || coverDraft !== null;

  const coverUri = coverDraft?.uri ?? profileMediaUrl(profile.cover_path);
  const avatarUri = avatarDraft?.uri ?? profileMediaUrl(profile.avatar_path);

  async function pick(kind: 'avatar' | 'cover') {
    try {
      const prepared = await pickAndPrepareImage(kind);
      if (!prepared) return;
      if (kind === 'avatar') setAvatarDraft(prepared);
      else setCoverDraft(prepared);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not pick that image.');
    }
  }

  async function handleSave() {
    setSaveError(null);
    setBusy(true);
    try {
      if (avatarDraft) await setMyAvatar(avatarDraft);
      if (coverDraft) await setMyCover(coverDraft);
      if (fieldsDirty) {
        await updateMyProfile({
          display_name: trimmedName,
          bio: bio.trim() || null,
          birthday: birthdayCheck.value,
        });
      }
      // Write-through: the profile screen re-renders from cache the moment we
      // navigate back, no refetch race.
      const fresh = await getMyProfile();
      queryClient.setQueryData(['my-profile', userId], fresh);
      router.back();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-5 pb-10 pt-4"
      keyboardShouldPersistTaps="handled">
      <FormError message={saveError} />

      <View className="mb-4">
        <Text className="mb-1 font-sans-semibold text-sm text-ink">Cover photo</Text>
        <ImageInputField
          shape="cover"
          uri={coverUri}
          onPress={() => pick('cover')}
          accessibilityLabel={coverUri ? 'Change cover photo' : 'Add cover photo'}
        />
      </View>

      <View className="mb-4">
        <Text className="mb-1 font-sans-semibold text-sm text-ink">Profile photo</Text>
        <ImageInputField
          shape="avatar"
          uri={avatarUri}
          onPress={() => pick('avatar')}
          accessibilityLabel={avatarUri ? 'Change profile photo' : 'Add profile photo'}
          size={AVATAR_SIZE}
        />
      </View>

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
      <FormField
        label="Birthday"
        value={birthday}
        onChangeText={setBirthday}
        error={birthdayCheck.error ?? undefined}
        placeholder="YYYY-MM-DD"
        style={{ fontFamily: fontFamily.mono }}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={10}
      />
      <Text className="-mt-3 mb-4 font-sans text-xs text-inkMuted">
        Private — only you can see your birthday.
      </Text>

      <AuthButton
        label={busy ? 'Saving…' : 'Save changes'}
        onPress={handleSave}
        disabled={!dirty || !nameValid || birthdayCheck.error !== null}
        busy={busy}
      />
    </ScrollView>
  );
}
