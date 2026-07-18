# Tasks — update-display-cleanup

## 1. Home

- [x] 1.1 Remove `HealthCard` and its `ListFooterComponent` slot from `src/app/(tabs)/index.tsx`; drop the `useHealthCheck` import. Leave `src/data/health.ts` in place, unreferenced.

## 2. Sign out → Settings

- [x] 2.1 Build the Account Management section in `src/app/(tabs)/settings.tsx`: uppercase tracking-widest muted heading + bordered `surfaceRaised` row card; first row "Sign out" (`text-primary`) calling `signOut()`
- [x] 2.2 Remove the sign-out block from `src/features/profile/profile-screen.tsx` and its now-unused imports (`signOut`, `AuthButton` if orphaned)

## 3. Profile CTA height

- [x] 3.1 Tighten `StartTripCard` (keep centered layout): reduce vertical padding/gaps so its height matches the intrinsic ~100px of `TripCard`; verify side by side on device before considering a pinned height

## 4. ImageInputField

- [x] 4.1 Create `src/features/ui/image-input-field.tsx`: empty state (`surfaceSunken` fill, dashed `borderStrong` border, centered `+` in `inkMuted`) and filled state (image + ~25% black scrim + centered white `+`); `cover` (16:9 rect), `avatar` (circle), and `photo` variants; accessibility label prop
- [x] 4.2 Adopt in `src/features/profile/edit-profile-screen.tsx`: cover picker and avatar picker; remove the "Change photo" label and the "Tap to add a cover photo" text
- [x] 4.3 Adopt in `src/features/trips/trip-form.tsx` cover picker (replaces the solid-teal empty state)

## 5. Back button label

- [x] 5.1 Add `headerBackButtonDisplayMode: 'minimal'` to `pushedHeader` in `src/app/_layout.tsx` and to the auth stack's `screenOptions` in `src/app/(auth)/_layout.tsx`; remove the auth stack's unused `headerBackTitleStyle`

## 6. Country picker sheet

- [x] 6.1 Rework `CountryPickerModal` in `src/features/trips/trip-form.tsx`: `transparent` Modal, bottom-anchored container at ~80% screen height with rounded top corners, dim pressable backdrop (tap dismisses); search/list/Done internals unchanged

## 7. Documentation

- [x] 7.1 SPOTTED_BIBLE.md: add the image-input-field guideline (empty/filled states, warm-gray tokens, dashed-coral CTA vs dashed-gray empty-input distinction), reflect sign-out's new home, the HealthCard removal, the minimal back button, and the country-picker sheet, update changelog

## 8. Verification

- [x] 8.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-18)_
- [ ] 8.2 Device walk: Home renders without the status card; Settings shows Account Management and sign out returns to auth; CTA card matches trip-card height; all three image inputs show the dashed-gray empty state and scrim-`+` filled state; pushed screens show a chevron-only back button (no "(tabs)"); country picker opens at ~80% height with the status bar area clear on iOS
