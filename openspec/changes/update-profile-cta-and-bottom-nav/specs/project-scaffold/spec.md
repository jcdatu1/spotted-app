# project-scaffold — delta spec

## MODIFIED Requirements

### Requirement: App boots with themed tab navigation
The Expo app SHALL build and run on an iOS simulator, Android emulator, or physical device via Expo Go. When a session exists it SHALL present the brand five-slot tab bar — Home, Discover, a raised center New trip button, Settings (gear icon), and Profile — styled with NativeWind classes/tokens; when no session exists it SHALL present the auth flow instead. Discover and Settings MAY be placeholder screens until their capabilities ship; the center button SHALL open the trip creation flow (provisional until the composer sheet exists).

#### Scenario: App launches to tab shell
- **WHEN** a developer runs `npx expo start` and opens the app on a device or simulator with an active session
- **THEN** the app renders the Home screen inside the five-slot tab bar without runtime errors

#### Scenario: App launches to auth flow
- **WHEN** the app is opened with no active session
- **THEN** the app renders the welcome/auth flow without runtime errors

#### Scenario: Tabs navigate
- **WHEN** the user taps the Discover, Settings, or Profile tab
- **THEN** the corresponding screen is displayed and the active tab indicator updates

#### Scenario: Center button starts a trip
- **WHEN** the user taps the raised center button
- **THEN** the trip creation screen opens and no tab loses its selected state
