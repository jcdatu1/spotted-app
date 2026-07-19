# follows — delta spec

## ADDED Requirements

### Requirement: Follower and following counts are exposed per user

The typed data layer SHALL expose, for any user id, both the follower count (edges where the user is the followee) and the following count (edges where the user is the follower), computed from `follows` rows under existing RLS (no denormalized counters). Both counts SHALL be displayed in the profile stats row on the owner and audience profile surfaces, and SHALL reflect follow/unfollow actions without an app restart.

#### Scenario: Following count reflects a new follow

- **WHEN** a user follows another user
- **THEN** the follower's own profile shows a following count one higher, and the followee's profile shows a follower count one higher, on next fetch

#### Scenario: Counts are independent

- **WHEN** a user follows three users and is followed by one
- **THEN** their stats row shows 1 follower and 3 following
