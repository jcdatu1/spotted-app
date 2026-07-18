# Design — rework-trip-cards-and-engagement

## Context

The mockup (context/Spotted.html, decoded; profile section ~line 768) specifies the profile trip card exactly: 96px cover with an overlaid LIVE badge (`rgba(255,106,77,.95)` pill, white pulsing dot, 9px/700), radius-20 white card, `#EDE4D8` border, `0 8px 20px -16px` shadow, mono code line, Fraunces 18 title, 11px dates, and a body chip row (status chip `#FFE7E1/#FF6A4D` live, `#DDF0EC/#0F7B6C` completed). The home-feed variant additionally shows a teal COMPLETED overlay. All colors map to existing tokens (primary/primaryTint, secondary/secondaryTint, border, surfaceRaised). The stranding bug: `router.replace('/(tabs)/(profile)/trip/[id]')` from the root stack applies replace semantics inside the `(profile)` stack — it replaced `profile` (the root) with the thread, leaving a one-screen stack: no back chevron, and the Profile tab restores the stranded thread.

## Goals / Non-Goals

**Goals:** mockup-faithful cards with overlay badges; views + saves counts on profile cards; working view tracking (owners excluded); save toggle on the thread for non-owners; real profile saves totals; un-stranded create/publish navigation; Profile tab always lands on the profile root.
**Non-Goals:** saved-trips list surface, reactions, view-count analytics beyond unique viewers, changing home/discover card *content* (they inherit the new chrome but don't fetch engagement), unpublish flows.

## Decisions

### D1: Views and saves are bare edge tables; counts come from a security-invoker view

`trip_views(trip_id → trips, user_id → profiles, created_at, PK (trip_id, user_id))` and `trip_saves` (same shape + `user_id` index for a future saved-list surface). One row per user per trip — a view is "this user has opened this trip", not an event stream; re-opens are free upserts with `ignoreDuplicates`. RLS: SELECT for any authenticated user (counts are public-in-app, matching follows); INSERT only where `auth.uid() = user_id` **and** the target trip is published and not owned by the caller (owners can never count themselves — DB-enforced, not just client); DELETE only on `trip_saves` for one's own row (unsave); no UPDATE anywhere. Counts read from a `trip_engagement` view (`security_invoker = true`) — per-trip `view_count`/`save_count` correlated subqueries over `trips`, so trip visibility keeps flowing from trip RLS (locked decision #5). Trade-off: raw rows reveal *who* viewed/saved to any authenticated user; accepted at MVP scale like `follows`, revisit wholesale with private accounts.

### D2: One data module, batched counts, client-side profile totals

New `src/data/engagement.ts`: `useTripEngagement(tripIds)` (one `.in()` query on the view, keyed `['engagement', ...ids]`, returns a `Record<tripId, {views, saves}>`), `useRecordTripView(trip)` (effect-triggered upsert when `!isOwner && status === 'published'`), `useIsTripSaved(tripId)`, `useSaveTrip()`/`useUnsaveTrip()` (invalidate engagement + is-saved keys). Profile saves totals are **summed client-side** from the same engagement map the cards already need — both profile screens have the user's full trip list in hand, saves can only exist on published (visible) trips, so the sum is complete; no extra RPC. No optimistic updates, matching the app-wide fetch-and-invalidate pattern.

### D3: Card = mockup geometry; overlay badges for live and completed; chips swap stops for views/saves

`TripCard` reworked in place (shared by profile, audience profile, home, discover — all inherit the chrome): cover 96px, `rounded-bubble` (20) card, `border-border`, shadow approximating `0 8px 20px -16px rgba(42,36,32,.5)` (RN has no spread: `shadowOpacity ~0.16, radius 10, offset {0,6}, elevation 3`). Overlay badges top-left 8px on the cover: LIVE = `rgba(255,106,77,.95)` pill, 3px/7px padding, 9px/700 white text, 4px white dot pulsing via an `Animated.loop` opacity cycle (the mockup's `sp-pop`); COMPLETED = same geometry, `rgba(15,123,108,.95)` (home-feed mockup badge); drafts get no overlay (mockup shows none). Body status chips take the mockup palette: live `bg-primaryTint text-primary`, completed `bg-secondaryTint text-secondary`, draft stays `bg-accentTint text-accentPressed`. The `stops` prop is deleted; optional `views`/`saves` props render mono chips styled like the mockup's stops chip (`bg-surfaceRaised`, Space Mono 10px): views in `text-inkMuted`, saves in `text-secondary` (teal = saves). Only the profile surfaces pass them; home/discover cards render without the chips. `TripWithStops` and the data-layer stops count stay (trips spec mandates the data layer, UI is MAY).

### D3b: Home feed gets the mockup's big card, not the boarding-pass strip

The home feed card in the mockup (decoded ~line 518–558) is a distinct, larger card: 148px full-width cover with a bottom gradient scrim, overlaid mono code line + Fraunces-24 white title, a bigger badge variant (11px/700, 5×10 pad, 6px dot, inset 12), a notched horizontal perforation (dashed rule + two 16px surface-colored punch circles), and a footer of creator avatar/name/username with right-aligned STOPS / DAYS mono stats. Implemented as `FeedTripCard` beside `TripCard`; `CoverBadge` gains sm/md size variants. The scrim is a flat `rgba(0,0,0,.34)` band (no gradient dependency). Data: `OWNER_JOIN` gains `avatar_path`, `listPublishedTrips` gains `updates(count)` → `FeedTrip = TripWithOwner & {stops}`; days = inclusive `tripDayCount(start, end)` (`src/lib/dates.ts`). Discover results and profile lists keep the compact boarding-pass card.

### D3c: Spacing gotcha — NativeWind only generates classes for token keys

`tailwind.config.js` replaces the spacing scale wholesale with `tokens.spacing`; a class whose key isn't in the scale (`px-3.5` before this change) compiles to *nothing* — zero padding, silently. Fixed by adding the prototype's off-grid steps `3.5: 14` and `4.5: 18` to `tokens.spacing`. When styling from the mockup, verify every fractional utility against the token scale.

### D4: Save toggle lives in the thread header row, teal, non-owners only

`TripThreadScreen`'s ListHeader byline row becomes `byline (flex-1) + SavePill` for non-owners on published trips: bookmark icon + "Save"/"Saved", unsaved = bordered `border-secondary text-secondary` on white, saved = filled `bg-secondary` white text; disabled while the mutation pends. View recording fires from the same screen via `useRecordTripView` (non-owner + published guard mirrors RLS). Owners see neither.

### D5: Navigation fix — pop-and-push instead of nested replace; Profile tab pops on blur

- `trip/new` success: fully explicit three-step — `router.back()` (dismiss the form), `router.navigate('/(tabs)/(profile)/profile')` (Profile tab, at its root), `router.push('/(tabs)/(profile)/trip/[id]')` (thread above it). **Corrected during implementation:** the first fix (`back()` + bare `push('/trip/[id]')`) re-broke — "push stays in the current group" only holds for dispatches from *inside* a group; from a root-stack handler the bare path resolves to the first group alphabetically (Discover), stranding the thread there. Root-stack navigations into shared routes must name the group AND establish the tab's root explicitly, never relying on resolution rules or fresh-stack `initialRouteName` injection.
- `trip/[id]/edit` non-editable bounce: `router.canGoBack() ? router.back() : router.replace('/(tabs)')` — the common path (arrived from the thread) just pops; the deep-link edge falls back to the tab shell instead of manufacturing a stack.
- `(tabs)/_layout`: the `(profile)` tab gets `popToTopOnBlur: true`, so leaving the tab resets its stack and pressing Profile always lands on the profile landing page (re-pressing while focused already pops to top by default). Home/Discover keep state-preserving iOS-standard behavior — only Profile was specified as strict.

## Risks / Trade-offs

- [Who-viewed/who-saved rows readable by all authenticated users] → intentional MVP posture matching follows; private accounts revisit.
- [`trip_engagement` subquery counts on every profile open] → fine at MVP scale; PK/index cover the lookups; swap to counters or an RPC inside `engagement.ts` if hot.
- [RN shadow can't express the mockup's negative spread] → visually approximated; flagged for the device pass.
- [popToTopOnBlur discards profile-stack depth deliberately] → that's the requested behavior; if users complain about losing their place, scope it to a tabPress listener instead.
- [View counted on open, not on meaningful read] → cheapest honest signal; dedup-by-user makes it un-gameable by refresh.

## Migration Plan

Migration 6 `add_trip_engagement` (two tables + view + policies + saves user index) → `npx supabase db push` (staging) → `npx supabase gen types typescript --linked > src/data/types.ts` + prettier → verify on device → prod push per environment flow. No backfill; counts start at zero.

## Open Questions

- None blocking.
