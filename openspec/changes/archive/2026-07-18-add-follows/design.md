# Design — add-follows

## Context

add-discover-search shipped the audience profile with its `ProfileHeader` action slot deliberately empty ("until follows ship") and both profile surfaces hardcoding `followers={0}`. This change ships the follow edge and fills those gaps. Decisions below settled in explore mode: self-view renders the owner profile inline (not a tab redirect), follower counts go real in this change.

## Goals / Non-Goals

**Goals:** follow/unfollow another user from their audience profile; correct owner-vs-audience routing at `/user/[id]`; real follower counts on both profile surfaces; RLS-enforced ownership of follow edges.
**Non-Goals:** following counts/lists, follower list screens, feeds, notifications, blocking, private accounts, recommendations.

## Decisions

### D1: `follows` is a bare edge table with composite PK

`follows(follower_id uuid → profiles.id, followee_id uuid → profiles.id, created_at timestamptz default now())`, PK `(follower_id, followee_id)`, CHECK `follower_id <> followee_id`, both FKs `ON DELETE CASCADE`. Index on `followee_id` for follower counts. RLS: SELECT for any authenticated user (counts and is-following checks are public-within-app, matching profiles readability); INSERT only where `auth.uid() = follower_id`; DELETE only where `auth.uid() = follower_id`; no UPDATE policy (an edge is created or deleted, never mutated). Duplicate follow attempts fail on the PK — the client treats that as already-following, not an error surface.

### D2: Data layer is a thin `src/data/follows.ts`

- `useIsFollowing(userId)` — `maybeSingle()` on the edge keyed `['follows', 'is-following', userId]`, enabled only for non-self ids.
- `useFollowerCount(userId)` — `count: 'exact', head: true` on `followee_id`, keyed `['follows', 'follower-count', userId]`.
- `useFollow()` / `useUnfollow()` — insert/delete the edge (follower id from `requireUserId()`), invalidating both keys for the affected user on success.

No optimistic updates: fetch-on-open + invalidation is the app's established pattern (no Realtime in MVP); the button's pending state covers the round-trip. Internals swap to an RPC later if counts get hot.

### D3: Follow button states live in the audience screen, not the header

`ProfileHeader`'s `action` slot stays a dumb `ReactNode`. `AudienceProfileScreen` composes the button: while `useIsFollowing` is pending render nothing (slot stays empty, matching today); not following → **Follow** as the coral primary (`rounded-full bg-primary px-5 py-2`, white `font-sans-bold` label — coral is the one action color and follow is *the* action on this screen); following → **Unfollow** in the secondary style identical to Edit profile (`border border-borderStrong bg-surfaceRaised`, ink label). The pressed mutation disables the button until it settles; errors surface via the existing `FormError` pattern above the content.

### D4: `/user/[id]` branches on session identity, owner view renders inline

The route compares `id` against `useSession()`'s user id: match → render the owner `ProfileScreen`, else → `AudienceProfileScreen`. This reverses add-discover-search D3 ("no special-casing") deliberately: with Follow live, showing yourself a Follow-less dead-end audience page reads as broken, and the owner view keeps edit/create reachable from search context with the back button intact. `ProfileScreen` gains a `coversStatusBar` prop (default `true`, passed through to `ProfileHeader`) so the pushed instance — which sits under a native header — doesn't double-pad the status bar; the tab instance is unchanged. Self-follow is impossible through the UI (no button on own view) *and* the database (CHECK + RLS).

### D5: Follower counts come from the same hook on both surfaces

`ProfileScreen` and `AudienceProfileScreen` both feed `ProfileStats` from `useFollowerCount(profileId)` (own id from session on the owner surface). Saves stays 0 with its existing "until those capabilities ship" comment. Count renders 0 while loading rather than a spinner — a momentary 0 beats layout shift in a stats row.

## Risks / Trade-offs

- [Count query per profile view] → `head: true` count is cheap at MVP scale; `followee_id` index covers it; RPC/denormalized counter is a swap inside `follows.ts` if it ever matters.
- [No optimistic toggle means a beat of button latency] → consistent with app-wide fetch-and-invalidate; revisit only if it feels sluggish on device.
- [Follows readable by all authenticated users] → intentional (counts are public in-app); private accounts would revisit this policy wholesale.
- [Owner view pushed at `/user/[id]` duplicates the Profile tab surface] → it's the same component, not a fork; only the status-bar prop differs.

## Migration Plan

One migration (`follows` table + policies + index) pushed to staging via `supabase db push`, verify on device, regen `src/data/types.ts` via `supabase gen types`, prod push per environment flow. No backfill — the graph starts empty.

## Open Questions

- None blocking.
