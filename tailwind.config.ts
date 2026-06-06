import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // De-escape brand tokens (light, logo-true)
        brand: {
          cream: "#F5ECCE",
          "cream-soft": "#FBF6E6",
          "cream-deep": "#ECE0C0",
          green: "#2C8A4B",
          "green-deep": "#1F6336",
          "green-ink": "#14331F",
          lime: "#C8F135",
          "lime-deep": "#A9CE1E",
          "ink-dim": "#5C6B5E",
          "ink-mute": "#8A9384",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(56px,9vw,124px)", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
        "display-lg": ["clamp(40px,5.5vw,68px)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(32px,4vw,52px)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      backdropBlur: {
        xs: "4px",
      },
      keyframes: {
        spin: { to: { transform: "rotate(360deg)" } },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        spin: "spin 12s linear infinite",
        shimmer: "shimmer 2s infinite linear",
        "fade-up": "fade-up 0.6s ease forwards",
      },
    },
  },
  plugins: [],
};
export default config;
