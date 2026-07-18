# Tasks — update-profile-cta-and-bottom-nav

## 1. Profile CTA

- [x] 1.1 Remove the `+ New trip` header pill; TRIPS row becomes a plain label
- [x] 1.2 Add the create-trip CTA card above the trip cards (dashed coral border, `+`, "Where to next?" wording, navigates to `/trip/new`); keep the empty state for zero trips
- [x] 1.3 Invert Edit profile to the secondary (bordered surface) style

## 2. Bottom Nav

- [x] 2.1 Add `discover.tsx` and `settings.tsx` placeholder tab screens (stub pattern)
- [x] 2.2 Add `create.tsx` dummy route + custom raised coral `tabBarButton` pushing `/trip/new`
- [x] 2.3 Rebuild `(tabs)/_layout.tsx`: Home (house), Discover (search), center `+`, Settings (gear), Profile (person); delete `saved.tsx`

## 3. Verification

- [x] 3.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-16)_
- [ ] 3.2 Device walk: five tabs render, center `+` opens New trip, Discover/Settings stubs open, profile CTA card creates a trip, Edit profile reads as secondary
