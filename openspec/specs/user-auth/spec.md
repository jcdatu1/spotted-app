# user-auth Specification

## Purpose

Account creation, sign-in/sign-out, session persistence, and route protection — who can enter the app and how the app knows who they are. Email/password via Supabase Auth, with email confirmation disabled for MVP (revisit with password reset before launch).

## Requirements

### Requirement: User can create an account with email, password, and username
The system SHALL allow a new user to sign up with an email address, a password, a unique username, and a display name, using Supabase Auth. On successful sign-up the user SHALL be signed in without an email-confirmation step (MVP configuration).

#### Scenario: Successful sign-up
- **WHEN** a user submits the sign-up form with a valid email, password, available username, and display name
- **THEN** an account is created, the user is signed in, and the app navigates to the tab shell

#### Scenario: Username already taken
- **WHEN** a user submits the sign-up form with a username that already exists
- **THEN** the form shows a "username taken" error, no account is created, and no orphaned auth user remains

### Requirement: User can sign in and sign out
The system SHALL allow an existing user to sign in with email and password, and a signed-in user to sign out from the Profile tab.

#### Scenario: Successful sign-in
- **WHEN** a user submits valid credentials on the sign-in screen
- **THEN** the app navigates to the tab shell with the user's session active

#### Scenario: Invalid credentials
- **WHEN** a user submits an incorrect email/password combination
- **THEN** the sign-in screen shows an explicit error and the user remains signed out

#### Scenario: Sign out
- **WHEN** a signed-in user taps sign out on the Profile tab
- **THEN** the session is cleared and the app returns to the auth flow

### Requirement: Sessions persist across app restarts
The system SHALL persist the auth session on-device (AsyncStorage) and restore it on launch, holding the splash screen until restoration resolves.

#### Scenario: Returning user
- **WHEN** a signed-in user fully closes and reopens the app
- **THEN** the app opens directly into the tab shell without showing the auth flow

#### Scenario: Signed-out user
- **WHEN** a user with no stored session opens the app
- **THEN** the app opens into the auth flow

### Requirement: Routes are protected by session state
The app SHALL gate navigation at the layout level: the `(auth)` route group is the only surface reachable without a session, and the tab shell is reachable only with one. Client-side routing SHALL NOT be the sole enforcement — data access is enforced by RLS regardless of navigation state.

#### Scenario: Unauthenticated deep navigation blocked
- **WHEN** an unauthenticated user attempts to reach a tab screen (e.g. via a link or stale state)
- **THEN** the app redirects to the auth flow
