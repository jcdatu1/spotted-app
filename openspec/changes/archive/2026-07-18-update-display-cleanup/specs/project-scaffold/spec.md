# project-scaffold — delta spec

## MODIFIED Requirements

### Requirement: Backend health check round-trips to the configured Supabase environment
The data layer SHALL expose a health-check function returning `{ ok, latencyMs }` (with a TanStack Query hook) that verifies connectivity to the Supabase project configured in the environment (staging by default for development). No shipped screen SHALL display its result; the hook is retained as dormant infrastructure for a future diagnostics surface.

#### Scenario: Health check callable against staging
- **WHEN** `.env` holds valid staging credentials and the health-check function is invoked
- **THEN** it reports `ok: true` with a latency measurement

#### Scenario: Backend unreachable
- **WHEN** the configured Supabase project cannot be reached and the health-check function is invoked
- **THEN** it reports `ok: false` with a reason, not a crash

#### Scenario: Home carries no backend status UI
- **WHEN** a signed-in user opens the Home tab
- **THEN** no backend-status/health card is rendered

## ADDED Requirements

### Requirement: Pushed-screen back buttons are label-free
Pushed (non-root) screens SHALL keep their visible back button, rendered chevron-only with no textual label — route names or screen titles SHALL NOT appear as back-button text (no "(tabs)" placeholder).

#### Scenario: Back button shows no route name
- **WHEN** the user pushes any screen from the tab shell (e.g. New trip, Edit profile, a trip thread)
- **THEN** the header shows a back chevron with no accompanying text

#### Scenario: Back button still navigates
- **WHEN** the user taps the chevron-only back button
- **THEN** they return to the previous screen

### Requirement: Image input fields share a single empty/filled pattern
Every image input field SHALL render through a shared component with two states: empty — a light warm-gray field (`surfaceSunken`) with a dashed `borderStrong` border and a centered muted `+`, no instructional text; filled — the current image under a dark scrim with a centered white `+` signaling the field is still actionable. Variants SHALL adapt geometry per use (full-width 16:9 cover rect, circle avatar, post/photo inputs) without diverging in state styling. Dashed warm-gray borders SHALL be reserved for empty image inputs; dashed coral remains the CTA treatment. The pattern SHALL be documented in SPOTTED_BIBLE.md.

#### Scenario: Empty image input
- **WHEN** an image input field has no image (no draft, no persisted value)
- **THEN** it renders the dashed-border warm-gray field with a centered `+`

#### Scenario: Filled image input
- **WHEN** an image input field has an image (draft or persisted)
- **THEN** it renders that image under a scrim with a centered white `+`, and tapping it opens the picker

#### Scenario: Shapes adapt, styling doesn't
- **WHEN** the cover (rect) and avatar (circle) inputs are compared in the same state
- **THEN** they differ only in geometry, not in fill, border, or affordance treatment
