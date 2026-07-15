# Tasks — add-auth-and-profiles

## 1. Supabase Setup & First Migration

- [x] 1.1 `npx supabase login` (personal access token) and `npx supabase link --project-ref <staging-ref>`
- [x] 1.2 Write the first migration: `profiles` table (id/username/display_name/avatar_url/bio/created_at/updated_at with CHECK constraints), `handle_new_user` security-definer trigger on `auth.users`, `updated_at` trigger, and RLS policies (authenticated SELECT; owner UPDATE with immutable username; no client INSERT/DELETE)
- [x] 1.3 `npx supabase db push` to staging; verify table, trigger, and policies in the dashboard
- [x] 1.4 Configure staging auth settings: email provider enabled, email confirmation disabled (MVP)
- [x] 1.5 Regenerate types: `npx supabase gen types typescript --linked > src/data/types.ts`

## 2. Data Layer

- [x] 2.1 Install `@react-native-async-storage/async-storage` and `react-native-url-polyfill`; wire both into `src/data/client.ts` (polyfill import + auth storage adapter, autoRefreshToken/persistSession)
- [x] 2.2 Create `src/data/auth.ts`: `signUp({email, password, username, displayName})` (metadata for the trigger), `signIn`, `signOut`, `SessionProvider` + `useSession()` backed by `onAuthStateChange` _(implemented as auth.tsx — provider is JSX)_
- [x] 2.3 Create `src/data/profiles.ts`: `getMyProfile`, `updateMyProfile`, `isUsernameAvailable`, with `useMyProfile` / `useUpdateMyProfile` TanStack Query hooks

## 3. Auth Flow (routes + screens)

- [x] 3.1 Add `SessionProvider` to the root layout; hold the splash screen until initial session restore resolves
- [x] 3.2 Create `src/app/(auth)/` group: welcome, sign-in, and sign-up screens styled from tokens per the Claude Design onboarding (feature components in `src/features/auth/`)
- [x] 3.3 Implement layout-level gating: no session → `(auth)`, session → `(tabs)`; verify a tab route cannot be reached unauthenticated (Stack.Protected guards)
- [x] 3.4 Sign-up form: client-side validation (email format, password length ≥ 8, username pattern) + username availability pre-check with clear inline errors

## 4. Profile Tab

- [x] 4.1 Build `src/features/profile/`: display username + display name from `useMyProfile`, edit display name/bio with save, and sign-out action
- [x] 4.2 Verify an edit persists across an app restart (server state, not local) _(verified on device, 2026-07-16)_

## 5. Verification & Promotion

- [x] 5.1 Quality gates: `typecheck`, `lint`, `format:check` all exit 0 (plus full Metro bundle compiles)
- [x] 5.2 Device verification (Expo Go + staging): sign up a fresh user → lands in tabs; profile row visible in dashboard; restart app → still signed in; sign out → auth flow; sign back in _(verified on device, 2026-07-16)_
- [x] 5.3 RLS spot-check with two test users: user B can read user A's profile; user B's attempted update of user A's profile affects zero rows; username change attempt is rejected _(verified via REST API against staging, 2026-07-16; anon read returns zero rows; test users deleted)_
- [x] 5.4 Promote to prod: `npx supabase link --project-ref <prod-ref>`, `db push`, mirror auth settings; re-link back to staging _(done 2026-07-16: migration on prod, autoconfirm mirrored, CLI re-linked to staging)_
