import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1320px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        bg: "#0a0e1a",
        surface: "#111827",
        surface2: "#0f1525",
        elevated: "#172033",
        border: "#1f2937",
        border2: "#161e2d",
        ink: "#f3f4f6",
        ink2: "#d1d5db",
        muted: "#9ca3af",
        faint: "#6b7280",
        fainter: "#4b5563",
        fire: "#dc2626",
        fire2: "#ef4444",
        fire3: "#f87171",
        ember: "#f97316",
        pass: "#10b981",
        warn: "#f59e0b",
        alarm: "#dc2626",
        info: "#3b82f6",
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      letterSpacing: {
        widest2: "0.12em",
        widest3: "0.18em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02) inset",
        elev: "0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset",
        glow: "0 0 0 1px rgba(220,38,38,0.4), 0 0 24px -4px rgba(220,38,38,0.25)",
      },
      keyframes: {
        "slide-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.4s ease forwards",
        "fade-up": "fade-up 0.25s ease forwards",
        "soft-pulse": "soft-pulse 2.4s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
