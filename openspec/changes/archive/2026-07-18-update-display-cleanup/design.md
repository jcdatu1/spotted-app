# Design — update-display-cleanup

## Context

Follow-up polish across surfaces shipped by add-project-scaffold (HealthCard), update-profile-cta-and-bottom-nav (Settings placeholder, CTA card), add-profile-media-and-storage (avatar/cover pickers), and add-trip-creator (trip-form cover picker). Decisions below were settled in explore mode with the product owner.

## Goals / Non-Goals

**Goals:** remove dev-only UI from Home; give Settings its first real content with a reusable section pattern; visual height parity between the create-trip CTA and trip cards; one shared, documented empty/filled pattern for image input fields; chevron-only back buttons (no "(tabs)" route-name placeholder); country picker as a partial-height sheet clear of the iOS status bar.
**Non-Goals:** deleting the health-check data layer; any other settings content; composer attach-flow adoption; changing display-surface placeholders (profile header teal band / initial).

## Decisions

### D1: HealthCard goes, the hook stays
`HealthCard` and its `ListFooterComponent` slot are deleted from `src/app/(tabs)/index.tsx`. `src/data/health.ts` (`useHealthCheck`, `checkHealth`) is retained unreferenced as dormant infrastructure for a future diagnostics/debug surface — per product direction, not dead-code cleanup. The trips spec's "health-check card remains present" clause is dropped.

### D2: Settings section + row pattern
Settings renders sections as a `tracking-widest` muted uppercase heading (same label style as the profile's TRIPS header) over a bordered `surfaceRaised` card of rows. A row is a full-width `Pressable` with a label; sign out is the first row, labeled in coral (`text-primary`) since it's an action (coral is the one action color). Behavior is unchanged: tapping it calls `signOut()` immediately, no confirmation (matches today's button). The section/row markup stays local to `settings.tsx` until a second section exists — no premature shared component. The profile screen drops its sign-out block and the now-unused `AuthButton`/`signOut` imports.

### D3: CTA card shrinks in place
`StartTripCard` keeps its centered stacked layout (per product choice over the boarding-pass restructure) with tightened metrics: `py-5` → `py-3`, `mt-1`/`mt-0.5` gaps reduced, so its rendered height lands at the trip cards' ~100px intrinsic height. Parity is verified against a real `TripCard` on device; a pinned `height` is a fallback only if padding alone can't get there (TripCard's height is intrinsic, so a hard-coded value would drift).

### D4: One `ImageInputField`, shape-adaptive
New shared component (`src/features/ui/image-input-field.tsx`) owning both states of every image input:

- **Empty**: `surfaceSunken` fill, dashed `borderStrong` border, centered `+` in `inkMuted`. No instructional text ("Tap to add…" labels are removed — the field's form label + accessibility label carry meaning).
- **Filled**: the image (`expo-image`, `contentFit="cover"`) under a dark scrim (~25% black) with a centered white `+`, signaling the field is still actionable.

Variants adapt geometry, not styling: `cover` (full-width rect at `COVER_ASPECT`), `avatar` (circle at a caller-given size, dashed border follows the radius), `photo` (post/trip photo inputs; available for future composer use, not adopted there now). Callers pass the display URI (draft-or-persisted resolution stays in the screens), `onPress`, and accessibility label. Adopted at three call sites: edit-profile cover, edit-profile avatar (replacing the coral initial-circle and "Change photo" label — the initial placeholder remains a *display* affordance on the profile header only), and trip-form cover.

### D5: Back button goes chevron-only
The "(tabs)" label is iOS native-stack behavior: the back button shows the previous screen's title, and the `(tabs)` route has none, so the route name leaks through. Fix at the source: `headerBackButtonDisplayMode: 'minimal'` added to the root layout's shared `pushedHeader` options (covers trip/new, profile/edit, trip/[id]/*, and every future pushed screen) and to the auth stack's `screenOptions` (whose now-pointless `headerBackTitleStyle` is removed). Chevron-only, no per-screen `headerBackTitle` strings to maintain; Android is unaffected (it never shows back labels). The visible-back-button convention itself is untouched.

### D6: Country picker becomes an 80% bottom sheet
Today's `CountryPickerModal` is a plain full-screen `Modal` (`animationType="slide"`) whose `pt-4` content starts under the iOS status bar/notch. It becomes a partial-height sheet: the `Modal` goes `transparent`, wrapping a bottom-anchored container at ~80% of screen height with rounded top corners and a dim pressable backdrop filling the remaining ~20% (tap to dismiss, same as Done). The sheet's own top padding replaces safe-area concerns entirely — the notch area is backdrop, not content. Internals (search field, FlatList, Done, toggle behavior) are unchanged. Plain RN `Modal` + `View` sizing; no bottom-sheet library for a single picker.

### D7: Guideline documented, distinction named
SPOTTED_BIBLE.md gains an image-input-field section: the two states, the token choices ("gray" = warm-gray tokens, never neutral gray), and the dashed-border disambiguation — dashed **coral** = navigation/CTA (StartTripCard, + Add countries), dashed **borderStrong gray** = empty input field.

## Risks / Trade-offs

- [Empty avatar input loses the identity-colored placeholder] → intentional: input fields read as inputs; identity placeholders live on display surfaces.
- [Persistent scrim slightly darkens chosen images in edit contexts] → acceptable; it's the affordance the guideline standardizes. Kept light (~25%).
- [Keeping health.ts unreferenced may trip future dead-code sweeps] → it's deliberate; noted in the Bible changelog.
- [CTA height parity is visual, not structural] → checked on device; documented fallback (pinned height) if content metrics change later.

## Migration Plan

Code-only; normal gates (`typecheck`, `lint`, `format:check`) + device walk (Home without card, Settings sign-out flow, CTA parity, all three image inputs in both states, pushed screens show a bare chevron back button, country sheet opens at ~80% with the top clear on iOS).

## Open Questions

- None blocking.
