# user-profiles — delta spec

## MODIFIED Requirements

### Requirement: Account holder can start a trip from their profile
The account-holder profile SHALL present a create-trip CTA card at the top of the trips section (matching the trip-card visual language and rendered height) that opens the trip creation flow; when no trips exist an empty-state card with a create action SHALL show instead. The create CTA SHALL be the profile's primary (coral) action; the Edit profile button SHALL use the secondary style.

#### Scenario: Create from trips section
- **WHEN** the account holder taps the CTA card at the top of their trips
- **THEN** the trip creation screen opens

#### Scenario: CTA matches card height
- **WHEN** the CTA card renders above trip cards
- **THEN** its height visually matches the trip cards below it

#### Scenario: Empty state invites the first trip
- **WHEN** the account holder has no trips
- **THEN** the trips section shows an inviting empty state with a create action

### Requirement: Profile photo and cover photo are user-editable media
The Edit profile screen SHALL let the user pick a profile photo (square, avatar preset) and a cover photo (wide, cover preset), uploaded to the public `profile-media` bucket per the media-storage lifecycle (prepared client-side, unique filename, row patched, old file deleted). Both pickers SHALL render as image input fields per the shared empty/filled pattern (dashed warm-gray empty state; image + scrim + `+` when set) with no auxiliary text labels such as "Change photo". The profile row SHALL store `avatar_path` and `cover_path` (bucket-relative paths). New photos SHALL appear on the profile immediately after saving; the profile *display* header SHALL keep its teal band / initial-in-circle fallback when media is unset.

#### Scenario: Set a profile photo
- **WHEN** the user picks a photo for their avatar and saves
- **THEN** it uploads to their own prefix in profile-media, `avatar_path` updates, and the profile header shows the photo

#### Scenario: Replace a cover photo
- **WHEN** the user replaces an existing cover photo
- **THEN** the new image renders in the header band and the previous object is deleted from storage

#### Scenario: Pickers follow the image-input pattern
- **WHEN** the Edit profile screen renders with no avatar or cover set
- **THEN** both pickers show the dashed warm-gray empty state with a centered `+`, and no "Change photo" / "Tap to add" text appears

#### Scenario: No media set on display surfaces
- **WHEN** a profile has no avatar or cover
- **THEN** the profile header renders the teal band and the initial-in-circle placeholder
