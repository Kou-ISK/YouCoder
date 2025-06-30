/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx}",
    "./content.tsx",
    "./popup.tsx",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
