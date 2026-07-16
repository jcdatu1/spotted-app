# add-trip-creator

## Why

A trip today is just a title and a description — no dates, no destination, no cover. That's too thin for the product's core object: readers can't tell where a trip goes or whether it's happening right now, and every trip card renders a placeholder color block where a cover photo should be. The creation flow needs to grow into a real trip creator, and trips need a lifecycle readers can understand at a glance: Draft, Live (happening now), Completed.

## What Changes

- **Trip fields**: trips gain countries (one or more, ISO 3166-1 alpha-2 codes), a from/to date range (`start_date`/`end_date`, day-granular), and a cover photo (`cover_path` in the existing private `trip-media` bucket via the media-storage core).
- **Derived lifecycle state**: the stored status stays `draft | published`. Live vs Completed is derived at read time from the date range — published and today within range = **Live**; published and past = **Completed**. No scheduled jobs, no stored third state.
- **Publish gating**: a trip cannot be published before its start date. The publish affordance (which stays on the trip thread, where it is today) shows an explanatory note while blocked ("Publishing opens on {start date}") and a DB CHECK backstops the rule.
- **Trip creator screen**: the existing create-trip form grows country multi-select, from/to date fields, and a cover photo picker.
- **Draft-only editing**: a new edit-trip screen (title, description, countries, dates, cover) reachable only while a trip is a draft. Published trips are not editable in this change.
- **Trip cards**: real cover thumbnails (signed URLs, tint fallback), a three-state chip (Draft / Live / Completed), and a Space Mono date-range meta line.

Out of scope: an "Upcoming" public state (publishing is blocked until the trip starts instead), editing published trips, discovery filters by country/date (add-follows-and-discovery), video covers.

## Capabilities

### Modified Capabilities

- `trips`: trip creation gains countries/dates/cover; publish is date-gated with an explanatory note; lifecycle state (Draft/Live/Completed) is derived and displayed; drafts become editable.

## Impact

- **Database**: one migration — `start_date`/`end_date`, `country_codes text[]`, `cover_path` on `trips`, paired-dates + ordering + publish-gate CHECKs, backfill of dates for existing published rows. Regenerate `src/data/types.ts`.
- **Code**: `src/data/trips.ts` (create/update inputs, `getTripState`, edit mutation); `src/lib/countries.ts` (new static ISO country list + flag emoji); `src/app/trip/new.tsx` (expanded form); `src/app/trip/[id]/edit.tsx` (new, with the `[id].tsx` → `[id]/index.tsx` route restructure); `src/features/trips/trip-card.tsx` (cover, state chip, meta); `src/features/trip-thread/thread-screen.tsx` (publish gating note, edit entry point).
- **Dependencies**: none new — reuses `expo-image-picker`/`expo-image-manipulator` presets and the storage core from add-profile-media-and-storage.
- **Follow-on**: country codes and date ranges are the raw material for discovery filters; the derived-state helper is what Home/discovery will badge trips with.
