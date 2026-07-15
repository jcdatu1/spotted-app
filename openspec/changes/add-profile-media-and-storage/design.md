# Design — add-profile-media-and-storage

## Context

Explored 2026-07-16. The trip-media pattern (private bucket, own-prefix `{uid}/...` write policies, batched signed URLs) already exists in `supabase/migrations/20260716180000_add_trips_and_updates.sql` and `src/data/media.ts`; this change generalizes it rather than inventing a parallel system. The mockup's CREATOR PROFILE section has no cover-photo concept (flat teal gradient band) — cover-replaces-band is a product decision from exploration, with the gradient as the empty state. Decisions confirmed with the user: birthday owner-only; public bucket for profile media; trip-media refactors onto the core; cover photo replaces the teal band.

## Goals / Non-Goals

**Goals:** complete edit-profile (cover, avatar, name, bio, birthday); a storage core any future bucket can reuse (modular, optimized, repeatable); real media in the profile header with graceful fallbacks.
**Non-Goals:** displaying birthday or age anywhere; audience (other-user) profile screens; image moderation; video.

## Decisions

### D1: Bucket-agnostic storage core; per-bucket access mode

`src/data/storage.ts` owns the Supabase Storage surface: `uploadImage(bucket, path, prepared)`, `publicUrl(bucket, path)`, `createSignedUrls(bucket, paths)`, `removeObjects(bucket, paths)`, and a `useSignedUrls(bucket, paths)` hook (the TTL/staleTime logic lifted from media.ts). Access mode is a per-bucket choice, which is the modularity: `trip-media` stays private + signed; `profile-media` is public + stable URLs. Domain modules (`media.ts`, `profiles.ts`) stay thin and typed; components never touch `client.storage` directly (extends the "all data access through src/data/" convention). `media.ts` keeps its exports (`uploadTripPhoto`, `useSignedPhotoUrls`) so no component changes from the refactor.

### D2: Client-side image preparation presets

`src/lib/images.ts` pairs expo-image-picker with expo-image-manipulator behind `pickAndPrepareImage(preset)`: `avatar` (square crop in the picker, resize to 512px, JPEG ~0.8), `cover` (resize to 1600px wide), `tripPhoto` (resize to 2048px wide). Uploads are always right-sized JPEG/PNG — the "optimized" half of the ask. The composer's inline picking migrates to the `tripPhoto` preset (behavioral upgrade: trip photos gain resizing; requirement text unchanged).

### D3: Public profile-media bucket, unique filenames, delete-old lifecycle

`profile-media` is provisioned by migration as `public = true` with own-prefix INSERT/DELETE policies (copy of the trip-media shape) plus authenticated SELECT. Avatars appear everywhere at scale — hourly signed-URL churn on every list row is the wrong cost, and profiles are already app-readable by design. Upload lifecycle: upload to `{uid}/avatar-{unique}.jpg` (or `cover-`) → patch the profile row → best-effort delete of the previous path. Unique filenames make cache invalidation automatic (URL changes) and deletion prevents orphan accumulation. Failure ordering: if the row patch fails, the just-uploaded file is best-effort deleted; the row never references a missing file because upload precedes patch.

### D4: Paths in the database, never URLs

Rename the never-used `profiles.avatar_url` → `avatar_path`; add `cover_path text`. Matches locked decision #7's `media_path` convention — URLs are derived at render time (`publicUrl`), so bucket host changes never touch data.

### D5: Birthday lives in `private_profiles`, not on `profiles`

`profiles` SELECT is app-wide by design and RLS is row-level, not column-level — a birthday column there would leak DOB to every user. New table: `private_profiles (id uuid pk references profiles(id) on delete cascade, birthday date)` with CHECK `birthday between '1900-01-01' and current_date - interval '13 years'` (write-time age gate, App Store/COPPA hygiene). RLS: SELECT/UPDATE only `auth.uid() = id`; no client INSERT/DELETE (mirrors profiles). The `handle_new_user` trigger inserts the row at sign-up; the migration backfills existing users. Data layer reads it via embedded select (`profiles` → `private_profiles(birthday)`), which resolves to null for anyone but the owner.

### D6: Birthday input is a masked text field, not a native picker

`YYYY-MM-DD` Space Mono input (on-brand "boarding-pass" detail) with client validation (real date, ≥13). Avoids a new native dependency (`@react-native-community/datetimepicker`) in Expo Go; swappable later without schema impact.

### D7: Header rendering with fallbacks

Cover set → `expo-image` renders the public URL in the band (fixed height, cover fit); unset → existing teal band. Avatar set → circular `expo-image`; unset → existing initial-in-coral-circle. Edit screen previews use the same components, so edit and display can't drift.

## Risks / Trade-offs

- [Public bucket means anyone with a URL can fetch profile images] → accepted: profiles are app-readable by design and avatars/covers are the least sensitive media; unique filenames are unguessable (no enumeration).
- [Best-effort delete can strand old files on network failure] → acceptable orphan rate for MVP; paths are owner-prefixed so a cleanup job stays possible.
- [expo-image-manipulator is a new dependency] → Expo SDK 54 package, Expo Go-compatible; verify on-device during the walk.
- [Backfill must cover existing staging users] → migration inserts `private_profiles` rows from `profiles` before the trigger change is relied on.
- [CHECK using current_date is write-time only] → exactly the desired semantics for an age gate; rows are not re-validated as time passes.

## Migration Plan

One migration (`add_profile_media_and_birthday`): profiles column rename + `cover_path`; `private_profiles` + RLS + CHECK; `handle_new_user` replaced to also insert the private row; backfill; `profile-media` bucket + policies. `supabase db push` to staging, regenerate types, verify on device, prod later per environment convention.

## Open Questions

- None blocking.
