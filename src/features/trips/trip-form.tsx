import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

import type { Trip, TripDetailsInput } from '@/data/trips';
import { AuthButton, FormError, FormField } from '@/features/auth/form';
import { countryName, flagEmoji, searchCountries } from '@/lib/countries';
import { COVER_ASPECT, pickAndPrepareImage, type PreparedImage } from '@/lib/images';
import { colors, fontFamily } from '@/theme/tokens';

const MAX_COUNTRIES = 20;

/** A real YYYY-MM-DD calendar date; returns the error, null when valid. */
function validateDate(raw: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'Use YYYY-MM-DD.';
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isReal ? null : 'That date does not exist.';
}

function CountryPickerModal({
  visible,
  selected,
  onToggle,
  onClose,
}: {
  visible: boolean;
  selected: string[];
  onToggle: (code: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const results = searchCountries(query);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-surface px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <Text accessibilityRole="header" className="font-display text-xl text-ink">
            Countries
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done picking countries"
            onPress={onClose}>
            <Text className="font-sans-semibold text-base text-primary">Done</Text>
          </Pressable>
        </View>
        <TextInput
          accessibilityLabel="Search countries"
          value={query}
          onChangeText={setQuery}
          placeholder="Search countries"
          placeholderTextColor={colors.inkFaint}
          autoCorrect={false}
          className="mt-3 rounded-lg border border-borderStrong bg-white px-4 py-3 font-sans text-base text-ink"
        />
        <FlatList
          className="mt-2 flex-1"
          data={results}
          keyExtractor={(c) => c.code}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.code);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name}${isSelected ? ', selected' : ''}`}
                onPress={() => onToggle(item.code)}
                className="flex-row items-center gap-3 border-b border-border py-3">
                <Text className="text-xl">{flagEmoji(item.code)}</Text>
                <Text className="flex-1 font-sans text-base text-ink">{item.name}</Text>
                {isSelected ? (
                  <Text className="font-sans-bold text-base text-primary">✓</Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

export type TripFormProps = {
  /** Pre-fill for editing; omit for creation. */
  initial?: Pick<Trip, 'title' | 'description' | 'country_codes' | 'start_date' | 'end_date'>;
  /** Display URL of the trip's existing cover (edit only). */
  initialCoverUri?: string | null;
  submitLabel: string;
  busyLabel: string;
  busy: boolean;
  /** Submit-time error from the mutation, shown above the form. */
  error: string | null;
  onSubmit: (input: TripDetailsInput) => void;
};

/** One form for create and edit so the two screens can't drift. Validation
 *  errors appear after the first submit attempt. */
export function TripForm({
  initial,
  initialCoverUri,
  submitLabel,
  busyLabel,
  busy,
  error,
  onSubmit,
}: TripFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [countryCodes, setCountryCodes] = useState<string[]>(initial?.country_codes ?? []);
  const [startDate, setStartDate] = useState(initial?.start_date ?? '');
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [coverDraft, setCoverDraft] = useState<PreparedImage | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const trimmedTitle = title.trim();
  const titleError =
    trimmedTitle.length >= 1 && trimmedTitle.length <= 80
      ? null
      : 'Give your trip a title (1–80 characters).';
  const descriptionError =
    description.trim().length <= 280 ? null : 'Description must be 280 characters or fewer.';
  const countriesError = countryCodes.length >= 1 ? null : 'Pick at least one country.';
  const startError = validateDate(startDate);
  const endError =
    validateDate(endDate) ??
    (startError === null && endDate < startDate ? 'To date is before the from date.' : null);
  const valid = !titleError && !descriptionError && !countriesError && !startError && !endError;

  const coverUri = coverDraft?.uri ?? initialCoverUri ?? null;

  function toggleCountry(code: string) {
    setCountryCodes((codes) => {
      if (codes.includes(code)) return codes.filter((c) => c !== code);
      if (codes.length >= MAX_COUNTRIES) return codes;
      return [...codes, code];
    });
  }

  async function pickCover() {
    setPickError(null);
    try {
      const prepared = await pickAndPrepareImage('cover');
      if (prepared) setCoverDraft(prepared);
    } catch (e) {
      setPickError(e instanceof Error ? e.message : 'Could not pick that image.');
    }
  }

  function handleSubmit() {
    setAttempted(true);
    if (!valid) return;
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || null,
      countryCodes,
      startDate,
      endDate,
      cover: coverDraft,
    });
  }

  const show = (fieldError: string | null) => (attempted ? (fieldError ?? undefined) : undefined);

  return (
    <View>
      <FormError message={error ?? pickError} />

      <View className="mb-4">
        <Text className="mb-1 font-sans-semibold text-sm text-ink">Cover photo (optional)</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={coverUri ? 'Change cover photo' : 'Add cover photo'}
          onPress={pickCover}
          className="items-center justify-center overflow-hidden rounded-lg bg-secondary"
          style={{ width: '100%', aspectRatio: COVER_ASPECT }}>
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text className="font-sans text-sm text-white">Tap to add a cover photo</Text>
          )}
        </Pressable>
      </View>

      <FormField
        label="Trip title"
        value={title}
        onChangeText={setTitle}
        error={show(titleError)}
        placeholder="e.g. Thailand 2026"
        maxLength={80}
      />
      <FormField
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        error={show(descriptionError)}
        placeholder="One line about this trip"
        maxLength={280}
        multiline
      />

      <View className="mb-4">
        <Text className="mb-1 font-sans-semibold text-sm text-ink">Countries</Text>
        <View className="flex-row flex-wrap items-center gap-2">
          {countryCodes.map((code) => (
            <Pressable
              key={code}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${countryName(code)}`}
              onPress={() => toggleCountry(code)}
              className="flex-row items-center gap-1.5 rounded-full border border-borderStrong bg-surfaceRaised px-3 py-1.5">
              <Text className="text-sm">{flagEmoji(code)}</Text>
              <Text className="font-sans text-sm text-ink">{countryName(code)}</Text>
              <Text className="font-sans text-sm text-inkMuted">×</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add countries"
            onPress={() => setPickerOpen(true)}
            className="rounded-full border border-primary px-3 py-1.5"
            style={{ borderStyle: 'dashed' }}>
            <Text className="font-sans-semibold text-sm text-primary">
              {countryCodes.length === 0 ? '+ Add countries' : '+ Add'}
            </Text>
          </Pressable>
        </View>
        {show(countriesError) ? (
          <Text className="mt-1 font-sans text-sm text-primary">{countriesError}</Text>
        ) : null}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="From"
            value={startDate}
            onChangeText={setStartDate}
            error={show(startError)}
            placeholder="YYYY-MM-DD"
            style={{ fontFamily: fontFamily.mono }}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="To"
            value={endDate}
            onChangeText={setEndDate}
            error={show(endError)}
            placeholder="YYYY-MM-DD"
            style={{ fontFamily: fontFamily.mono }}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
          />
        </View>
      </View>

      <AuthButton label={busy ? busyLabel : submitLabel} onPress={handleSubmit} busy={busy} />

      <CountryPickerModal
        visible={pickerOpen}
        selected={countryCodes}
        onToggle={toggleCountry}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
