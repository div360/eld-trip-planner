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
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        floatGlow: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "40%": { transform: "translate(3%, -4%) scale(1.04)" },
          "70%": { transform: "translate(-4%, 3%) scale(0.96)" },
        },
        iconBob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        borderGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        truckAlong: {
          "0%": { left: "0.25rem" },
          "100%": { left: "calc(100% - 3.85rem)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up-slow": "fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
        "fade-in": "fadeIn 0.5s ease-out both",
        "float-glow": "floatGlow 22s ease-in-out infinite",
        "float-glow-delayed": "floatGlow 26s ease-in-out infinite reverse",
        "icon-bob": "iconBob 4s ease-in-out infinite",
        "icon-bob-delay": "iconBob 4.5s ease-in-out 0.6s infinite",
        "border-glow": "borderGlow 5s ease-in-out infinite",
        "truck-along": "truckAlong 2.3s ease-in-out infinite alternate",
      },
    },
  },
};
