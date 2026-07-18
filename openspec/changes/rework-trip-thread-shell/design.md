# Design — rework-trip-thread-shell

## Context

`trip/[id]/index` and `user/[id]` are root-stack siblings of `(tabs)` (src/app/_layout.tsx), so pushing them covers the tab navigator entirely. The composer is a pinned in-thread bar (`src/features/composer/composer-bar.tsx`) owning both type selection and the four forms. All `UpdateBubble` variants hardcode `self-start`. Decisions below settled in explore mode: composer moves to the + button with sheet forms (inline bar removed), alignment-only SMS treatment, form screens stay full-screen, + defaults to "new trip" everywhere but an owned thread.

## Goals / Non-Goals

**Goals:** tab bar visible on trip threads and user profiles from any tab; context-aware center + button; type picker + bottom-sheet composer for owners; viewer-relative thread alignment.
**Non-Goals:** outbound bubble styling (colors), tab bar on `trip/new` / edit screens, changes to update types, storage, RLS, or budget rollup; new dependencies.

## Decisions

### D1: Shared route groups give each content tab a stack

`(tabs)` gains three group directories — `(home)`, `(discover)`, `(profile)` — each with a Stack `_layout.tsx` and its root screen moved in (`index.tsx`, `discover.tsx` → `(discover)/index.tsx`, `profile.tsx` → `(profile)/index.tsx`). The pushed screens live once in a shared group `(home,discover,profile)/` — `trip/[id]/index.tsx` and `user/[id].tsx` — so each tab's stack mounts them and a push from Discover stays in Discover with the bar visible. `settings.tsx` and the dummy `create.tsx` stay flat (no push targets). The tab layout's screen names become `(home)`, `(discover)`, `(profile)`. Root layout keeps `trip/new`, `trip/[id]/edit`, `profile/edit` as full-screen pushes and drops the two moved registrations.

The `pushedHeader` options object moves from the root layout to a shared module (e.g. `src/theme/navigation.ts`) imported by the root layout *and* the three group layouts. Header titles for the shared screens are set inline via `<Stack.Screen options>` in the route files themselves (the thread route already does this) — this sidesteps the known name-matching pitfall where layout-level `Stack.Screen name="trip/[id]/index"` entries silently drop options when paths shift.

**Verified against Expo Router docs (2026-07-18):** pushing a shared route from a focused tab stays in that tab's group ("When you're already focused on a tab and navigating to a user, you will stay in that current tab's group" — Common navigation patterns); deep links from outside the app pick the first group alphabetically, which is acceptable. Existing `router.push` call sites need no changes.

### D2: The thread advertises ownership through a zustand store

New `src/features/composer/composer-store.ts`:

```
{ ownedTrip: { tripId, defaultCurrency } | null, sheet: 'picker' | ComposerType | null }
```

`TripThreadScreen` registers via `useFocusEffect` when `isOwner` (set on focus, clear on blur/unmount), so back-navigation and tab switches naturally restore the + button's default. The tab button reads `ownedTrip`: set → `sheet = 'picker'`; null → `router.push('/trip/new')`. Navigation-state inspection from the tab bar was rejected as fragile with nested stacks. Drafts count as owned threads — posting to a draft is the primary draft workflow.

### D3: Composer sheet is a built-in RN Modal, two stages, mounted by the thread screen

`src/features/composer/composer-sheet.tsx` renders inside `TripThreadScreen` (it owns `tripId`, `defaultCurrency`, and the create mutation) and subscribes to `sheet`: `'picker'` shows the four-type grid (icons/labels reused from today's `TYPE_BUTTONS`); picking a type transitions the same modal to that type's form, ported unchanged from `ComposerBar` (fields, client-side validation mirroring the CHECK constraints, photo pick/upload flow, error surface). Bottom-anchored card over a dimmed backdrop, `animationType="slide"`, `KeyboardAvoidingView` inside the modal. RN `Modal` renders above the tab bar natively — no z-index games, no `@gorhom/bottom-sheet` dependency (Expo Go safe). Successful post closes the sheet and the thread refreshes via the existing invalidation; `ComposerBar` is deleted.

### D4: Alignment is a boolean prop, not per-update logic

Every update in a thread is authored by the trip owner, so alignment is uniform per screen: `UpdateBubble` gains `own: boolean`; `own` swaps the container to `self-end` and right-aligns the timestamp; all four variants keep their exact card styling. `TripThreadScreen` passes its existing `isOwner`. No color changes in this change.

### D5: Keyboard interplay resolves by construction, with one explicit test

With the inline composer gone, the thread screen has no bare inputs — the keyboard only ever appears inside the modal, which floats above the tab bar. The screen-level `KeyboardAvoidingView` in `TripThreadScreen` becomes unnecessary and is removed. Android device test stays mandatory: keyboard open in each form must not shove the tab bar above the sheet or leave the submit button occluded.

## Risks / Trade-offs

- [Shared-route push resolution differs on SDK 54] → verified first in task 1; fallback is group-qualified/relative hrefs at the handful of `router.push` call sites.
- [Route restructure silently drops header options] → known pitfall; mitigated by setting options inline in route files, and the device walk checks every pushed screen for the chevron-only back button.
- [Store desync leaves + in the wrong mode] → registration is focus-scoped (`useFocusEffect` cleanup), so any blur clears it; worst case + falls back to "new trip", which is safe.
- [RN Modal lacks bottom-sheet gestures (drag-to-dismiss)] → acceptable for MVP; backdrop tap and a close affordance dismiss. Swappable for a sheet lib later without touching the store contract.
- [Android back button inside nested tab stacks] → device walk verifies back pops the stack within the tab, not the app.

## Migration Plan

Pure client change — no migrations, no type regen. Ship as one PR; route moves and composer swap land together (the thread without `ComposerBar` is only correct once + posts).

## Open Questions

- None blocking.
