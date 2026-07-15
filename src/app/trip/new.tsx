import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';

import { useCreateTrip } from '@/data/trips';
import { AuthButton, FormError, FormField } from '@/features/auth/form';

export default function NewTripScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateTrip();

  function handleCreate() {
    setError(null);
    const trimmed = title.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      setError('Give your trip a title (1–80 characters).');
      return;
    }
    if (description.trim().length > 280) {
      setError('Description must be 280 characters or fewer.');
      return;
    }
    create.mutate(
      { title: trimmed, description },
      {
        onSuccess: (trip) => router.replace({ pathname: '/trip/[id]', params: { id: trip.id } }),
        onError: (e) => setError(e instanceof Error ? e.message : 'Could not create trip.'),
      },
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" className="mb-2 font-display text-2xl text-ink">
          Where to next?
        </Text>
        <Text className="mb-6 font-sans text-sm text-inkMuted">
          Trips start as drafts — post updates first, publish when it feels ready.
        </Text>
        <FormError message={error} />
        <FormField
          label="Trip title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Thailand 2026"
          maxLength={80}
        />
        <FormField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="One line about this trip"
          maxLength={280}
          multiline
        />
        <AuthButton
          label={create.isPending ? 'Creating…' : 'Create trip'}
          onPress={handleCreate}
          busy={create.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
