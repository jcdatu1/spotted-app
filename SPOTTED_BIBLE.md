# The Spotted Bible

> The single comprehensive reference for the Spotted app — what it is, how it works, and every technical detail that matters. **This document is living**: whenever a feature ships, a migration lands, a convention changes, or an architectural decision is made, append/update the relevant section AND add a dated entry to the [Document Changelog](#document-changelog) at the bottom.

Last updated: **2026-07-18** · App version: **0.1.0** · Branch context: `feature/trip-creation`

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Core Concepts & Vocabulary](#2-core-concepts--vocabulary)
3. [Feature Inventory (Current State)](#3-feature-inventory-current-state)
4. [Tech Stack](#4-tech-stack)
5. [Architecture](#5-architecture)
6. [Repository Layout](#6-repository-layout)
7. [Navigation Map](#7-navigation-map)
8. [Database Schema](#8-database-schema)
9. [Security Model (RLS & Storage)](#9-security-model-rls--storage)
10. [Data Layer Reference](#10-data-layer-reference)
11. [Design System & Brand](#11-design-system--brand)
12. [Locked Architectural Decisions](#12-locked-architectural-decisions)
13. [Environments, Config & Workflows](#13-environments-config--workflows)
14. [Observability](#14-observability)
15. [Planning Workflow (OpenSpec)](#15-planning-workflow-openspec)
16. [Roadmap](#16-roadmap)
17. [Known Quirks & Gotchas](#17-known-quirks--gotchas)
18. [Document Changelog](#document-changelog)

---

## 1. Product Overview

**Spotted** is a mobile social travel app. Creators publish travel journals as **chat-style threads**: each trip is a conversation-like feed of **typed updates** — notes, photos, purchases, attractions (video reserved for later) — rather than freeform posts. Readers follow creators, walk a journey update-by-update, and (in future changes) react, save stops, and **copy an itinerary** — with an automatically rolled-up budget — to plan their own version of the trip.

Key product stances:

- **Single account type.** There is no "creator role" — a creator is simply a user who has published a trip. All capability comes from row ownership, never a role column.
- **Typed updates, not chat text.** Every update is a structured record. A purchase has a vendor, amount, and currency; an attraction has a place name and optional entry fee. This is what makes budget rollups and itinerary copying possible.
- **Budget is a by-product.** Purchases and attraction fees automatically roll up into a per-currency trip budget — the creator never fills in a "budget" field.
- **Voice**: warm postcard-from-a-friend, present tense, specific over grand.

---

## 2. Core Concepts & Vocabulary

| Term | Meaning |
| --- | --- |
| **Trip** | The core object. A titled, dated journey through one or more countries, owned by one user. Stored status is only `draft` or `published`. |
| **Update** | One entry in a trip's thread. Exactly one of: `note`, `photo`, `purchase`, `attraction` (`video` enum value reserved, unused). |
| **Trip state** | `Draft` / `Live` / `Completed` — **derived at read time**, never stored. Draft = status `draft`. Published + `end_date` in the past = Completed; otherwise Live. See `getTripState()` in [src/data/trips.ts](src/data/trips.ts). |
| **Thread** | The chat-style screen rendering a trip's updates ordered by `happened_at` (then `created_at`). |
| **Composer** | The owner-only bar at the bottom of a thread for posting typed updates. |
| **Budget rollup** | Per-currency `SUM(amount)` over `purchase` + `attraction` updates, served by the `trip_budgets` SQL view. No FX conversion. |
| **Stops** | The count of updates on a trip (shown on the owner's trip cards). |
| **Creator** | Any user who has published a trip. Derived, never a role. |
| **`happened_at`** | Creator-editable timestamp that drives thread ordering and (future) itinerary day-grouping. `created_at` is immutable metadata. |
| **Itinerary copy** (future) | A projection of a trip into separate itinerary tables referencing source updates — never duplicated rows. |

---

## 3. Feature Inventory (Current State)

### Shipped and working

**Authentication** ([src/app/(auth)/](src/app/(auth)/), [src/data/auth.tsx](src/data/auth.tsx))
- Email + password sign-up/sign-in via Supabase Auth; session persisted in AsyncStorage with auto-refresh.
- Sign-up collects username + display name, passed as user metadata; a DB trigger (`handle_new_user`) provisions the `profiles` and `private_profiles` rows **inside the sign-up transaction** — a duplicate username aborts the whole sign-up, so no orphaned auth users.
- Username availability pre-check callable while signed out (`username_available` security-definer RPC).
- Friendly error mapping (e.g. "Database error saving new user" → "That username is taken or invalid.").
- Route protection via `Stack.Protected` guards in [src/app/_layout.tsx](src/app/_layout.tsx): signed-out users only see `(auth)`, signed-in users only see the app.

**Profiles** ([src/features/profile/](src/features/profile/), [src/data/profiles.ts](src/data/profiles.ts))
- Public profile: username (immutable, enforced by DB trigger), display name, bio (≤160), avatar, cover photo.
- Owner-private birthday stored in a separate `private_profiles` table (RLS is row-level, so owner-only visibility requires its own table).
- Profile screen: cover band (photo or teal fallback) + overlapping avatar + identity block + stats row (followers/saves hardcoded 0 until those features ship; trips is real) + trip list led by a compact full-width "Start a trip" CTA card matching trip-card height (the screen's one coral action; Edit profile is secondary-styled). Sign out lives in Settings, not here.
- Edit profile screen: display name, bio, birthday, avatar/cover pickers via the shared `ImageInputField` (no text labels — the `+` affordance carries it).
- Media replace lifecycle: upload new file under a fresh unique name → point the row at it → best-effort delete predecessor. A row never references a missing file.

**Trips** ([src/data/trips.ts](src/data/trips.ts), [src/features/trips/](src/features/trips/))
- Create trip: title (1–80), description (≤280), country multi-select (ISO 3166-1 alpha-2, max 20) in an ~80%-height bottom-sheet picker (dim backdrop, tap-to-dismiss — full-screen would sit under the iOS status bar), from/to date range (day-granular, paired + ordered), optional 16:9 cover photo (private `trip-media` bucket) via `ImageInputField`.
- Draft-only editing via a dedicated edit screen; published trips are not editable yet.
- Publish gating: cannot publish before `start_date` (client gate in device-local time; DB CHECK backstop allows `current_date + 1` for timezone slack — the client UX is the real gate). Blocked reasons surface as `missing-dates` / `not-started` via `getPublishBlocker()`.
- Publishing is confirmed via an alert; sets `status='published'` + `published_at`.
- Trip cards: cover thumbnail (signed URL, tint-cycle fallback), three-state chip (Draft/Live/Completed), Space Mono date-range meta line.

**Trip thread + composer** ([src/features/trip-thread/](src/features/trip-thread/), [src/features/composer/](src/features/composer/))
- Chat-style FlatList of update bubbles ordered by `happened_at` then `created_at`; pull-to-refresh (no realtime in MVP).
- Owner-only composer bar with four type buttons: Note (body ≤1000), Photo (picked + resized image, optional caption), Purchase (vendor, amount, currency), Place/attraction (place name, optional entry fee).
- Currency picker chips (`THB, USD, PHP, EUR, JPY, GBP, KRW, SGD`); composer defaults to the thread's last-used currency (fallback USD).
- Draft banner on owner-viewed drafts with Edit details + Publish actions and publish-blocker messaging.
- Budget header showing per-currency totals from the `trip_budgets` view.

**Home tab** ([src/app/(tabs)/index.tsx](src/app/(tabs)/index.tsx))
- Feed of the 50 most recently published trips (all users), newest first, with trip cards linking into threads. (The scaffold-era backend health card was removed 2026-07-18; `useHealthCheck` in [src/data/health.ts](src/data/health.ts) is kept dormant for a future diagnostics surface.)

**Settings tab** ([src/app/(tabs)/settings.tsx](src/app/(tabs)/settings.tsx))
- Account Management section with a Sign out row (coral label). Its heading + row-card markup is the template for future settings sections — extract a shared component when a second section arrives.

**Tab shell** ([src/app/(tabs)/_layout.tsx](src/app/(tabs)/_layout.tsx))
- Five-slot brand nav: Home, Discover, raised coral center `+` button (opens `/trip/new`; its `create` route is a dummy), Settings, Profile.

### Placeholder screens (UI only, no functionality)

- **Discover** — awaits `add-follows-and-discovery`.

### Not built yet (see [Roadmap](#16-roadmap))

Follows, discovery, reactions, saves, itinerary copy, video updates, maps, push notifications, realtime threads, moderation/report/block, editing published trips, editing/deleting updates from the UI.

---

## 4. Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| App framework | Expo SDK **54** (React Native 0.81, React 19.1) | Expo Go for dev; EAS builds later. `reactCompiler` + `typedRoutes` experiments enabled. |
| Language | TypeScript (strict) | `npm run typecheck` |
| Routing | expo-router ~6 (file-based) | Entry: `expo-router/entry` |
| Styling | NativeWind 4 (Tailwind 3) | All classes backed by [src/theme/tokens.ts](src/theme/tokens.ts) via [tailwind.config.js](tailwind.config.js) |
| Server state | TanStack Query 5 | Fetch-on-open + pull-to-refresh; no realtime |
| Local UI state | Zustand 5 | (installed; minimal use so far) |
| Backend | Supabase — Postgres (+PostGIS planned), Auth, Storage, RLS | Two cloud projects; **no local Docker stack** |
| Media | expo-image-picker + expo-image-manipulator | Presets: avatar, cover, tripPhoto ([src/lib/images.ts](src/lib/images.ts)) |
| Fonts | @expo-google-fonts: Fraunces, Manrope, Space Mono | Loaded in root layout; splash held until ready |
| Errors | Sentry (@sentry/react-native) | Opt-in via env flag |
| Analytics | PostHog (posthog-react-native) | Opt-in via env flag |
| Deferred | Mux (video), Mapbox (maps/geocoding), Expo Notifications (push) | Each its own future change |

---

## 5. Architecture

```
┌────────────────────────────────────────────────────────────┐
│  src/app/          expo-router routes                      │
│  (thin — compose feature components, no logic)             │
├────────────────────────────────────────────────────────────┤
│  src/features/     feature-organized components/hooks      │
│  auth · brand · composer · profile · trip-thread · trips   │
├────────────────────────────────────────────────────────────┤
│  src/data/         THE ONLY Supabase access point          │
│  typed functions + TanStack Query hooks                    │
│  (enforced by no-restricted-imports ESLint rule)           │
├────────────────────────────────────────────────────────────┤
│  Supabase cloud    Postgres + RLS · Auth · Storage         │
│  (staging for dev, prod for releases)                      │
└────────────────────────────────────────────────────────────┘
   cross-cutting: src/lib/ (utils) · src/theme/ (tokens)
```

Rules that hold everywhere:

1. **No ad-hoc Supabase queries in components.** Everything goes through `src/data/`. ESLint blocks `@supabase/supabase-js` imports outside `src/data/` ([eslint.config.js](eslint.config.js)).
2. **The Supabase client is a lazy singleton** ([src/data/client.ts](src/data/client.ts)) so a missing `.env` fails with a clear `SupabaseConfigError`, not a crash on import.
3. **Types flow from the database.** `npx supabase gen types typescript --linked > src/data/types.ts` after every migration; the data layer builds on `Tables<'…'>` helpers.
4. **Permissions are enforced by RLS**, never client-side checks alone. Client checks (e.g. `isOwner`) are UX, not security.
5. **Uploads precede row writes** — a DB row never references a storage object that wasn't successfully uploaded; failed row writes clean up the orphaned upload (best-effort).
6. **Provider stack** (root layout): `QueryClientProvider` → `SessionProvider` → `RootNavigator`. Splash screen is held until fonts + initial session restore resolve.

### Query key conventions (TanStack Query)

| Key | Data |
| --- | --- |
| `['trips', 'detail', id]` | Single trip with owner |
| `['trips', 'mine']` | Own trips with stop counts |
| `['trips', 'published']` | Home feed |
| `['updates', tripId]` | Thread updates |
| `['budget', tripId]` | Budget lines |
| `['my-profile', userId]` | Own profile + birthday |
| `['signed-urls', bucket, sortedPaths]` | Batched signed URLs |
| `['backend-health']` | Health check |

Mutations invalidate by prefix (e.g. any trip mutation invalidates `['trips']`; posting an update invalidates that trip's `updates` + `budget`).

---

## 6. Repository Layout

```
src/app/         expo-router routes (thin)
src/features/    feature components:  auth/ brand/ composer/ profile/ trip-thread/ trips/
src/data/        typed data layer:    client auth profiles trips updates media storage health types
src/lib/         utilities:           countries dates images money observability
src/theme/       tokens.ts — single source of truth for color/type/spacing/radius
src/global.css   Tailwind entry
supabase/        CLI config + migrations/
openspec/        specs + change proposals (OpenSpec, spec-driven schema)
context/         design references: Spotted.html mockup + brand guidelines HTML (reference-only)
assets/          icons, splash
```

Config files: [app.json](app.json) (Expo config), [tailwind.config.js](tailwind.config.js), [babel.config.js](babel.config.js), [metro.config.js](metro.config.js), [eslint.config.js](eslint.config.js), [tsconfig.json](tsconfig.json) (path alias `@/*` → `src/*`).

---

## 7. Navigation Map

Root stack ([src/app/_layout.tsx](src/app/_layout.tsx)) with auth-guarded groups:

```
Signed OUT ──▶ (auth)
               ├─ index        landing (no header)
               ├─ sign-in      pushed, back button
               └─ sign-up      pushed, back button

Signed IN ──▶ (tabs)                       ← headerless root tabs
               ├─ index        Home feed
               ├─ discover     placeholder
               ├─ create       dummy route — center + button pushes /trip/new
               ├─ settings     Account Management → Sign out
               └─ profile      own profile + trip list
              trip/new         "New trip"     (pushed, themed native header)
              trip/[id]/index  thread         (pushed, empty title)
              trip/[id]/edit   "Edit trip"    (pushed, draft-only)
              profile/edit     "Edit profile" (pushed)
```

**Convention: every pushed (non-root) screen shows a VISIBLE BACK BUTTON** — the themed native stack header (`pushedHeader` in the root layout) unless the screen supplies its own back affordance. Root tabs and close-button modals are exempt. Back buttons are **chevron-only** (`headerBackButtonDisplayMode: 'minimal'`) — without it, iOS shows the previous route's name ("(tabs)") as the back label.

⚠️ Route-name gotcha: because `trip/[id]` is a **directory**, the root-layout screen names must be `trip/[id]/index` and `trip/[id]/edit` — a `Stack.Screen name="trip/[id]"` would silently drop its header options.

---

## 8. Database Schema

Four migrations in [supabase/migrations/](supabase/migrations/) (chronological):

1. `20260716120000_add_profiles.sql` — profiles, provisioning trigger, username RPC
2. `20260716180000_add_trips_and_updates.sql` — trips, updates, budget view, trip-media bucket
3. `20260716210000_add_profile_media_and_birthday.sql` — media path columns, private_profiles, profile-media bucket
4. `20260716230000_add_trip_creator_fields.sql` — countries, dates, cover, publish gate

### Enums

- `trip_status`: `draft` | `published`
- `update_type`: `note` | `photo` | `video` | `purchase` | `attraction` (`video` reserved, no UI)

### Tables

**`profiles`** — public identity, 1:1 with `auth.users` (cascade delete)
| Column | Type | Constraints |
| --- | --- | --- |
| `id` | uuid PK | FK → auth.users |
| `username` | text | unique, `^[a-z0-9_]{3,20}$`, **immutable** (trigger `prevent_username_change`) |
| `display_name` | text | 1–50 chars |
| `avatar_path` | text null | storage path, not URL (renamed from `avatar_url`, never written) |
| `cover_path` | text null | storage path |
| `bio` | text null | ≤160 |
| `created_at` / `updated_at` | timestamptz | `updated_at` via `set_updated_at` trigger |

**`private_profiles`** — owner-only data, 1:1 with profiles (cascade)
| Column | Type | Constraints |
| --- | --- | --- |
| `id` | uuid PK | FK → profiles |
| `birthday` | date null | ≥1900-01-01 and ≥13 years old |

**`trips`**
| Column | Type | Constraints |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `owner_id` | uuid | FK → profiles (cascade) |
| `title` | text | 1–80 |
| `description` | text null | ≤280 |
| `status` | trip_status | default `draft` |
| `published_at` | timestamptz null | |
| `start_date` / `end_date` | date null | paired (`(start IS NULL) = (end IS NULL)`), ordered (`start <= end`) |
| `country_codes` | text[] | default `{}`, max 20 |
| `cover_path` | text null | trip-media path |
| `created_at` / `updated_at` | timestamptz | |

Publish CHECKs: `published` requires `start_date IS NOT NULL`, and `start_date <= current_date + 1` (the `+1` absorbs UTC-vs-device-local skew up to UTC+14; the client is the real gate).
Indexes: `(owner_id)`, `(status, published_at desc)`.

**`updates`** — ONE table, type enum + typed nullable columns + per-type CHECKs (locked decision: no JSONB, no child tables)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `trip_id` | uuid | FK → trips (cascade) |
| `author_id` | uuid | FK → profiles (cascade) |
| `type` | update_type | |
| `happened_at` | timestamptz | default now(); **drives thread order**, creator-editable later |
| `created_at` | timestamptz | immutable metadata |
| `body` | text null | ≤1000 — note text / caption |
| `place_name` | text null | ≤120 (attraction) |
| `vendor_name` | text null | ≤120 (purchase) |
| `amount` | numeric(12,2) null | ≥0 — shared by purchase.amount and attraction.entry_fee |
| `currency` | char(3) null | `^[A-Z]{3}$` |
| `media_path` | text null | named generically so video needs no rename |

Per-type CHECKs: note→body required; photo→media_path required; purchase→amount+currency+vendor required; attraction→place_name required (fee optional); amount always requires currency.
Index: `(trip_id, happened_at)`.

### Views

**`trip_budgets`** (`security_invoker = true` — caller's RLS applies, so draft budgets are invisible to non-owners):
```sql
SELECT trip_id, currency, SUM(amount) AS total, COUNT(*) AS items
FROM updates WHERE type IN ('purchase','attraction') AND amount IS NOT NULL
GROUP BY trip_id, currency;
```

### Functions & Triggers

| Object | Kind | Purpose |
| --- | --- | --- |
| `handle_new_user()` | trigger fn (security definer) on `auth.users` insert | Provisions `profiles` + `private_profiles` from sign-up metadata; failure aborts sign-up |
| `prevent_username_change()` | trigger fn on profiles update | Username immutability (WITH CHECK can't compare OLD/NEW) |
| `set_updated_at()` | trigger fn | Bumps `updated_at` on profiles/trips |
| `username_available(name)` | RPC (security definer, granted to anon) | Sign-up form pre-check while signed out |

---

## 9. Security Model (RLS & Storage)

All permissions live in RLS. Summary:

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | any authenticated | ❌ (trigger-owned) | own row only | ❌ (cascades from auth.users) |
| `private_profiles` | own row only | ❌ (trigger-owned) | own row only | ❌ (cascade) |
| `trips` | **published OR own** | own only | own only | own only |
| `updates` | via parent trip's visibility | trip owner + self as author | trip owner | trip owner |

Key properties:

- **Trip visibility is defined once** — in `trips_select_visible` — and `updates`/`trip_budgets` delegate to it (EXISTS subquery / security-invoker view). Anonymous/shareable links later only need to change trip RLS.
- **MVP reads are authenticated-only.** The `anon` role can only call `username_available`.
- All policies use `(select auth.uid())` (initplan-cached) rather than bare `auth.uid()`.

### Storage buckets

| Bucket | Access | Used for | URL strategy |
| --- | --- | --- | --- |
| `trip-media` | **private** | trip covers (`{uid}/covers/…`), thread photos (`{uid}/{tripId}/…`) | batched signed URLs, 1h TTL, refetched ~10min before expiry (`useSignedUrls`) |
| `profile-media` | **public** | avatars + profile covers (`{uid}/…`) | stable public URLs (profiles are app-readable by design; beats signed-URL churn) |

Both buckets: authenticated-only SELECT policy; INSERT/DELETE locked to the caller's own top-level folder (`{uid}/…`). Object names are unguessable and unique (`label-{timestamp}-{random}.{ext}`), so replaced media naturally busts image caches.

---

## 10. Data Layer Reference

All modules in [src/data/](src/data/). Pattern per module: plain async functions (throw `Error` with a readable message) + TanStack Query hooks wrapping them.

| Module | Exports (main) |
| --- | --- |
| [client.ts](src/data/client.ts) | `getSupabaseClient()` (lazy singleton), `getSupabaseConfig()`, `SupabaseConfigError` |
| [types.ts](src/data/types.ts) | **Generated** — `Database`, `Tables<>`, `TablesInsert<>`, `Enums<>`. Regenerate after every migration; never hand-edit. |
| [auth.tsx](src/data/auth.tsx) | `SessionProvider`, `useSession()`, `signUp()`, `signIn()`, `signOut()`, friendly error mapping |
| [profiles.ts](src/data/profiles.ts) | `Profile`, `MyProfile` (+birthday), `getMyProfile`, `updateMyProfile`, `setMyAvatar/setMyCover`, `isUsernameAvailable`, `profileMediaUrl`, `useMyProfile`, `useUpdateMyProfile` |
| [trips.ts](src/data/trips.ts) | `Trip`, `TripWithOwner`, `TripWithStops`, `TripState`, `getTripState`, `getPublishBlocker`, `localToday`, `createTrip`, `updateTrip` (draft-only), `publishTrip`, `getTrip`, `listMyTrips`, `listPublishedTrips` + `useTrip/useMyTrips/usePublishedTrips/useCreateTrip/useUpdateTrip/usePublishTrip` |
| [updates.ts](src/data/updates.ts) | `Update` **discriminated union** (Note/Photo/Purchase/Attraction), `NewUpdate`, `listUpdates`, `createUpdate`, `BudgetLine`, `getTripBudget`, `useTripUpdates`, `useTripBudget`, `useCreateUpdate`. Rows violating variant invariants (or reserved `video`) map to `null` and are filtered out. |
| [media.ts](src/data/media.ts) | `uploadTripPhoto(tripId, image)`, `useSignedPhotoUrls(paths)` |
| [storage.ts](src/data/storage.ts) | `AppBucket`, `requireUserId`, `uniqueObjectName`, `uploadImage`, `publicUrl`, `removeObjects`, `useSignedUrls` |
| [health.ts](src/data/health.ts) | `checkBackendHealth()` (GoTrue health endpoint, 4s manual abort timer — RN fetch lacks `AbortSignal.timeout`), `useHealthCheck` — **dormant since 2026-07-18** (no UI consumer; kept for a future diagnostics surface) |

### src/lib/ utilities

| Module | Purpose |
| --- | --- |
| [countries.ts](src/lib/countries.ts) | Static ISO 3166-1 alpha-2 list, `flagEmoji`, `countryName`, `searchCountries` |
| [dates.ts](src/lib/dates.ts) | `formatTripDate`, `formatTripRange` (Space Mono meta lines) |
| [money.ts](src/lib/money.ts) | `COMMON_CURRENCIES` (THB USD PHP EUR JPY GBP KRW SGD), `formatMoney` |
| [images.ts](src/lib/images.ts) | `pickAndPrepareImage(preset)` → `PreparedImage {uri, mimeType, extension}`; presets `avatar`/`cover`/`tripPhoto`; `COVER_ASPECT = 16/9` |
| [observability.ts](src/lib/observability.ts) | `initObservability()`, `getPostHog()` — see §14 |

---

## 11. Design System & Brand

Source of truth: [src/theme/tokens.ts](src/theme/tokens.ts) → consumed by [tailwind.config.js](tailwind.config.js) (every NativeWind class) and by imperative styles that can't use classes (tab bar, headers). **Never hardcode a value that exists in tokens.**

Design references (reference-only — consult when building a screen, never proactively restyle): `context/Spotted.html` (screen mockup; JSON-escaped on line 216, decode via node script) and `context/Spotted Brand Guidelines.dc (1).html` (brand v1.0).

### Color roles

| Token | Hex | Role |
| --- | --- | --- |
| `surface` / `surfaceRaised` / `surfaceSunken` / `surfaceMuted` | `#FAF4EC` etc. | Sand — the canvas. Warm paper neutrals |
| `ink` / `inkMuted` / `inkFaint` / `inkInverse` | `#2A2420` etc. | Text hierarchy |
| `primary` (Coral) | `#FF6A4D` | **The ONE action color** |
| `secondary` (Teal) | `#0F7B6C` | Money, saves, success |
| `accent` (Amber) | `#FFC24B` | Celebrate, highlights, ratings |
| `pine` (Deep Pine) | `#17403A` | Dark/passport surfaces |

Signals are used sparingly — one coral action per screen is the ideal.

### Typography

| Family | Use |
| --- | --- |
| **Fraunces** (`font-display`, `font-display-italic`) | Titles & trip names ONLY; italic for taglines/journal asides |
| **Manrope** (`font-sans`, `-medium`, `-semibold`, `-bold`, `-extrabold`) | ALL UI text |
| **Space Mono** (`font-mono`, `font-mono-bold`) | Prices, codes, dates, timestamps — "boarding-pass" details |

⚠️ **One Tailwind utility per weight** — RN selects fonts by registered name, not weight synthesis. Never combine `font-semibold` (fontWeight) with custom font families.

### Brand marks

- The "o" in "Spotted" is the coral map pin with amber dot. Use `SpottedWordmark` / `PinMark` from [src/features/brand/wordmark.tsx](src/features/brand/wordmark.tsx). **Never recolor pin and dot independently.**
- App icon: still pending (per brand notes).

### Other conventions

- Spacing on a 4pt grid; radii from tokens (`rounded-bubble` = 20px chat-bubble cards).
- Accessibility-friendly by default: `accessibilityRole`, `accessibilityLabel` on interactive elements.
- Visible back button on every pushed screen, chevron-only (see §7).
- **Image input fields** ([src/features/ui/image-input-field.tsx](src/features/ui/image-input-field.tsx)) — the one pattern for every image-picking form field. Empty: `surfaceSunken` fill, dashed `borderStrong` border, centered `+` in `inkMuted` — no instructional text ("gray" always means these warm-gray tokens, never neutral gray). Filled: the image under a ~25% black scrim with a centered white `+` (still actionable). Shapes adapt (16:9 `cover`, circle `avatar`, 4:3 `photo`); state styling never diverges. Identity placeholders (teal band, coral initial) belong to *display* surfaces like the profile header, never to input fields.
- **Dashed borders disambiguated**: dashed **coral** = CTA (Start-a-trip card, "+ Add countries" chip); dashed **warm gray** = empty image input. Don't cross them.

---

## 12. Locked Architectural Decisions

These are settled — do not relitigate without an explicit product decision:

1. **Updates are ONE table** with a type enum + typed nullable columns and per-type CHECK constraints — no JSONB payloads, no per-type child tables. Data layer exposes a TypeScript discriminated union.
2. **`happened_at` drives ordering** (thread + future itinerary day-grouping); `created_at` is immutable metadata.
3. **Money is native `amount + currency(char 3)`**; budgets roll up **per currency**; no FX conversion in MVP. `purchase.amount` and `attraction.entry_fee` share the `amount` column.
4. **No role column, ever.** "Creator" is derived from having published trips; all capability from RLS row ownership.
5. **Authenticated-only reads in MVP**; visibility logic centralized in trip RLS so anon/shareable links can be added later by touching one policy.
6. **Itinerary copy is a projection** into separate itinerary tables referencing source trip/updates — never duplicated update rows.
7. **No Supabase Realtime and no video in MVP**: fetch-on-open + pull-to-refresh. Media column is `media_path` (generic) so video adds without renames.
8. **Live/Completed are derived at read time** from status + dates — never stored, no scheduled transitions.

---

## 13. Environments, Config & Workflows

### Environments

| Environment | Supabase project | Used by |
| --- | --- | --- |
| development | `spotted-staging` | Expo Go / dev builds — everything in `.env` |
| production | `spotted-prod` | Release builds only; env injected via EAS build profiles (later). **Prod credentials never in the repo.** |

No local database stack — development talks directly to staging cloud.

### Environment variables (`.env`, inlined at bundle time — restart with `npx expo start -c` after changes)

```
EXPO_PUBLIC_SUPABASE_URL          required
EXPO_PUBLIC_SUPABASE_ANON_KEY     required
EXPO_PUBLIC_SENTRY_ENABLED        'true' to enable (+ EXPO_PUBLIC_SENTRY_DSN)
EXPO_PUBLIC_POSTHOG_ENABLED       'true' to enable (+ EXPO_PUBLIC_POSTHOG_API_KEY, optional _HOST)
```

### Migration workflow

```sh
# Author SQL in supabase/migrations/ (timestamped filename), then:
npx supabase db push          # to linked staging — verify there first
npx supabase link --project-ref <prod-ref> && npx supabase db push   # promote
npx supabase gen types typescript --linked > src/data/types.ts       # regen types
```

Supabase CLI runs via `npx` (no global install); this machine is linked to staging; `db push` auto-confirms.

### Scripts

| Command | Does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
| `npm run format` / `format:check` | Prettier |

### Development flow

Work is planned as OpenSpec changes (see §15), implemented on feature branches, PRs to `main`.

---

## 14. Observability

[src/lib/observability.ts](src/lib/observability.ts), called once at module scope in the root layout.

- **Sentry** and **PostHog** initialize only when their `EXPO_PUBLIC_*_ENABLED` flag is `'true'` AND the key/DSN is present; SDK modules are `require()`d inside the guards so disabled runs don't even load them. Dev needs no keys.
- `getPostHog()` returns the client or `undefined` — callers must handle the disabled case.
- Connectivity diagnostics: `useHealthCheck` ([src/data/health.ts](src/data/health.ts)) is currently **dormant** (no UI consumes it since the Home health card's removal) — kept deliberately for a future debug surface; don't dead-code-sweep it.

---

## 15. Planning Workflow (OpenSpec)

All product work is planned as OpenSpec changes in [openspec/](openspec/) (`spec-driven` schema). The `openspec` CLI is **not installed** — read the directory directly; [openspec/config.yaml](openspec/config.yaml) is the richest single context file (product, stack, brand, locked decisions, change sequence).

- `openspec/specs/` — current capability specs: `project-scaffold`, `user-auth`, `user-profiles`, `trips`, `trip-updates`, `trip-budget`, `media-storage`.
- `openspec/changes/` — active changes (proposal/design/specs/tasks per change).
- `openspec/changes/archive/` — completed changes.

### Change history

| Change | Status | Delivered |
| --- | --- | --- |
| `add-project-scaffold` | archived 2026-07-16 | Expo app shell, tokens, health check, tooling |
| `add-auth-and-profiles` | archived 2026-07-16 | Auth flow, profiles schema/trigger/RLS |
| `add-trips-and-updates` | archived 2026-07-16 | Hero slice: trips, typed updates, composer, thread, budget rollup |
| `redesign-profile-screen` | archived 2026-07-16 | Cover/avatar profile header, stats, trip list |
| `add-profile-media-and-storage` | archived 2026-07-18 | Avatar/cover upload, private_profiles birthday, profile-media bucket |
| `add-trip-creator` | archived 2026-07-18 | Countries/dates/cover, publish gate, draft editing, Live/Completed chips |
| `update-profile-cta-and-bottom-nav` | archived 2026-07-18 | Profile CTA card, five-slot tab bar |
| `update-display-cleanup` | archived 2026-07-18 | Health card removal, sign-out → Settings, compact CTA, `ImageInputField` pattern, chevron-only back, country-picker sheet |

---

## 16. Roadmap

Planned sequence (one OpenSpec change each), from config.yaml:

```
✅ add-project-scaffold
✅ add-auth-and-profiles
✅ add-trips-and-updates          (hero vertical slice)
✅ (interleaved: redesign-profile-screen, add-profile-media-and-storage,
    add-trip-creator, update-profile-cta-and-bottom-nav)
⬜ add-follows-and-discovery      → fills the Discover tab
⬜ add-reactions-and-saves        → makes profile saves stat real; passport surfaces
⬜ add-itinerary-copy             → the copy-with-budget headline feature
⬜ add-video-updates              → Mux; 'video' enum value + media_path already waiting
⬜ add-map-view                   → Mapbox; PostGIS
⬜ add-push-notifications         → Expo Notifications
⬜ add-realtime-thread            → replaces pull-to-refresh
⬜ UGC report/block/moderation    → REQUIRED before App Store submission (post-MVP change)
```

---

## 17. Known Quirks & Gotchas

- **AGENTS.md says Expo v57 docs, but the repo runs SDK 54.** Prefer repo-proven patterns over v57 docs when they conflict.
- **expo-router directory routes**: `trip/[id].tsx` → `trip/[id]/` directory means root-layout `Stack.Screen` names must be `trip/[id]/index` etc., or header options silently drop.
- **Prettier CRLF drift** on Windows: `format:check` can fail on untouched files from CRLF checkout; `npm run format` fixes with an empty content diff.
- **Expo Go "stuck on opening project"**: node.exe firewall rules are Public-only while the network is Private — fix elevated, or use `--tunnel`.
- **Windows dir moves**: bash `mv` on directories hits EPERM; use PowerShell `Move-Item`.
- **`.env` is bundle-time**: restart with `npx expo start -c` after edits.
- **RN fetch lacks `AbortSignal.timeout()`** — use a manual AbortController timer (see health.ts).
- **Date comparisons use string dates** (`YYYY-MM-DD` via `localToday()`) — string-comparable with Postgres `date` columns, avoiding Date-object timezone traps.
- **Publish-gate timezone slack**: the DB CHECK allows `start_date <= current_date + 1` because the server gates in UTC while the client gates in device-local time; the client is the authoritative UX.
- **`updates.mapRow` silently drops invalid/reserved rows** (returns null, filtered) — a `video` row in the DB will simply not render.
- **Profile stats**: followers/saves are hardcoded 0 until their features ship.

---

## Document Changelog

> Append a dated entry here for every meaningful edit to this document. Keep the body sections updated in place; this log records *what changed and when*.

- **2026-07-18** — Initial version. Full documentation of the app as of the `feature/trip-creation` branch: auth + profiles + profile media, trips with creator fields (countries/dates/cover/publish gate), typed updates + composer + thread + budget rollup, five-slot tab shell, four migrations, RLS model, design system, OpenSpec workflow and roadmap.
- **2026-07-18** — `update-display-cleanup` implemented: Home health card removed (`health.ts` dormant), sign out moved to Settings under Account Management (first real settings content), compact profile CTA card, new `ImageInputField` component + image-input guideline (dashed warm-gray empty / scrim-`+` filled; dashed-coral stays CTA-only) adopted by profile cover/avatar and trip-form cover, chevron-only back buttons (`headerBackButtonDisplayMode: 'minimal'` — kills the "(tabs)" label), country picker reworked to an ~80% bottom sheet. Sections 3, 7, 10, 11, 14, 15 updated.
- **2026-07-18** — All four active changes archived (`add-profile-media-and-storage`, `add-trip-creator`, `update-profile-cta-and-bottom-nav`, `update-display-cleanup`); their delta specs synced into `openspec/specs/` in change order, adding the `media-storage` capability spec. Change-history table updated.
