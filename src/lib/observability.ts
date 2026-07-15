/**
 * Sentry and PostHog are initialized only when their env flags are true, so
 * development runs need no DSNs or API keys. Modules are require()d inside
 * the guards to avoid loading the SDKs at all when disabled.
 */

let initialized = false;

export function initObservability(): void {
  if (initialized) return;
  initialized = true;

  if (process.env.EXPO_PUBLIC_SENTRY_ENABLED === 'true') {
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (dsn) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
      Sentry.init({ dsn });
    } else {
      console.warn('EXPO_PUBLIC_SENTRY_ENABLED is true but EXPO_PUBLIC_SENTRY_DSN is not set.');
    }
  }

  if (process.env.EXPO_PUBLIC_POSTHOG_ENABLED === 'true') {
    const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    if (apiKey) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PostHog } = require('posthog-react-native') as typeof import('posthog-react-native');
      posthogClient = new PostHog(apiKey, {
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      });
    } else {
      console.warn(
        'EXPO_PUBLIC_POSTHOG_ENABLED is true but EXPO_PUBLIC_POSTHOG_API_KEY is not set.',
      );
    }
  }
}

let posthogClient: import('posthog-react-native').PostHog | undefined;

/** Undefined unless PostHog is enabled via env flags. */
export function getPostHog() {
  return posthogClient;
}
