/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hc: {
          bg: '#000000',
          text: '#ffffff',
          accent: '#facc15', // Neon yellow for high contrast selections
          border: '#facc15',
        }
      }
    },
  },
  plugins: [],
}
