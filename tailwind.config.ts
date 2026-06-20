import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black:  "#000000",
        card:   "#0A0A0A",
        cyan:   "#00FFD1",
        muted:  "#5B5B5B",
        gray3:  "#6e6e73",
        gray4:  "#86868b",
        gray5:  "#aeaeb2",
        amber:  "#ffb800",
        purple: "#b08fff",
      },
      fontFamily: {
        sans: ["-apple-system", "SF Pro Display", "Inter", "Helvetica Neue", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        pill: "980px",
      },
      animation: {
        "breathe":   "breathe 3s ease-in-out infinite",
        "marquee":   "marquee 32s linear infinite",
        "ring-fade": "ring-fade 5s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.3" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "ring-fade": {
          "0%, 100%": { opacity: "0.8" },
          "50%":      { opacity: "0.25" },
        },
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
