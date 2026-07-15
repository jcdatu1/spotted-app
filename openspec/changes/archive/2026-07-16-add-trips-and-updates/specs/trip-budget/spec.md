# trip-budget — delta spec

## ADDED Requirements

### Requirement: Budget is derived per currency from typed updates
The system SHALL expose a `trip_budgets` view (security invoker) aggregating `sum(amount)` and item count per `(trip_id, currency)` over purchase and attraction updates with a non-null amount. There SHALL be no FX conversion — one rollup line per currency.

#### Scenario: Mixed currencies roll up separately
- **WHEN** a trip has purchases in THB and one purchase in USD
- **THEN** the view returns one THB row summing those amounts and one USD row

#### Scenario: View respects trip visibility
- **WHEN** a non-owner queries the budget of another user's draft trip
- **THEN** zero rows are returned

### Requirement: The trip thread displays the budget rollup
The trip thread header SHALL display the per-currency budget (formatted with currency symbols where known, Space Mono per brand) whenever at least one costed update exists, updating without a manual refresh when the owner posts a new purchase or attraction.

#### Scenario: Budget visible in thread
- **WHEN** a user opens a trip with costed updates
- **THEN** the header shows one total per currency

#### Scenario: Budget updates after posting
- **WHEN** the owner posts a new purchase
- **THEN** the header total reflects it without leaving the thread

#### Scenario: No costed updates
- **WHEN** a trip has only notes and photos
- **THEN** no budget line is rendered (no zero-noise)
