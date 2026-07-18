# project-scaffold — delta spec

## MODIFIED Requirements

### Requirement: App boots with themed tab navigation

The Expo app SHALL build and run on an iOS simulator, Android emulator, or physical device via Expo Go. When a session exists it SHALL present the brand five-slot tab bar — Home, Discover, a raised center + button, Settings (gear icon), and Profile — styled with NativeWind classes/tokens; when no session exists it SHALL present the auth flow instead. The tab bar SHALL remain visible on trip-thread and user-profile screens pushed from any tab, with the originating tab staying highlighted (per-tab stacks; the thread and profile routes are shared across the Home, Discover, and Profile stacks). Full-screen form flows (trip creation, trip edit, profile edit) MAY cover the tab bar. The center + button SHALL be context-aware: on a trip thread owned by the signed-in user it SHALL open the update-type picker (per the trip-updates capability); everywhere else — including another user's trip thread or profile — it SHALL open the trip creation flow. Pressing the Profile tab SHALL always land on the profile landing screen (its stack resets when the tab loses focus), and no navigation flow SHALL leave a tab's stack without its root screen beneath the pushed content.

#### Scenario: App launches to tab shell

- **WHEN** a developer runs `npx expo start` and opens the app on a device or simulator with an active session
- **THEN** the app renders the Home screen inside the five-slot tab bar without runtime errors

#### Scenario: App launches to auth flow

- **WHEN** the app is opened with no active session
- **THEN** the app renders the welcome/auth flow without runtime errors

#### Scenario: Tabs navigate

- **WHEN** the user taps the Discover, Settings, or Profile tab
- **THEN** the corresponding screen is displayed and the active tab indicator updates

#### Scenario: Tab bar persists into pushed content

- **WHEN** the user opens a trip thread or another user's profile from Home, Discover, or Profile
- **THEN** the screen pushes within that tab's stack, the tab bar stays visible, the originating tab stays highlighted, and the chevron-only back button returns to the previous screen

#### Scenario: Center button starts a trip by default

- **WHEN** the user taps the raised center + button anywhere except a trip thread they own (a tab root, another user's trip, an audience profile)
- **THEN** the trip creation screen opens and no tab loses its selected state

#### Scenario: Center button composes on an owned thread

- **WHEN** the user taps the raised center + button while viewing a trip thread they own
- **THEN** the update-type picker opens instead of the trip creation flow

#### Scenario: Profile tab strictly lands on the profile

- **WHEN** the user presses the Profile tab from anywhere, in any navigation state
- **THEN** the profile landing screen is shown (never a previously pushed screen)

#### Scenario: Creating and publishing a trip never strands the user

- **WHEN** a user creates a trip (from any tab), lands in its thread, and publishes it
- **THEN** a back affordance remains available, and pressing the Profile tab shows the profile landing screen
