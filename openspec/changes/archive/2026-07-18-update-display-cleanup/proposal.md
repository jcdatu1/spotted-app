# update-display-cleanup

## Why

Seven display rough edges accumulated across recent changes: the Home screen still shows the scaffold-era backend health card, sign out sits loose at the bottom of the profile instead of in Settings, the create-trip CTA card towers over the trip cards it leads, the Edit profile avatar picker carries a redundant "Change photo" label, the three image input fields (profile cover, avatar, trip cover) each style their empty state differently — solid teal, solid coral — with no shared guideline, pushed screens' back buttons show the previous route's name ("(tabs)") as a placeholder label, and the country picker opens as a full-screen modal whose header overlaps the iOS status bar/notch.

## What Changes

- **Home**: the backend-status card (HealthCard) is removed from the Home footer. The `useHealthCheck` hook and `src/data/health.ts` stay as dormant diagnostics infrastructure for a future debug surface.
- **Settings**: sign out moves from the profile screen into Settings as a tappable row under a new "Account Management" section heading — the settings screen's first real content, establishing the section + row pattern future settings reuse. The profile screen no longer renders a sign-out button.
- **Profile CTA**: the "Where to next?" create-trip card keeps its centered layout but shrinks (reduced padding/spacing) to match the visual height of the trip cards below it.
- **Edit profile**: the "Change photo" text label under the avatar picker is removed; the picker itself remains tappable.
- **Back button label**: pushed-screen headers show a chevron-only back button (`headerBackButtonDisplayMode: 'minimal'`) — the "(tabs)" route-name placeholder disappears. Applied to both the root stack's pushed-header options and the auth stack.
- **Country picker sheet**: the trip form's country picker becomes a slide-up bottom sheet at ~80% screen height (dim backdrop above, rounded top corners) instead of a 100% full-screen modal — the top of the screen stays visible and nothing sits under the iOS status bar.
- **Image input fields (finalized guideline)**: a shared `ImageInputField` component implements the two states — empty: light warm-gray fill (`surfaceSunken`) with a dashed `borderStrong` border and a centered muted `+`; filled: the image under a dark scrim with a centered white `+` signaling it's still actionable. Variants adapt size and shape per use: cover (full-width 16:9 rect), avatar (circle), and post/trip photo inputs. Adopted by the Edit profile cover, Edit profile avatar, and trip-form cover pickers. The guideline (including dashed-coral = CTA vs dashed-gray = empty input) is documented in SPOTTED_BIBLE.md.

Out of scope: composer photo attach flow (attach action, not a standing form field — the component's photo variant is available when it wants it), any settings beyond sign out, display-surface placeholders (the profile header keeps its teal band / coral initial when media is unset — the guideline governs *input fields*, not display).

## Capabilities

### Modified Capabilities

- `project-scaffold`: health-check requirement no longer includes a Home display; new cross-cutting requirements for the shared image-input-field pattern and label-free back buttons.
- `user-auth`: sign out relocates from the Profile tab to Settings under Account Management.
- `user-profiles`: create-trip CTA card gains height parity with trip cards; profile media pickers adopt the image-input-field pattern and drop text labels.
- `trips`: the Home browse requirement drops its "health-check card remains present" clause; the country picker gains a partial-height sheet presentation requirement.

## Impact

- **Code**: `src/app/(tabs)/index.tsx` (HealthCard removal), `src/app/(tabs)/settings.tsx` (Account Management section + sign-out row), `src/features/profile/profile-screen.tsx` (sign-out button removal, compact CTA card), `src/features/profile/edit-profile-screen.tsx` (ImageInputField adoption, label removal), `src/features/trips/trip-form.tsx` (ImageInputField adoption, country-picker sheet), new shared `ImageInputField` component, `src/app/_layout.tsx` + `src/app/(auth)/_layout.tsx` (minimal back button), `SPOTTED_BIBLE.md`.
- **Dependencies/Systems**: none; code-only, no schema or data-layer changes.
- **Follow-on**: Settings' Account Management section is the landing spot for account deletion / password reset; the ImageInputField photo variant awaits composer adoption if that flow ever becomes a form field.
