# Tasks — rework-trip-cards-and-engagement

## 1. Database

- [x] 1.1 Migration 6 (`20260718150000_add_trip_engagement.sql`): `trip_views` + `trip_saves` (PK (trip_id, user_id), cascade FKs, saves user_id index), RLS (SELECT authenticated; INSERT own row + published + not-own-trip; DELETE own saves only), `trip_engagement` security-invoker view
- [x] 1.2 `npx supabase db push` to staging; regen `src/data/types.ts` (`gen types --linked`) + prettier

## 2. Data layer

- [x] 2.1 `src/data/engagement.ts`: `useTripEngagement(tripIds)` batched map, `useRecordTripView` (non-owner + published guard), `useIsTripSaved`, `useSaveTrip`/`useUnsaveTrip` with invalidation

## 3. Trip card rework

- [x] 3.1 `TripCard` mockup chrome: 96px cover, radius-20, border, approximated shadow, mono code / Fraunces title / dates hierarchy
- [x] 3.2 Overlay badges on the cover: LIVE (coral rgba .95 pill, pulsing white dot via `Animated.loop`) and COMPLETED (teal rgba .95), exact mockup geometry; no overlay for drafts
- [x] 3.3 Body chips: status chip mockup colors (live primaryTint/primary, completed secondaryTint/secondary, draft unchanged); delete `stops` prop; add optional `views`/`saves` mono chips (views inkMuted, saves teal)
- [x] 3.4 Fix zero padding: add `3.5: 14` / `4.5: 18` to `tokens.spacing` — NativeWind silently drops classes whose key isn't in the scale (design D3c)
- [x] 3.5 `FeedTripCard` for the home feed per mockup (148px cover + scrim + overlay title, md badge variant, notched perforation, avatar footer with STOPS/DAYS); `OWNER_JOIN` + `avatar_path`, `listPublishedTrips` + stops count, `tripDayCount` in lib/dates (design D3b)

## 4. Surfaces

- [x] 4.1 Profile screen: `useTripEngagement` over the trip list, pass views/saves to cards, saves stat = summed save counts (comment updated)
- [x] 4.2 Audience profile: same engagement wiring + real saves stat
- [x] 4.3 Thread: `useRecordTripView` on open; Save/Saved teal toggle in the byline row for non-owners on published trips

## 5. Navigation bug fix

- [x] 5.1 `trip/new`: explicit dismiss → navigate Profile root → group-qualified push (`Href` cast dropped). _Corrected once: the first fix (back()+bare push) resolved into (discover) — root-stack pushes don't inherit an "originating tab"; see design D5_
- [x] 5.2 `trip/[id]/edit` bounce: `canGoBack ? back : replace('/')` (`Href` cast dropped; `/(tabs)` alone isn't an addressable route — `/` is the Home root)
- [x] 5.3 `(tabs)/_layout`: `popToTopOnBlur` on the `(profile)` tab

## 6. Documentation

- [x] 6.1 SPOTTED_BIBLE.md: engagement schema/RLS, card design, save toggle, saves stat, nav fix, changelog (sections 3, 7, 8, 9, 10, 15, 16, 17)

## 7. Verification

- [x] 7.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-18)_
- [ ] 7.2 Device walk: create → publish → back button present and Profile tab lands on profile; second account view increments views once (owner opens don't); save/unsave flips pill, card saves chip and profile saves stat update; badges match mockup (live pulse, completed teal) _(pending — restart the dev server first if it predates these edits)_
- [ ] 7.3 RLS spot-check: owner cannot insert a view/save on own trip; view insert on a draft rejected; duplicate view upsert is a no-op _(pending)_
