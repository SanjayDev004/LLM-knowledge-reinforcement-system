/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#00d4ff",
        secondary: "#0099cc",
        dark: {
          bg: "#0f0f1a",
          card: "#1a1a2e",
          border: "#2a2a4a",
          text: "#e0e0e0",
        },
        light: {
          bg: "transparent",
          card: "rgba(255,255,255,0.8)",
          border: "#e2e8f0",
          text: "#1a1a2e",
        },
      },
    },
  },
  plugins: [],
};