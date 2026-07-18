# user-profiles — delta spec

## ADDED Requirements

### Requirement: Any user's profile is viewable read-only
The app SHALL provide a pushed audience profile screen (`/user/[id]`, visible chevron-only back button) showing another user's public identity — cover band (or teal fallback), avatar (or initial placeholder), display name, `@username`, bio — a stats row (followers and saves 0 until those capabilities exist; trips = their published trip count), and their published trips as boarding-pass cards navigating into threads. The screen SHALL offer no edit, sign-out, or create actions and SHALL NOT reveal drafts or private fields (e.g. birthday). The header's action slot SHALL remain empty until follows ship.

#### Scenario: View another user's profile
- **WHEN** a signed-in user opens an audience profile from a search result
- **THEN** that user's header, stats, and published trips render, and tapping a trip opens its thread

#### Scenario: Drafts and private data stay hidden
- **WHEN** the viewed user has draft trips and a stored birthday
- **THEN** neither appears anywhere on the audience profile

#### Scenario: No owner actions offered
- **WHEN** any audience profile is displayed
- **THEN** no Edit profile, sign-out, or start-a-trip affordances are present
