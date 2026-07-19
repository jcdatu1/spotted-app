# add-follows

## Why

Search now surfaces other users and their profiles, but the audience profile is a dead end: the header action slot sits empty (reserved for Follow since add-discover-search), the followers stat is a hardcoded 0, and tapping *yourself* in search shows the read-only audience view instead of your own profile. Follows are the first social edge — the relationship every later discovery feature (feed, trending, notifications) hangs off.

## What Changes

- **Follows relationship**: new `follows` table (`follower_id`, `followee_id`, composite PK, no self-follow) with RLS — any authenticated user can read (counts), but you can only create and delete your *own* follow edges. First migration of the social graph.
- **Follow/Unfollow on the audience profile**: the header action slot fills in —
  - Not following → **Follow**, primary (coral) button.
  - Already following → **Unfollow**, secondary (bordered) style matching Edit profile.
  - Tapping toggles the relationship through the typed data layer, button disabled while pending.
- **Self-view routing**: `/user/[id]` where `id` is the signed-in user now renders the full **owner** profile inline (Edit profile, Where-to-next CTA, drafts) instead of the audience view — back button still returns to search. Reverses add-discover-search's "no special-casing" decision now that the owner/audience distinction has behavioral weight.
- **Real follower counts**: the stats row shows the true follower count on both the owner profile and audience profiles, updating after follow/unfollow. Saves stays 0.
- **Data layer**: new `src/data/follows.ts` (is-following check, follower count, follow/unfollow mutations with query invalidation); regenerated Supabase types.

Out of scope: following count / following lists, a follower list screen, feed or notifications driven by follows, blocking/private accounts, trending or follow-based recommendations.

## Capabilities

### New Capabilities

- `follows`: the follow relationship — storage, RLS, and follow/unfollow semantics.

### Modified Capabilities

- `user-profiles`: audience profile action slot gains Follow/Unfollow; follower stat becomes real on both profile surfaces; `/user/[id]` self-view renders the owner profile.

## Impact

- **Code**: new migration + `src/data/types.ts` regen, new `src/data/follows.ts`, `src/app/user/[id].tsx` (self-view branch), `src/features/profile/audience-profile-screen.tsx` (Follow button, real count), `src/features/profile/profile-screen.tsx` (real count, pushed-context header tweak), `SPOTTED_BIBLE.md`.
- **Dependencies/Systems**: one Supabase migration (staging → prod per environment flow); no new packages.
- **Follow-on**: follower/following list screens, follow-driven Discover (trending, suggested creators), push notifications on new follower.
