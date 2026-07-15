import { useQuery } from '@tanstack/react-query';

import { getSupabaseConfig, SupabaseConfigError } from './client';

export type BackendHealth =
  { ok: true; latencyMs: number } | { ok: false; latencyMs: number | null; reason: string };

const HEALTH_TIMEOUT_MS = 4000;

/**
 * Verifies connectivity to the (local) Supabase stack without touching any
 * table — the scaffold ships no schema. Hits the GoTrue health endpoint,
 * which requires only the anon key.
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  let config;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return { ok: false, latencyMs: null, reason: error.message };
    }
    throw error;
  }

  const startedAt = Date.now();
  // Manual abort timer — AbortSignal.timeout() is not available in React Native's fetch.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}/auth/v1/health`, {
      headers: { apikey: config.anonKey },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return { ok: false, latencyMs, reason: `Supabase responded with HTTP ${response.status}` };
    }
    return { ok: true, latencyMs };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      latencyMs: null,
      reason: `Could not reach Supabase (${detail}). Check .env values and that the staging project is not paused.`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['backend-health'],
    queryFn: checkBackendHealth,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
