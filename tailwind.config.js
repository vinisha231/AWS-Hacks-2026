/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Remap neutral to a warm espresso-brown palette
        neutral: {
          950: '#150c06',
          900: '#1e1008',
          800: '#2a160a',
          700: '#3a200f',
          600: '#563016',
          500: '#7a4a28',
          400: '#a36b42',
          300: '#c49272',
          200: '#dbbfa0',
          100: '#eedad0',
          50:  '#f9f3ee',
        },
      },
    },
  },
  plugins: [],
}
