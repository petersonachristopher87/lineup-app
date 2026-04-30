/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        battery: "#fbbf24",
        infield: "#60a5fa",
        outfield: "#34d399",
        bench: "#9ca3af",
      },
    },
  },
  plugins: [],
}
