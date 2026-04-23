import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-mono)", "ui-monospace", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        bg: "#080c10",
        surface: "#0d1420",
        surface2: "#0a1520",
        border: "#1a2535",
        border2: "#111c2a",
        ink: "#e0e8f0",
        ink2: "#c8d8e8",
        muted: "#7a9ab0",
        faint: "#556",
        fainter: "#334",
        fire: "#ff4500",
        fire2: "#ff7a00",
        fire3: "#ff6030",
        pass: "#4ade80",
        warn: "#f5c842",
        alarm: "#ff2d2d",
        info: "#8888ff",
      },
      borderRadius: {
        lg: "4px",
        md: "3px",
        sm: "2px",
      },
      letterSpacing: {
        widest2: "0.15em",
        widest3: "0.2em",
      },
      keyframes: {
        "slide-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.5s ease forwards",
        "fade-up": "fade-up 0.3s ease forwards",
        "soft-pulse": "soft-pulse 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
