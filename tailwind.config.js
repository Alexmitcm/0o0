/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./apps/web/index.html",
    "./apps/web/src/**/*.{js,ts,jsx,tsx,html,css}"
  ],
  plugins: [
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms")
  ],
  theme: {
    extend: {
      animation: {
        shimmer: "shimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      },
      colors: {
        brand: {
          50: "#fff0f2",
          300: "#ffa1ad",
          500: "#fb3a5d"
        }
      },
      fontFamily: {
        display: [
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        primary: [
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        }
      }
    }
  }
};
