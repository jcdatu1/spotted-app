# add-profile-tabs-and-feed-engagement

## Why

The profile's single flat "TRIPS" list mixes drafts with published trips and has nowhere to surface the trips a user has *saved* — even though `trip_saves` already carries a `user_id` index placed there for exactly this "future passport/saved-list surface". The home feed card still leads with STOPS/DAYS, which say nothing about whether a trip is worth opening; views and saves (already counted per trip) are the honest signal. And the stats row shows followers but not following — half the social edge added by `add-follows`.

## What Changes

- **Home feed card footer**: the STOPS / DAYS mono stats are replaced by **VIEWS / SAVES** — same `FooterStat` format and geometry, only the data changes (saves teal per brand, views ink). The home screen batch-fetches engagement for the feed's trip ids. The data-layer stops count stays (trips spec mandates the data layer; UI is MAY).
- **Profile trip tabs**: the trips section on both profile surfaces becomes a tabbed list —
  - Own profile (Profile tab and `/user/[id]` self-view): **Trips** (published: live + completed), **Drafts** (draft state), **Saved** (trips the user saved from other creators).
  - Audience profile: **Trips**, **Saved**.
  - The "Where to next?" create CTA moves from the top of the flat list into the **Drafts** tab; an empty Trips tab still invites creation (spec: empty state invites the first trip).
- **Saved list surface**: new `useSavedTrips(userId)` reading `trip_saves` (by saver, newest first) joined to the trip and its owner; cards show the creator's `@username`. Saved lists are public-in-app (RLS already allows it) — a deliberate MVP posture, like follows.
- **Following counter**: the stats row gains **following** (count of follow edges where the user is the follower) beside followers/trips/saves, on both profile surfaces; follow/unfollow invalidates it. The saves stat keeps meaning saves *received* on the user's trips; the Saved tab is saves *given*.

No database changes: `trip_saves` RLS (SELECT to any authenticated user), the saver index, and the `follows` table already support everything.

Out of scope: follower/following list screens, private saved lists, pagination/infinite scroll inside tabs, reordering or filtering within tabs, feed ranking by engagement.

## Capabilities

### Modified Capabilities

- `trip-engagement`: home feed cards surface view/save counts (replacing stops/days); a saved-trips list becomes browsable from profile tabs.
- `user-profiles`: both profile surfaces get tabbed trip sections; the create CTA relocates to the Drafts tab; the stats row gains following.
- `follows`: the data layer exposes a following count alongside the follower count.

## Impact

- **Code**: `src/data/engagement.ts` (`useSavedTrips`), `src/data/follows.ts` (`useFollowingCount`, invalidation), `src/features/trips/trip-card.tsx` (`FeedTripCard` footer props), `src/app/(tabs)/(home)/index.tsx` (engagement fetch), new `src/features/profile/profile-tabs.tsx` (segmented control + saved list), `src/features/profile/profile-screen.tsx` + `audience-profile-screen.tsx` (tabs, following stat), `SPOTTED_BIBLE.md`.
- **Dependencies/Systems**: none — no migration, no new packages.
- **Follow-on**: saved-list pagination, private saves/accounts, follower/following list screens, engagement-ranked discovery.
