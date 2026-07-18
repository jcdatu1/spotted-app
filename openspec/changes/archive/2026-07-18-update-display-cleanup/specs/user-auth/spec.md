# user-auth — delta spec

## MODIFIED Requirements

### Requirement: User can sign in and sign out
The system SHALL allow an existing user to sign in with email and password, and a signed-in user to sign out from the Settings tab, where sign out SHALL appear as a tappable row under an "Account Management" section heading. The Profile tab SHALL NOT carry a sign-out affordance.

#### Scenario: Sign in
- **WHEN** an existing user submits correct credentials on the sign-in screen
- **THEN** a session is established and they land on the tab shell

#### Scenario: Sign out
- **WHEN** a signed-in user taps the Sign out row under Account Management in Settings
- **THEN** the session ends and the app returns to the auth flow

#### Scenario: Profile carries no sign-out
- **WHEN** a signed-in user views their Profile tab
- **THEN** no sign-out button is rendered there
