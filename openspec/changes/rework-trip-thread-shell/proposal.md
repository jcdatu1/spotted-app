# rework-trip-thread-shell

## Why

Opening a trip thread or another user's profile loses the bottom nav: both routes are root-stack pushes that cover the tab navigator, so the app's primary navigation exists only on the five tab roots. On the thread itself, the owner's pinned composer bar does double duty (type selector + four forms) and eats vertical space that a persistent tab bar would make worse — and the scaffold spec already marked the center + button's "new trip" behavior as provisional until a composer sheet exists. Finally, the owner's own updates render left-aligned like inbound messages; a creator reading their own trip should see it as *their* outbound thread.

## What Changes

- **Persistent tab bar on pushed screens**: restructure `(tabs)` into per-tab stacks using shared route groups — `(home)`, `(discover)`, `(profile)` each get a nested Stack, and `trip/[id]` + `user/[id]` move into a shared `(home,discover,profile)` group so they push *inside* whichever tab opened them, keeping the bar visible and the tab highlighted. Form screens (`trip/new`, `trip/[id]/edit`, `profile/edit`) stay full-screen root-stack pushes.
- **Context-aware center + button**: on a trip thread the signed-in user owns, + opens an update-type picker (Note / Photo / Purchase / Place); everywhere else — other tabs, someone else's trip or profile — it keeps opening the trip creation flow. The focused thread advertises itself through a small zustand store the tab button reads.
- **Composer becomes a sheet**: choosing a type opens that type's form as a bottom sheet (built-in RN `Modal`, no new dependency) over the thread. The inline `ComposerBar` is removed; posting still appends to the thread without leaving the screen. Owner empty-state copy points at the + button.
- **SMS-style alignment**: the whole thread aligns by viewer — the owner sees updates right-aligned (outbound), everyone else sees them left-aligned (inbound). Alignment and timestamp alignment only; per-type card styling is untouched (later change).

Out of scope: outbound bubble restyling (colors/fills), tab bar on the form screens, reactions, video, any schema or RLS change.

## Capabilities

### Modified Capabilities

- `project-scaffold`: tab shell keeps the bar on pushed trip-thread and user-profile screens; the center + button becomes context-aware (composer picker on owned threads, new trip elsewhere).
- `trip-updates`: composer entry point moves from the in-thread bar to the + button with a picker + bottom-sheet forms; thread rendering gains viewer-relative alignment.

## Impact

- **Code**: `src/app/_layout.tsx` (drop `trip/[id]/index` + `user/[id]` registrations), `src/app/(tabs)/_layout.tsx` (group screen names, context-aware button), new `(home)`/`(discover)`/`(profile)` group layouts + moved screens, shared `(home,discover,profile)/trip/[id]/index.tsx` and `user/[id].tsx`, new `src/features/composer/composer-store.ts` (zustand) and `composer-sheet.tsx` (forms ported from `composer-bar.tsx`, which is deleted), `src/features/trip-thread/thread-screen.tsx` (focus registration, alignment prop, empty-state copy), `src/features/trip-thread/update-bubble.tsx` (alignment), `SPOTTED_BIBLE.md`.
- **Dependencies/Systems**: no new packages (zustand already installed; sheet is RN `Modal`); no migrations.
- **Follow-on**: outbound bubble styling pass, reactions entry points on the persistent shell, composer sheet reuse for video updates.
