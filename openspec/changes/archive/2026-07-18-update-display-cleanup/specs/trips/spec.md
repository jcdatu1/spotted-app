# trips — delta spec

## MODIFIED Requirements

### Requirement: Published trips are browsable from Home
The Home tab SHALL list published trips (newest published first) with title and creator name, navigating into the trip thread on tap. This is the dev-grade discovery stub; the Home screen SHALL carry no backend-status card.

#### Scenario: Browse published trips
- **WHEN** a signed-in user opens Home while published trips exist
- **THEN** the trips are listed and tapping one opens its thread with a visible back button

#### Scenario: Home is trips-only
- **WHEN** a signed-in user opens Home
- **THEN** no backend health/status card renders above or below the trip list

## ADDED Requirements

### Requirement: Country picker presents as a partial-height sheet
The trip form's country picker SHALL open as a slide-up bottom sheet covering approximately 80% of the screen height, with a dimmed backdrop above it, leaving the top of the screen (including the iOS status bar area) visible and untouched by picker content. Tapping the backdrop SHALL dismiss the sheet, equivalent to Done.

#### Scenario: Sheet clears the status bar
- **WHEN** the user opens the country picker on an iOS device
- **THEN** the sheet rises to ~80% of the screen and no picker content renders under the status bar or notch

#### Scenario: Backdrop dismisses
- **WHEN** the user taps the dimmed area above the open sheet
- **THEN** the sheet closes and the selections made so far are kept
