# Design — update-profile-cta-and-bottom-nav

## Context

Follows 2026-07-16-redesign-profile-screen. Mockup references: CREATOR PROFILE (~line 744) for the profile actions, BOTTOM NAV (~line 887) for the five-slot bar (Home, Discover, center coral `+`, Passport→Settings, Profile).

## Goals / Non-Goals

**Goals:** one coral action on the profile (the create-trip CTA card); brand five-slot tab bar with Settings (gear) in the Passport slot; placeholder Discover/Settings screens.
**Non-Goals:** Discover/Settings functionality, composer sheet, saves/passport.

## Decisions

### D1: CTA card leads the trip list
When trips exist, a pressable card renders above them: dashed coral border on `primaryFaint`, `+` glyph, Fraunces-italic invitation ("Where to next?") + Manrope subline, navigating to `/trip/new`. Same card language as the empty state (which remains for zero trips, reworded CTA button unchanged). The `+ New trip` header pill is removed — the TRIPS row is a plain label again.

### D2: Edit profile goes secondary
The header action slot renders the bordered surface style (matches `AuthButton` secondary look) instead of coral, leaving the CTA card as the screen's single coral action. The audience view's Follow button will re-use the coral treatment in that slot later — the slot API is unchanged.

### D3: Five-slot tab bar via expo-router Tabs
Routes: `index` (Home, house icon), `discover` (search icon), `create` (dummy route whose `tabBarButton` renders the raised coral circle; pressing it pushes `/trip/new` and never focuses the route), `settings` (gear icon), `profile` (person icon). `saved.tsx` is deleted — its placeholder purpose moves to the passport/saves change. Icons stay Ionicons (already the repo pattern; the mockup's line icons map to home/search/add/settings/person). Center button styling is imperative (tokens, not classes) because it renders inside the tab bar chrome.

### D4: Placeholder screens keep the scaffold stub pattern
`discover.tsx` and `settings.tsx` copy the existing stub layout (display header + one muted line naming the follow-on change) so navigation is honest while functionality follows.

## Risks / Trade-offs

- [Center `+` semantics may change to the composer sheet later] → it's one `onPress`; provisional target documented in the proposal.
- [Removing Saved tab orphans nothing] → verified: `saved.tsx` was an unreferenced placeholder.
- [Custom tabBarButton must not break tab layout] → the dummy route renders `null` and the button keeps the slot's flex footprint.

## Migration Plan

Code-only; normal gates + device walk.

## Open Questions

- None blocking.
