# Design — redesign-profile-screen

## Context

Auth, profiles, and trips are live. The Profile tab (`src/features/profile/profile-screen.tsx`) is form-first; the mockup's CREATOR PROFILE section (decoded `context/Spotted.html`, ~line 744) defines the target look. This change ships the account-holder variant only, but the component structure must anticipate the audience variant (add-follows-and-discovery).

## Goals / Non-Goals

**Goals:**
- Identity-first holder profile matching the mockup: band → avatar → name/username → action button → bio → stats → TRIPS section with boarding-pass cards.
- Editing moves behind an Edit profile button (pushed screen, visible back button) — the user-profiles edit requirement keeps working.
- Real stops counts on trip cards; followers/saves stats show 0 until those features exist.
- A New trip action that fits the design (coral pill in the TRIPS header + empty-state CTA).

**Non-Goals:**
- Audience view, follows/saves backends, avatar upload, trip covers from media, trip dates/LIVE status, settings screen, schema changes.

## Decisions

### D1: Component decomposition for two future variants
`ProfileScreen` composes presentational pieces that take data as props: `ProfileHeader` (band + avatar + name/username + action slot + bio), `ProfileStats` (followers/trips/saves), `ProfileTripsSection` (label row + action slot + cards). The holder screen wires them to `useMyProfile`/`useMyTrips` and passes holder-specific actions (Edit profile, + New trip). The audience screen later passes a Follow button and published-only trips. *Alternative:* a `variant` prop on one smart component — rejected; data sources differ (my profile vs. by-username), props stay cleaner.

### D2: Edit profile is a pushed root-stack screen
New route `src/app/profile/edit.tsx` registered in the root stack inside the session guard with the themed native header (`headerTitle: 'Edit profile'`), matching `trip/new` — this satisfies the visible-back-button convention. The screen reuses `FormField`/`AuthButton`/`FormError` and the existing `useMyProfile`/`useUpdateMyProfile` hooks; on successful save it navigates back. The mockup's button slot ("Follow along" in audience view) renders "Edit profile" as a coral pill.

### D3: Stops count via relationship count, no schema change
`listMyTrips` selects `*, updates(count)` and maps to `TripWithStops = Trip & { stops: number }`. Postgres/RLS already allow the owner to count their updates; no migration, no view. *Alternative:* a `trip_stats` view — deferred until more surfaces need richer stats (the budget view precedent shows how).

### D4: Boarding-pass TripCard, honest to available data
Card per mockup: left cover block (96px wide; brand-tint placeholder rotated per index — no media derivation yet), dashed perforation divider, then Space Mono meta line (created month + year, e.g. `FEB 2026` — the mockup's `CNX 2026` airport code has no data source), Fraunces title, description line, chip row = status chip (DRAFT amber tint / PUBLISHED teal tint — existing `StatusChip` styling) + `N stops` Space Mono chip. The old plain card is replaced; the card stays presentational (props in, no hooks).

### D5: Stats row semantics
`followers: 0` and `saves: 0` are hard-coded defaults rendered through props (so the audience/follow change only swaps inputs); `trips` = `trips.length` from the already-fetched list. Numbers render in Space Mono bold; saves in teal per the mockup.

### D6: Band + safe area
The teal band (`secondary → secondaryBright` feel; solid `secondary` is acceptable without a gradient dependency) extends behind the status bar: the screen uses `useSafeAreaInsets` and gives the band `paddingTop: insets.top` plus its content height, instead of SafeAreaView edges. Avatar overlaps the band bottom by half (−44 margin). No back button here — it's a root tab (convention exempts tab roots); light status-bar icons are NOT toggled per-screen in MVP (band is short; default dark icons stay readable on teal — revisit if not).

### D7: Avatar placeholder
Coral circle (`bg-primary`), 4px surface ring, first letter of display name in `inkInverse` Fraunces. `avatar_url` is read when present later; upload stays deferred. No gradient dependency (expo-linear-gradient not installed).

## Risks / Trade-offs

- [Count query shape differs across supabase-js versions] → verify the generated type mapping compiles; fall back to a second lightweight count query only if the embedded count misbehaves.
- [Stats showing 0 followers/saves could read as broken] → labels render lowercase muted exactly like the mockup; counts become real in their own changes.
- [Removing inline editing regresses muscle memory] → Edit profile button is the primary action in the header block, one tap away.
- [Dark teal band + dark status bar icons may clash on some devices] → acceptable MVP risk, flagged in D6.

## Migration Plan

Code-only change; no database work. Ship behind normal quality gates (typecheck, lint, format, bundle) + device walk of the profile tab, edit flow, and New trip flow.

## Open Questions

- None blocking. Trip covers from first photo update and LIVE/COMPLETED chips wait on trip dates/media decisions.
