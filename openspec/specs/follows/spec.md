# follows Specification

## Purpose

The follow relationship — the app's first social edge. Storage and RLS for the `follows` table, follow/unfollow semantics on the audience profile, and the follower/following counts surfaced on profile stats. Later discovery features (feed, trending, notifications) hang off this edge.

## Requirements

### Requirement: Follow relationships are stored as owned, RLS-enforced edges
The system SHALL store follows in a `follows` table keyed by `(follower_id, followee_id)` (both referencing `profiles.id`, cascading on profile deletion) with a database CHECK rejecting self-follows. RLS SHALL allow any authenticated user to read follow rows, and SHALL allow INSERT and DELETE only where `auth.uid() = follower_id`; rows SHALL NOT be updatable. All access SHALL go through the typed data layer (`src/data/follows.ts`).

#### Scenario: Follow another user
- **WHEN** a signed-in user follows another user
- **THEN** a single `follows` row (them → target) exists, and following the same user again does not create a duplicate

#### Scenario: Cannot create or delete someone else's edge
- **WHEN** a client attempts to insert or delete a follow row whose `follower_id` is not their own id
- **THEN** the operation affects zero rows

#### Scenario: Self-follow rejected
- **WHEN** an insert names the same user as follower and followee
- **THEN** the database rejects it regardless of client state

### Requirement: A user can follow and unfollow from the audience profile
The audience profile header's action slot SHALL present a Follow button (primary, coral) when the viewer does not follow the profile's user, and an Unfollow button (secondary, bordered — matching the Edit profile style) when they do. Tapping SHALL toggle the relationship through the data layer, disabling the button until the mutation settles, and the button state and follower count SHALL reflect the new relationship without an app restart. While the follow state is loading the slot SHALL remain empty.

#### Scenario: Follow from a profile
- **WHEN** a viewer taps Follow on another user's profile
- **THEN** the button becomes Unfollow (secondary style) and the follower count increments

#### Scenario: Unfollow reverts
- **WHEN** a viewer taps Unfollow on a profile they follow
- **THEN** the button becomes Follow (primary style) and the follower count decrements

#### Scenario: Follow state persists
- **WHEN** a viewer follows a user, restarts the app, and reopens that profile
- **THEN** the Unfollow button is shown

### Requirement: Follower and following counts are exposed per user
The typed data layer SHALL expose, for any user id, both the follower count (edges where the user is the followee) and the following count (edges where the user is the follower), computed from `follows` rows under existing RLS (no denormalized counters). Both counts SHALL be displayed in the profile stats row on the owner and audience profile surfaces, and SHALL reflect follow/unfollow actions without an app restart.

#### Scenario: Following count reflects a new follow
- **WHEN** a user follows another user
- **THEN** the follower's own profile shows a following count one higher, and the followee's profile shows a follower count one higher, on next fetch

#### Scenario: Counts are independent
- **WHEN** a user follows three users and is followed by one
- **THEN** their stats row shows 1 follower and 3 following
