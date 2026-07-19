# Design — add-profile-tabs-and-feed-engagement

## Context

Builds directly on `rework-trip-cards-and-engagement` (engagement tables + `useTripEngagement` batched map + `FeedTripCard`) and `add-follows` (`follows` table + `useFollowerCount`), both code-complete. The DB anticipated this change: `trip_saves_user_id_idx` exists "for a future passport/saved-list surface", and `trip_saves_select_authenticated` already lets any signed-in user read anyone's save rows. The mockup has no profile-tabs precedent (its "SAVED" section is passport saved-*stops*), so the segmented control is new UI composed from the existing chip/pill vocabulary. User-locked decisions: keep the feed footer *format* (big mono `FooterStat`) and only swap the data; Saved tab = trips saved *from others*; saves stat stays saves *received*; saved lists public for now; add the following counter.

## Goals / Non-Goals

**Goals:** feed card footer shows VIEWS/SAVES in the existing format; tabbed profile trip sections (own: Trips/Drafts/Saved; audience: Trips/Saved); create CTA lives in Drafts; saved-trips list with creator attribution; following stat on both profile surfaces.
**Non-Goals:** migrations or RLS changes, saved-list pagination, private saves, follower/following list screens, tab state persistence across sessions, feed ranking.

## Decisions

### D1: Feed footer keeps `FooterStat`, swaps data to views/saves

`FeedTripCard` drops `stops`/`days` props for `views`/`saves` (plain numbers). Right-aligned footer stats become `VIEWS` (`text-ink`) and `SAVES` (`text-secondary` — teal = saves per brand; stops was teal only by accident of being first). Home screen adds `useTripEngagement((trips ?? []).map(t => t.id))` — one batched `.in()` query, same pattern the profile already uses — and passes `engagement?.[id]?.views/saves ?? 0`. `listPublishedTrips` keeps its `updates(count)` join (trips spec mandates the data-layer stops count; `FeedTrip` type unchanged), and `tripDayCount` stays in `src/lib/dates.ts` (still used by the thread/budget surfaces). Zeros render as `0 VIEWS` / `0 SAVES` — honest, and the counts warm up as the app is used.

### D2: Tabs are a local segmented control, not a navigator

A `ProfileTabs` segmented row (new `src/features/profile/profile-tabs.tsx`): pill buttons in a `bg-surfaceRaised` rounded container, active pill white with border (matching the Edit-profile secondary style), `font-sans-bold` labels, `accessibilityRole="tab"` + `accessibilityState={{selected}}`. Active tab is plain `useState` inside the profile screen — no route/navigator involvement, no persistence (Trips is always the landing tab). Both surfaces render the same component with a different tab list; switching swaps the rendered list below the stats row. Content stays inside the existing `ScrollView` (lists are `.map`ped, not virtualized — consistent with the current profile and fine at MVP trip counts).

### D3: Tab contents split client-side from queries already in hand

- **Trips** = `useMyTrips()` filtered `getTripState(t) !== 'draft'` (owner) / `usePublishedTripsByOwner` unchanged (audience). Empty state keeps the existing "start your first journal" card (spec: empty state invites the first trip) on the owner surface; audience keeps "No published trips yet."
- **Drafts** (owner only) = `getTripState(t) === 'draft'`. `StartTripCard` ("Where to next?") always leads the Drafts list — with zero drafts it *is* the content, so no separate empty state needed.
- **Saved** = new `useSavedTrips(userId)` (D4). Empty states: own "Nothing saved yet — trips you save will land here."; audience "No saved trips yet."
- Engagement chips: the owner surface already fetches `useTripEngagement` over `useMyTrips` ids (covers Trips + Drafts); the Saved tab's trips get their counts from the same hook over the saved ids. The saves *stat* keeps summing over the user's own trips only — the Saved tab never feeds it.

### D4: `useSavedTrips` joins through `trip_saves` by saver, newest save first

In `src/data/engagement.ts` (saves domain lives there): `trip_saves.select('created_at, trip:trips(*, owner:profiles!trips_owner_id_fkey(username, display_name, avatar_path))').eq('user_id', userId).order('created_at', {ascending: false})`, mapped to `TripWithOwner[]` and null-filtered — trips RLS hides anything the viewer can't see, so a hidden trip simply drops out of the list instead of erroring. Query key `['saves', 'list', userId]`, gated `enabled: activeTab === 'saved'` via an `enabled` param (no fetch until the tab is opened; React Query caches after). Save/unsave mutations additionally invalidate `['saves', 'list']` so your own Saved tab reflects a toggle without restart. Saved cards render the shared `TripCard` with subtitle `by @{owner.username}` (creator attribution replaces the description — you're looking at someone else's trip), state badge, views/saves chips, and cover via the existing signed-URL hook; tap pushes `/trip/[id]`.

### D5: Following count mirrors the follower count

`src/data/follows.ts` gains `getFollowingCount(userId)` (`count: 'exact', head: true` on `follower_id = userId`) + `useFollowingCount(userId)` keyed `['follows', 'following-count', userId]`. `useToggleFollow` invalidates `['follows', 'following-count']` (prefix-wide — the toggler's own count is the one that changed, but the blunt invalidation is simpler and correct). `ProfileStats` gains a `following` prop rendered between followers and trips: `followers · following · trips · saves` — four stats fit the existing `gap-6` row at default font scale. Both surfaces pass their profile's id.

## Risks / Trade-offs

- [Saved lists are public-in-app] → user-confirmed MVP posture, matches follows/views readability; private saves revisit with private accounts.
- [Feed loses trip-length info (DAYS)] → dates already live in the card's mono meta line (e.g. "FEB 12–26"); nothing is truly lost.
- [`.map` inside ScrollView for three lists] → matches current profile; virtualize only if saved lists grow long enough to hurt.
- [Client-side draft/published split] → `useMyTrips` already returns the full list; no extra query, and counts stay consistent across tabs.
- [Four stats + tabs push content down] → acceptable; the tabs replace the old section header so net vertical cost is one stats entry.

## Migration Plan

None — no schema, RLS, or type changes. Pure client change; ship with the normal quality gates + device walk.

## Open Questions

- None blocking.
