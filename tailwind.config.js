module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",      // <-- LEGG TIL DENNE
    "./components/**/*.{js,ts,jsx,tsx}",
    // "./app/**/*.{js,ts,jsx,tsx}",        // Kan stå, men er ikke nødvendig uten app-directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}