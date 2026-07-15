import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

/**
 * The ONLY place the Supabase client is created. Everything outside src/data
 * must go through functions/hooks exported from this directory (enforced by
 * the no-restricted-imports ESLint rule).
 */

export type SupabaseConfig = { url: string; anonKey: string };

export class SupabaseConfigError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing Supabase environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the values printed by `supabase start`.',
    );
    this.name = 'SupabaseConfigError';
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    ...(url ? [] : ['EXPO_PUBLIC_SUPABASE_URL']),
    ...(anonKey ? [] : ['EXPO_PUBLIC_SUPABASE_ANON_KEY']),
  ];
  if (!url || !anonKey) {
    throw new SupabaseConfigError(missing);
  }
  return { url, anonKey };
}

let client: SupabaseClient<Database> | undefined;

/** Lazily created singleton so a missing .env fails with a clear error, not a crash on import. */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    const { url, anonKey } = getSupabaseConfig();
    client = createClient<Database>(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
