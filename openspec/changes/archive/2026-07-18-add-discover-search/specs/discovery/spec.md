# discovery — delta spec

## ADDED Requirements

### Requirement: Discover offers typed search with live results
The Discover tab SHALL present a search input at the top of the screen that searches as the user types (debounced, minimum 2 characters), rendering results grouped into sections — Countries, Users, Trips — with empty sections omitted. The live results serve as the search predictions; no separate suggestion phase is required.

#### Scenario: Live results while typing
- **WHEN** the user types at least 2 characters into the Discover search field
- **THEN** matching countries, users, and trips render in sections without submitting the keyboard

#### Scenario: Short queries do not search
- **WHEN** the input holds fewer than 2 characters
- **THEN** no search request is made

#### Scenario: No matches
- **WHEN** a query matches nothing in any section
- **THEN** an explicit empty state renders instead of a blank screen

### Requirement: User results show identity at a glance and open the profile
User search results SHALL match on username and display name, rendering each hit as an avatar thumbnail (public profile-media URL, initial-in-circle placeholder when unset), display name, and `@username`. Tapping a user result SHALL open that user's audience profile.

#### Scenario: Find a user by partial name
- **WHEN** the user types part of another user's username or display name
- **THEN** that user appears in the USERS section with their avatar, display name, and @username

#### Scenario: Open a found user
- **WHEN** the user taps a user result
- **THEN** the audience profile screen for that user is pushed (visible back)

### Requirement: Trip results match published trips by text
Trip search SHALL match published trips on title and description, rendering hits as the standard boarding-pass trip cards (cover, state chip, meta line) and navigating into the trip thread on tap. Draft trips SHALL never appear in another user's search results (enforced by RLS, not client filtering alone).

#### Scenario: Find a trip by title
- **WHEN** the user types words from a published trip's title or description
- **THEN** that trip appears in the TRIPS section as a trip card and tapping it opens its thread

#### Scenario: Drafts stay invisible
- **WHEN** a query would match another user's draft trip
- **THEN** it does not appear in results

### Requirement: Country results resolve instantly and drill into trips
Country matches SHALL come from the static country list (client-side, no network) and render as flag + name rows above other sections. Tapping a country SHALL show published trips whose country list includes it, with a clear affordance returning to the text query.

#### Scenario: Country matched offline-fast
- **WHEN** the user types a country name fragment (e.g. "phil")
- **THEN** the matching country renders immediately, independent of network latency

#### Scenario: Country drill-down
- **WHEN** the user taps a country result
- **THEN** published trips tagged with that country are listed, and a clear action returns to the previous query

### Requirement: Recent searches fill the empty state
When the search input is empty, Discover SHALL show the user's recent search terms (device-local, most recent first, capped at 10 distinct terms) with a clear-all action. Tapping a recent term SHALL re-run that search. Terms are recorded when a search is committed (submit or result tap).

#### Scenario: Recents shown when idle
- **WHEN** the user opens Discover with an empty search field after having searched before
- **THEN** their recent terms are listed, most recent first

#### Scenario: Recent term re-runs
- **WHEN** the user taps a recent term
- **THEN** the input fills with it and results render

#### Scenario: Clear recents
- **WHEN** the user taps the clear action
- **THEN** all stored recent terms are removed

#### Scenario: Recents survive restart
- **WHEN** the app is fully closed and reopened
- **THEN** previously recorded recent searches are still available
