/**
 * ELD Trip Planner — Tailwind preset (Spotter-inspired dark logistics + coral accent).
 * Inspired by https://spotter.ai/ modern dark-mode fleet UI + brand DNA sheet.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "Segoe UI", "sans-serif"],
      },
      colors: {
        eld: {
          accent: "rgb(248, 73, 96)",
          teal: "rgb(0, 128, 128)",
          mist: "rgb(188, 221, 222)",
        },
        /** Spotter-style dark logistics */
        spotter: {
          bg: "#13242c",
          deep: "#0a1218",
          surface: "#1b3844",
          turquoise: "#40e0d0",
          cream: "#f4f1ea",
        },
      },
      boxShadow: {
        eld: "0 10px 40px -10px rgba(0, 128, 128, 0.25)",
        coral: "0 0 32px -8px rgba(248, 73, 96, 0.45)",
        glass: "0 8px 32px -8px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        map: "0 24px 48px -12px rgba(0, 0, 0, 0.55)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
};
