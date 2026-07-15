# update-profile-cta-and-bottom-nav

## Why

Two refinements after walking the redesigned profile: the New trip affordance should carry the same boarding-pass card language as the trip list itself (the header pill competes with Edit profile for attention), and the tab bar still shows the scaffold-era Home/Saved/Profile instead of the brand design's five-slot nav.

## What Changes

- Profile trips section: the `+ New trip` header pill goes away; a full-width CTA card sits **on top of** the trip cards (same card treatment as the existing empty state, reworded). The empty state stays for zero-trip accounts.
- Edit profile button inverts to the secondary style (bordered, surface background) so the create-trip CTA is the screen's one coral action.
- Bottom nav rebuilt per the mockup's five slots: Home, Discover, center coral `+` button, Settings, Profile. Per product direction the mockup's Passport slot becomes **Settings with a gear icon**. Discover and Settings ship as placeholder screens ("functionality to follow"); the center `+` provisionally opens the existing New trip flow. The placeholder Saved tab is removed (passport/saves arrive with add-reactions-and-saves under Settings-adjacent surfaces or their own change).

Out of scope: Discover functionality, Settings content, composer semantics for the center button, saves/passport features.

## Capabilities

### Modified Capabilities

- `user-profiles`: The "start a trip from profile" requirement changes shape — CTA card atop the trip list instead of a section-header pill; Edit profile becomes a secondary-styled action.
- `project-scaffold`: The tab navigation requirement changes — five-slot brand nav (Home, Discover, center New trip, Settings, Profile) replaces Home/Saved/Profile.

## Impact

- **Code**: `src/features/profile/profile-screen.tsx` (CTA card, pill removal, secondary Edit profile); `src/app/(tabs)/_layout.tsx` (five slots, gear icon, custom center button); new `discover.tsx`, `settings.tsx`, `create.tsx` (dummy route for the center button); `saved.tsx` removed.
- **Dependencies/Systems**: none; code-only.
- **Follow-on**: Discover backs onto add-follows-and-discovery; Settings becomes the home for account actions; center `+` may later open the composer sheet from the mockup.
