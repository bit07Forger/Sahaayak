/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#0F766E",
          dark: "#0B5A54",
          light: "#E3F3EF",
        },
        ink: "#172321",
        canvas: "#F7F9F8",
        card: "#FFFFFF",
        border: {
          DEFAULT: "#DCE6E3",
        },
        amber: {
          DEFAULT: "#B45309",
          light: "#FDECD2",
        },
      },
      fontFamily: {
        display: ["'Atkinson Hyperlegible'", "'Atkinson Hyperlegible Next'", "sans-serif"],
        body: ["'Atkinson Hyperlegible'", "'Atkinson Hyperlegible Next'", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(23, 35, 33, 0.06)",
        card: "0 4px 20px rgba(23, 35, 33, 0.08)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
