# Tasks — redesign-profile-screen

## 1. Data Layer

- [x] 1.1 `src/data/trips.ts`: extend `listMyTrips` to select `*, updates(count)`; export `TripWithStops = Trip & { stops: number }` and map the embedded count (0 when absent); keep `useMyTrips` signature otherwise unchanged

## 2. Trip Card

- [x] 2.1 Rebuild `src/features/trips/trip-card.tsx` as the boarding-pass card: cover placeholder block (rotating brand tints), perforation divider, Space Mono meta line (created `MMM YYYY`), Fraunces title, description line, chip row (existing status chip styling + `N stops` mono chip); presentational props only
- [x] 2.2 Update the card's call sites (profile trips section) for the new props _(Home passes title/subtitle only — new props optional, still compiles)_

## 3. Profile Screen (account holder)

- [x] 3.1 Build `ProfileHeader`: teal band with safe-area top inset, overlapping 88px avatar (coral circle + Fraunces initial), Fraunces display name, mono `@username`, action-slot button (Edit profile coral pill), bio text
- [x] 3.2 Build `ProfileStats`: bordered row, Space Mono bold numbers (saves in teal), muted lowercase labels; followers/saves take defaults of 0, trips takes the real count
- [x] 3.3 Build `ProfileTripsSection`: `TRIPS` letterspaced label + coral `+ New trip` pill in the header row; boarding-pass cards linking to `/trip/[id]`; empty state ("No trips yet — start your first journal") with create CTA; loading state
- [x] 3.4 Compose them in `profile-screen.tsx` (holder wiring: `useMyProfile`, `useMyTrips`); keep error state and quiet Sign out at the bottom

## 4. Edit Profile Screen

- [x] 4.1 Create `src/features/profile/edit-profile-screen.tsx` reusing `FormField`/`AuthButton`/`FormError` + `useUpdateMyProfile` (display name 1–50 validation, bio ≤160, dirty-check disable, navigate back on success)
- [x] 4.2 Add route `src/app/profile/edit.tsx` and register `profile/edit` in the root stack (themed native header, `headerTitle: 'Edit profile'`, inside the session guard)

## 5. Verification

- [x] 5.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-16)_
- [ ] 5.2 Manual walk (Expo Go + staging): profile renders (avatar initial, stats with 0/real counts, cards with stops) → Edit profile pushes with back button, save persists and reflects on return → + New trip opens composer flow → empty-state CTA on a fresh account → sign out still works
