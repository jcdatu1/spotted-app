# redesign-profile-screen

## Why

The Profile tab is currently a settings form (inline name/bio editing above a plain trip list). The brand mockup (`context/Spotted.html`, CREATOR PROFILE section) defines an identity-first profile — teal band, overlapping avatar, stats row, boarding-pass trip cards — that every visitor-facing surface will build on. This change rebuilds the tab as the **account-holder view** of that design, structured so the audience view (viewing someone else's profile) can be wired in later without a rewrite.

## What Changes

- Profile tab becomes identity-first per the mockup: teal gradient band, 88px avatar overlapping the band (initial-letter placeholder — no avatar upload yet), Fraunces display name, Space Mono `@username`, bio, and a stats row (followers · trips · saves).
- Where the mockup's audience view shows "Follow along", the account holder gets an **Edit profile** button that pushes a new `/profile/edit` screen (visible back button per convention) containing the existing display-name/bio form. Inline editing leaves the tab.
- Trip list becomes boarding-pass cards per the mockup: cover placeholder, Space Mono meta line, Fraunces title, status chip (DRAFT amber / PUBLISHED teal) + mono "N stops" chip. Stops count comes from a new count in the trips data layer.
- Account-holder affordance: a coral **"+ New trip"** pill in the TRIPS section header row; the empty state keeps a prominent create CTA.
- Followers and saves stats default to **0** (features don't exist yet); trips stat is the real count of the holder's trips (0 when none).
- Sign out remains as a quiet secondary action at the bottom of the tab.

Out of scope: audience view (other users' profiles), follow button/counts backend, saves counts backend, avatar upload, trip cover images from media, LIVE/COMPLETED status semantics (requires trip dates), settings screen.

## Capabilities

### Modified Capabilities

- `user-profiles`: The "view and edit own profile" requirement changes — viewing is the identity-first profile screen (avatar, stats, boarding-pass trip cards, New trip action); editing moves to a pushed Edit profile screen.
- `trips`: Trip listings gain a per-trip stops (updates) count exposed through the data layer for card chips and future surfaces.

## Impact

- **Code**: Rewritten `src/features/profile/profile-screen.tsx` (decomposed into header/stats/trips-section components); new `src/app/profile/edit.tsx` route + `src/features/profile/edit-profile-screen.tsx`; new boarding-pass `TripCard` in `src/features/trips/trip-card.tsx`; `src/data/trips.ts` gains a stops count on `listMyTrips`.
- **Dependencies**: none new.
- **Systems**: no schema/migration changes — the stops count uses a relationship count query against existing tables and RLS.
- **Follow-on**: Unblocks the audience profile view (part of `add-follows-and-discovery`), which reuses the same layout with a Follow button and published-only trips.
