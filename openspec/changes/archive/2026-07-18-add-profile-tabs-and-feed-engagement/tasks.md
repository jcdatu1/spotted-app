# Tasks — add-profile-tabs-and-feed-engagement

## 1. Data layer

- [x] 1.1 `src/data/follows.ts`: `getFollowingCount` + `useFollowingCount` (keyed `['follows', 'following-count', userId]`); `useToggleFollow` invalidates the `following-count` prefix
- [x] 1.2 `src/data/engagement.ts`: `useSavedTrips(userId, enabled)` — `trip_saves` by saver newest-first, joined trip + owner, null-filtered to `TripWithOwner[]`, keyed `['saves', 'list', userId]`; save/unsave mutations also invalidate `['saves', 'list']`

## 2. Home feed card

- [x] 2.1 `FeedTripCard`: replace `stops`/`days` props with `views`/`saves`; footer `FooterStat`s become VIEWS (`text-ink`) / SAVES (`text-secondary`), format unchanged
- [x] 2.2 Home screen: `useTripEngagement` over feed trip ids, pass counts; drop the `tripDayCount` usage (helper stays in lib)

## 3. Profile tabs

- [x] 3.1 `src/features/profile/profile-tabs.tsx`: segmented pill control (`accessibilityRole="tab"`, selected state) + saved-trips list section (cards with `by @username` subtitle, engagement chips, push to thread, empty states per design D3)
- [x] 3.2 Owner profile: stats row gains following; trips section becomes Trips/Drafts/Saved tabs — Trips = non-drafts (existing empty state), Drafts = drafts led by the "Where to next?" CTA, Saved = `useSavedTrips` gated on tab activation
- [x] 3.3 Audience profile: stats row gains following; section becomes Trips/Saved tabs (drafts never present)

## 4. Documentation

- [x] 4.1 SPOTTED_BIBLE.md: profile tab structure, saved-list surface, feed footer stats, following stat, changelog

## 5. Verification

- [x] 5.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-18)_
- [ ] 5.2 Device walk: home cards show VIEWS/SAVES (no stops/days); own profile shows four stats and three tabs (drafts only under Drafts, CTA inside Drafts, saved trips under Saved with creator attribution); audience profile shows two tabs; follow/unfollow moves both follower and following counts; save/unsave updates the Saved tab without restart
