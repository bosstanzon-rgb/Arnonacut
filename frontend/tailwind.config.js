const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        /* Primary: deep teal + bright teal (Gov.il-adjacent, calmer) */
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        /* Accent / success — warm emerald */
        forest: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        /* Israeli flag blue — subtle trust accents */
        trust: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#0038b8",
          600: "#002d92",
          700: "#00226d",
        },
        calm: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Rubik",
          "Assistant",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        calm: "0 4px 24px -4px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        "calm-lg": "0 20px 50px -12px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        premium:
          "0 32px 64px -24px rgba(15, 118, 110, 0.22), 0 0 0 1px rgba(15, 118, 110, 0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
        glow: "0 0 0 1px rgba(20, 184, 166, 0.2), 0 20px 50px -12px rgba(15, 118, 110, 0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ring-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(20, 184, 166, 0.35)" },
          "50%": { boxShadow: "0 0 0 14px rgba(20, 184, 166, 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "confetti-fall": {
          "0%": { transform: "translate3d(0, -20%, 0) rotate(0deg)", opacity: "0" },
          "12%": { opacity: "0.9" },
          "100%": { transform: "translate3d(var(--tw-drift, 12px), 120%, 0) rotate(260deg)", opacity: "0" },
        },
        "check-pop": {
          "0%": { transform: "scale(0.45)", opacity: "0" },
          "65%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in": "fade-in 0.45s ease-out forwards",
        "scale-in": "scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        shimmer: "shimmer 2.2s ease-in-out infinite",
        "ring-pulse": "ring-pulse 2.2s ease-out infinite",
        float: "float 5s ease-in-out infinite",
        "confetti-fall": "confetti-fall 2.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "check-pop": "check-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("rtl", '[dir="rtl"] &');
      addVariant("ltr", '[dir="ltr"] &');
    }),
  ],
};
