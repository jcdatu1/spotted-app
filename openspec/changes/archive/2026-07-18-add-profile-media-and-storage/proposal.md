# add-profile-media-and-storage

## Why

The edit-profile screen stops at display name + bio while the profiles table carries a never-used `avatar_url` column, and every profile still renders an initial in a coral circle under a flat teal band. Meanwhile the app's only storage machinery (`src/data/media.ts`) is hardcoded to the `trip-media` bucket — the next media feature would copy-paste it. This change completes profile editing (cover photo, profile photo, display name, bio, birthday) and, in doing so, extracts the storage pattern into a modular, repeatable core.

## What Changes

- **Storage core (new capability)**: a bucket-agnostic module (`src/data/storage.ts`) for uploads, public URLs, batched signed URLs, and deletion; client-side image preparation presets (`src/lib/images.ts` — pick, crop, resize, compress via expo-image-manipulator) so every image is right-sized before upload. `media.ts` refactors onto the core with unchanged exports and behavior.
- **Profile media**: new **public** `profile-media` bucket (migration-provisioned, own-prefix write policies). Avatars and covers upload under unique filenames, the profile row stores the path, and the previous file is deleted — stable public URLs, natural cache invalidation. Rename unused `avatar_url` → `avatar_path`; add `cover_path`.
- **Birthday (owner-private)**: new `private_profiles` table (id → profiles.id, `birthday date`, age ≥ 13 CHECK) with owner-only RLS, auto-provisioned by the sign-up trigger and backfilled for existing users. Birthday is never readable by other users and is not displayed anywhere yet.
- **Edit profile screen**: gains cover picker, avatar picker, and birthday field (masked `YYYY-MM-DD` Space Mono input — no date-picker dependency) alongside the existing name/bio fields.
- **Profile header**: cover photo replaces the teal band when set (teal gradient remains the empty state); avatar photo replaces the initial circle (initial remains the fallback).

Out of scope: displaying birthday/age anywhere, other users' profile views, video, moderation of uploaded images.

## Capabilities

### New Capabilities

- `media-storage`: the shared storage system — bucket provisioning pattern, storage core module, image-prep presets, public-vs-signed access modes, cache-busting upload lifecycle.

### Modified Capabilities

- `user-profiles`: profile editing expands to avatar, cover, and birthday; the profile header renders real media with graceful fallbacks; birthday is owner-private by design.

## Impact

- **Database**: one migration — `profiles` column rename + `cover_path`; `private_profiles` table + RLS + trigger extension + backfill; `profile-media` bucket + storage policies. Regenerate `src/data/types.ts`.
- **Code**: new `src/data/storage.ts`, `src/lib/images.ts`; `src/data/media.ts` refactored onto the core; `src/data/profiles.ts` (avatar/cover/birthday mutations, private-row read); `src/features/profile/edit-profile-screen.tsx` (new fields); `src/features/profile/profile-screen.tsx` (cover + avatar rendering).
- **Dependencies**: adds `expo-image-manipulator` (Expo SDK package, Expo Go-safe). `expo-image` (installed) renders profile media.
- **Follow-on**: video posters, itinerary exports, and any future bucket reuse the core + migration pattern; audience profile views inherit the header rendering.
