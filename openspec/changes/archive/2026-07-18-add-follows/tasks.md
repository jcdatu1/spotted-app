# Tasks — add-follows

## 1. Database

- [x] 1.1 Migration: `follows` table (composite PK, no-self-follow CHECK, cascading FKs, `followee_id` index), RLS policies (SELECT authenticated; INSERT/DELETE own edges only; no UPDATE)
- [x] 1.2 `supabase db push` to staging; regenerate `src/data/types.ts` (`supabase gen types`)

## 2. Data layer

- [x] 2.1 `src/data/follows.ts`: `useIsFollowing(userId)` (non-self only), `useFollowerCount(userId)` (head count), `useFollow()` / `useUnfollow()` mutations invalidating both keys

## 3. Profile surfaces

- [x] 3.1 Audience screen: fill the header action slot — Follow (coral primary) / Unfollow (secondary, Edit-profile style), disabled while mutation pends, nothing rendered while is-following loads; errors via `FormError`
- [x] 3.2 `/user/[id]`: branch on session user id — own id renders `ProfileScreen` (with new `coversStatusBar={false}` pass-through), others render `AudienceProfileScreen`
- [x] 3.3 Real follower counts: both surfaces feed `ProfileStats` from `useFollowerCount`; saves stays 0

## 4. Documentation

- [x] 4.1 SPOTTED_BIBLE.md: follows feature entry (schema + RLS), audience profile action update, self-view routing note, data-layer reference, changelog

## 5. Verification

- [x] 5.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-18)_
- [ ] 5.2 Device walk: follow a user from search (button flips to Unfollow, follower count increments), unfollow (reverts), state persists across app restart, tapping yourself in search shows your owner profile with working back button, own profile tab unchanged
- [ ] 5.3 RLS spot-check: inserting an edge with a foreign `follower_id` fails; self-follow rejected by CHECK
