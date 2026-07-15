import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signUp } from '@/data/auth';
import { isUsernameAvailable } from '@/data/profiles';
import { AuthButton, FormError, FormField } from '@/features/auth/form';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type FieldErrors = Partial<Record<'email' | 'password' | 'username' | 'displayName', string>>;

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!USERNAME_PATTERN.test(username.trim().toLowerCase())) {
      errors.username = '3–20 characters: lowercase letters, numbers, underscores.';
    }
    const trimmedName = displayName.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      errors.displayName = 'Display name must be 1–50 characters.';
    }
    return errors;
  }

  async function handleSubmit() {
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const available = await isUsernameAvailable(username);
      if (!available) {
        setFieldErrors({ username: 'That username is already taken.' });
        return;
      }
      await signUp({ email, password, username, displayName });
      // Navigation flips automatically via the session guard in the root layout.
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Sign-up failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" className="mb-6 font-display text-3xl text-ink">
            Create your account
          </Text>
          <FormError message={formError} />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <FormField
            label="Username"
            value={username}
            onChangeText={(v) => setUsername(v.toLowerCase())}
            error={fieldErrors.username}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="e.g. jonas_travels"
          />
          <FormField
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            error={fieldErrors.displayName}
            placeholder="How you appear to others"
          />
          <AuthButton label="Create account" onPress={handleSubmit} busy={busy} />
          <Link href="/(auth)/sign-in" className="mt-6 text-center font-sans text-sm text-inkMuted">
            Already have an account?{' '}
            <Text className="font-sans-semibold text-secondary">Sign in</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
