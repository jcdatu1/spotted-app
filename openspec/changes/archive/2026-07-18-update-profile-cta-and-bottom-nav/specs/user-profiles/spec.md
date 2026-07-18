# user-profiles — delta spec

## MODIFIED Requirements

### Requirement: Account holder can start a trip from their profile
The account-holder profile SHALL present a create-trip CTA card at the top of the trips section (matching the trip-card visual language) that opens the trip creation flow; when no trips exist an empty-state card with a create action SHALL show instead. The create CTA SHALL be the profile's primary (coral) action; the Edit profile button SHALL use the secondary style.

#### Scenario: Create from trips section
- **WHEN** the account holder taps the CTA card at the top of their trips
- **THEN** the trip creation screen opens

#### Scenario: Empty state invites the first trip
- **WHEN** the account holder has no trips
- **THEN** the trips section shows an inviting empty state with a create action

#### Scenario: One primary action
- **WHEN** the account holder views their profile
- **THEN** the create-trip CTA is the only coral action and Edit profile renders in the secondary style
