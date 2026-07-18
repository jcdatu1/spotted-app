# Tasks — rework-trip-thread-shell

## 1. Navigation restructure (persistent tab bar)

- [x] 1.1 Verify shared-route push behavior against Expo Router SDK 54 docs (does `router.push('/trip/[id]')` stay in the current group?); note the answer in design.md if it changes D1 _(confirmed: push stays in the current group; deep links pick first alphabetical group — design.md D1 updated. Consequence: root-stack `replace` calls into the thread are group-qualified to `/(tabs)/(profile)/trip/[id]` in trip/new.tsx and trip/[id]/edit.tsx)_
- [x] 1.2 Extract `pushedHeader` to a shared module (`src/theme/navigation.ts`); create `(home)`, `(discover)`, `(profile)` group dirs each with a Stack `_layout.tsx` (+ `unstable_settings.initialRouteName`) and their root screens moved in
- [x] 1.3 Move `trip/[id]/index.tsx` and `user/[id].tsx` into `(home,discover,profile)/`; header options set inline via `<Stack.Screen options={{ ...pushedHeader, ... }}>` in both route files
- [x] 1.4 Update `(tabs)/_layout.tsx` screen names to the group names; drop the moved registrations from the root layout (keep `trip/new`, `trip/[id]/edit`, `profile/edit`)
- [ ] 1.5 Walk every entry point (home list, discover results, profile cards, audience profile trips): trip thread and user profile keep the tab bar + correct tab highlight + chevron-only back button _(device test — pending)_

## 2. Context-aware + button and composer sheet

- [x] 2.1 `src/features/composer/composer-store.ts`: zustand store with `ownedTrip` and `sheet` per design D2
- [x] 2.2 `TripThreadScreen`: register/clear `ownedTrip` via `useFocusEffect` when owner (drafts included)
- [x] 2.3 Tab button (renamed `CenterActionButton`): read the store — owned thread focused → open picker (label "Add update"); otherwise push `/trip/new`
- [x] 2.4 `composer-sheet.tsx`: RN Modal with picker stage (Note / Photo / Purchase / Place) and form stage ported from `ComposerBar` (validation, photo upload, `FormError`, pending states); successful post closes the sheet
- [x] 2.5 Remove `ComposerBar` from the thread (delete `composer-bar.tsx`), drop the screen-level `KeyboardAvoidingView`, update owner empty-state copy to point at the + button

## 3. Thread alignment

- [x] 3.1 `UpdateBubble`: `own` prop flips `self-start`/`self-end` and timestamp alignment on all four variants (no styling changes); `TripThreadScreen` passes `isOwner`

## 4. Documentation

- [x] 4.1 SPOTTED_BIBLE.md: navigation structure (per-tab stacks, shared routes), context-aware + button, composer sheet, alignment rule, changelog entry (sections 3, 6, 7, 15, 16, 17)

## 5. Verification

- [x] 5.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-18; also verified the full iOS bundle compiles via `npx expo export`. Note: `.expo/types/router.d.ts` was corrupted by the running dev server's incremental typegen during the route moves — two `as unknown as Href` casts cover the group-qualified hrefs until a dev-server restart regenerates it cleanly)_
- [ ] 5.2 Device walk: post all four update types via + from an owned trip (draft and published); + pushes New trip from every tab, another user's trip, and an audience profile; owner sees own thread right-aligned, a second account sees it left-aligned; publish flow from the draft banner still works _(pending — restart the dev server first: routes moved, Metro needs a cold start, e.g. `npx expo start -c --tunnel`)_
- [ ] 5.3 Android-specific: keyboard inside each sheet form never occludes submit or lifts the tab bar oddly; hardware back pops within the tab stack, not out of the app _(pending)_
