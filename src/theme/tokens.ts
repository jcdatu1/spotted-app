/**
 * Spotted design tokens — single source of truth for color, type, spacing,
 * and radii. Sources: context/Spotted.html (prototype) and
 * "context/Spotted Brand Guidelines.dc (1).html" (brand v1.0).
 *
 * Brand color names → semantic tokens: Sand=surface, Ink=ink, Deep Pine=pine,
 * Coral=primary (the ONE action color), Teal=secondary (money/saves),
 * Amber=accent (celebrate/highlights). Signals are used sparingly.
 *
 * Consumed by:
 *  - tailwind.config.js (drives every NativeWind utility class)
 *  - imperative styles that cannot use classes (e.g. tab bar tint)
 *
 * Do not hardcode values that exist here anywhere else in the app.
 */

export const colors = {
  // Warm paper neutrals
  canvas: '#E1D4C0', // deep cream — outer frames, boarding-pass edges
  surface: '#FAF4EC', // default screen background
  surfaceRaised: '#FBF6EE', // cards floating on surface
  surfaceSunken: '#EFE6D6', // inset wells, thread background
  surfaceMuted: '#EDE4D8', // chips, dividers, muted fills
  border: '#EDE4D8',
  borderStrong: '#E0D5C6',

  // Ink
  ink: '#2A2420', // primary text
  inkMuted: '#8A8078', // secondary text
  inkFaint: '#A89C90', // tertiary text, disabled
  inkInverse: '#FDF7EC', // text on dark/pine surfaces (brand on-dark cream)

  // Dark surfaces (night cards, map chrome)
  dark: '#1E1A17',
  darkRaised: '#241F1B',
  darkBorder: '#3A332D',
  pine: '#17403A', // brand "Deep Pine" — dark mode / passport surfaces

  // Coral — primary brand / actions / creator accents
  primary: '#FF6A4D',
  primaryPressed: '#D57A5F',
  primaryTint: '#FFE7E1',
  primaryFaint: '#FFF1EC',

  // Teal — secondary / money / success
  secondary: '#0F7B6C',
  secondaryPressed: '#0B5E52',
  secondaryBright: '#14907E',
  secondaryLight: '#5FB3A3',
  secondaryTint: '#DDF0EC',
  secondaryDeep: '#17403A',

  // Amber — highlights, ratings, saved
  accent: '#FFC24B',
  accentPressed: '#D69A1E',
  accentTint: '#FFF3D6',

  white: '#FFFFFF',
} as const;

/** Type scale (px). Prototype ranges 9–34px; snapped to a usable RN scale. */
export const fontSize = {
  '2xs': 10,
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  display: 34,
} as const;

export const lineHeight = {
  '2xs': 14,
  xs: 15,
  sm: 18,
  base: 21,
  lg: 24,
  xl: 27,
  '2xl': 31,
  '3xl': 37,
  display: 41,
} as const;

/**
 * Font families (brand v1.0). Values are the exact names registered by
 * expo-google-fonts (React Native selects fonts by registered name, not
 * weight synthesis — hence one entry per weight).
 *
 *  - Fraunces: display — titles & trip names only; italic for journal asides
 *  - Manrope: every button, label, and caption
 *  - Space Mono: prices, codes, dates, timestamps ("boarding-pass" details)
 */
export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemibold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  sansExtrabold: 'Manrope_800ExtraBold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

/** Spacing scale (px) — 4pt grid. */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

/** Corner radii (px) from the prototype: 12/14/18/20/22/28 + pill. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  bubble: 20, // chat-bubble update cards
  '2xl': 22,
  '3xl': 28,
  full: 9999,
} as const;

export const tokens = {
  colors,
  fontSize,
  lineHeight,
  fontFamily,
  spacing,
  radius,
} as const;

export type AppColor = keyof typeof colors;
