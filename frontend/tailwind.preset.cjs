/**
 * ELD Trip Planner — shared Tailwind theme tokens.
 * Import in tailwind.config.cjs via presets: [require('./tailwind.preset.cjs')].
 *
 * Colors (fixed RGB as requested):
 * - accent: rgb(248, 73, 96)
 * - teal:   rgb(0, 128, 128)
 * - mist:   rgb(188, 221, 222)
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        eld: {
          accent: "rgb(248, 73, 96)",
          teal: "rgb(0, 128, 128)",
          mist: "rgb(188, 221, 222)",
        },
      },
      boxShadow: {
        eld: "0 10px 40px -10px rgba(0, 128, 128, 0.25)",
      },
    },
  },
};
