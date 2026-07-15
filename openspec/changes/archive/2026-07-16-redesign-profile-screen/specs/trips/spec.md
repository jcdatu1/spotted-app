# trips — delta spec

## ADDED Requirements

### Requirement: Trip listings expose a stops count
The trips data layer SHALL expose, for the owner's trip list, the number of updates ("stops") each trip contains, computed from existing tables under existing RLS (no denormalized counters). UI surfaces MAY render this as a stops chip.

#### Scenario: Trip with updates shows its count
- **WHEN** the owner's trip list is fetched for a trip that has 3 updates
- **THEN** the trip's stops count is 3

#### Scenario: Empty trip shows zero
- **WHEN** the owner's trip list is fetched for a trip with no updates
- **THEN** the trip's stops count is 0
