# project-scaffold — delta spec

## MODIFIED Requirements

### Requirement: App boots with themed tab navigation
The Expo app SHALL build and run on an iOS simulator, Android emulator, or physical device via Expo Go. When a session exists it SHALL present a tab bar with Home, Saved, and Profile screens styled with NativeWind classes; when no session exists it SHALL present the auth flow instead.

#### Scenario: App launches to tab shell
- **WHEN** a developer runs `npx expo start` and opens the app on a device or simulator with an active session
- **THEN** the app renders the Home screen inside a themed tab bar without runtime errors

#### Scenario: App launches to auth flow
- **WHEN** the app is opened with no active session
- **THEN** the app renders the welcome/auth flow without runtime errors

#### Scenario: Tabs navigate
- **WHEN** the user taps the Saved or Profile tab
- **THEN** the corresponding screen is displayed and the active tab indicator updates
