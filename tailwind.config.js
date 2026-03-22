/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"]
      },
      colors: {
        ink: "#08111f",
        slate: "#0d1727",
        panel: "#121f33",
        accent: "#43d9bd",
        warn: "#ffb84d",
        danger: "#ff6b81",
        glow: "#51c4ff"
      },
      boxShadow: {
        soft: "0 22px 60px rgba(4, 12, 24, 0.45)"
      }
    }
  },
  plugins: []
};
