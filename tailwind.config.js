// Theme values come exclusively from src/theme/tokens.ts — edit tokens there,
// never here. jiti (ships with tailwindcss) lets this CJS config load the TS module.
const jiti = require('jiti')(__filename);
const { tokens } = jiti('./src/theme/tokens');

const px = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, `${v}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: tokens.colors,
    fontFamily: {
      display: [tokens.fontFamily.display],
      'display-italic': [tokens.fontFamily.displayItalic],
      sans: [tokens.fontFamily.sans],
      'sans-medium': [tokens.fontFamily.sansMedium],
      'sans-semibold': [tokens.fontFamily.sansSemibold],
      'sans-bold': [tokens.fontFamily.sansBold],
      'sans-extrabold': [tokens.fontFamily.sansExtrabold],
      mono: [tokens.fontFamily.mono],
      'mono-bold': [tokens.fontFamily.monoBold],
    },
    fontSize: Object.fromEntries(
      Object.entries(tokens.fontSize).map(([k, v]) => [
        k,
        [`${v}px`, { lineHeight: `${tokens.lineHeight[k]}px` }],
      ]),
    ),
    spacing: px(tokens.spacing),
    borderRadius: { ...px(tokens.radius), none: '0px' },
    extend: {},
  },
  plugins: [],
};
