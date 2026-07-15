# Tasks — add-profile-media-and-storage

## 1. Database

- [x] 1.1 Migration `add_profile_media_and_birthday`: rename `profiles.avatar_url` → `avatar_path`; add `cover_path text`
- [x] 1.2 Same migration: `private_profiles` table (id → profiles.id cascade, `birthday date` with 1900-to-age-13 CHECK), RLS (owner-only SELECT/UPDATE, no client INSERT/DELETE), replace `handle_new_user` to also insert the private row, backfill rows for existing profiles
- [x] 1.3 Same migration: `profile-media` bucket (`public = true`) + own-prefix INSERT/DELETE policies + authenticated SELECT (mirror trip-media shape)
- [x] 1.4 `supabase db push` to staging; regenerate `src/data/types.ts` via `supabase gen types` _(pushed + regenerated, 2026-07-16)_

## 2. Storage core

- [x] 2.1 Add `expo-image-manipulator` (`npx expo install`) _(~14.0.8)_
- [x] 2.2 `src/lib/images.ts`: `pickAndPrepareImage(preset)` with `avatar` (square crop, 512px), `cover` (1600w), `tripPhoto` (2048w) presets
- [x] 2.3 `src/data/storage.ts`: `uploadImage`, `publicUrl`, `createSignedUrls`, `removeObjects`, `useSignedUrls(bucket, paths)` (TTL/staleTime logic lifted from media.ts)
- [x] 2.4 Refactor `src/data/media.ts` onto the core, exports unchanged (`uploadTripPhoto`, `useSignedPhotoUrls`); composer picking moves to the `tripPhoto` preset

## 3. Profile data layer

- [x] 3.1 `profiles.ts`: extend `useMyProfile` to read `private_profiles.birthday` (exposed as `MyProfile`); patch type gains `birthday`
- [x] 3.2 `profiles.ts`: `setMyAvatar(prepared)` / `setMyCover(prepared)` mutations — upload unique filename → patch row → best-effort delete old path → invalidate `my-profile`

## 4. UI

- [x] 4.1 Edit profile screen: cover picker (band preview), avatar picker (overlapping circle, camera affordance), birthday field (Space Mono `YYYY-MM-DD`, real-date + age ≥ 13 validation), keeping existing name/bio flow and dirty-checking
- [x] 4.2 Profile header: cover photo replaces the teal band when set (expo-image, cover fit); avatar photo replaces the initial circle; both fall back gracefully

## 5. Verification

- [x] 5.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-16; format run also settled pre-existing line-ending drift in 8 untouched files)_
- [ ] 5.2 Device walk: set avatar + cover (render immediately, old files deleted in storage), edit birthday (persists, pre-fills, underage rejected), second account cannot read the birthday, trip photo posting still works end-to-end after the media.ts refactor
