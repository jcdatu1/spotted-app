# rework-trip-cards-and-engagement

## Why

The profile trip cards drifted from the mockup: the design overlays status badges on the cover image (pulsing coral LIVE, teal COMPLETED) with exact chip colors the app doesn't use, and the "stops" chip carries no reader value. There's also nothing measuring whether anyone actually reads a trip — no views, no saves — and the profile saves stat is hardcoded 0. Finally, `rework-trip-thread-shell` introduced a stranding bug: creating then publishing a trip leaves the thread as the *only* screen in the Profile tab's stack (the group-qualified `router.replace` replaced the profile root), so there's no back button and the Profile tab lands on the thread instead of the profile.

## What Changes

- **Trip cards match the mockup** (shared `TripCard`, so all surfaces get it): 96px cover, radius-20 card with `#EDE4D8` border and soft shadow, mono code line, Fraunces title, dates line — plus **overlay badges on the cover** copied exactly: LIVE (`rgba(255,106,77,.95)`, white pulsing dot, 999px pill, 9px/700) and COMPLETED (teal `rgba(15,123,108,.95)`), and body status chips with mockup colors (live `#FFE7E1`/`#FF6A4D`, completed `#DDF0EC`/`#0F7B6C`).
- **Stops chip removed from cards**; profile cards instead show **views** and **saves** count chips. The data-layer stops count stays (spec-mandated, UI-optional).
- **Views tracking**: new `trip_views` table (one row per viewer per trip); a non-owner opening a published thread records a view; owners never count themselves (client guard + RLS `WITH CHECK`).
- **Saves**: new `trip_saves` table + a Save/Saved toggle on the thread for non-owner viewers (teal, per brand). Counts surface on profile cards and the **profile saves stat becomes real** — the sum of saves across the creator's trips — on both the owner and audience profile.
- **Counts** come from a new `trip_engagement` view (security-invoker, per-trip view/save counts) read through a typed `src/data/engagement.ts`.
- **Bug fix (side quest)**: the create-trip flow no longer `replace`s into the `(profile)` group (it pops `trip/new` and pushes the thread in the originating tab, so back always works); the draft-edit bounce uses back-navigation too; and the Profile tab gets `popToTopOnBlur` so pressing Profile always lands on the profile landing page.

Out of scope: a saved-trips list surface (passport), reactions, view dedup windows / analytics, unpublish handling, save notifications.

## Capabilities

### New Capabilities

- `trip-engagement`: views and saves — storage, RLS, counting semantics, the thread save toggle, card indicators, and profile saves totals.

### Modified Capabilities

- `user-profiles`: the saves stat becomes the real total of saves across the user's trips on both profile surfaces.
- `project-scaffold`: the Profile tab strictly lands on the profile root; navigation flows must never leave a tab stack without its root screen.

## Impact

- **Code**: migration 6 (`trip_views`, `trip_saves`, `trip_engagement` view, RLS) + `src/data/types.ts` regen; new `src/data/engagement.ts`; `src/features/trips/trip-card.tsx` (mockup layout, overlay badges, views/saves chips, stops prop removed); `src/features/profile/profile-screen.tsx` + `audience-profile-screen.tsx` (engagement fetch, real saves stat); `src/features/trip-thread/thread-screen.tsx` (view recording, Save toggle); `src/app/trip/new.tsx` + `src/app/trip/[id]/edit.tsx` (nav fix, `Href` casts removed); `src/app/(tabs)/_layout.tsx` (`popToTopOnBlur`); `SPOTTED_BIBLE.md`.
- **Dependencies/Systems**: one Supabase migration (staging → prod flow); no new packages.
- **Follow-on**: passport/saved-list surface consuming `trip_saves`, reactions, ranked discovery using engagement signals.
