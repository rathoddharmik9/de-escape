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
        // De-escape brand tokens
        brand: {
          bg: "#0a0815",
          "bg-2": "#120e22",
          ink: "#f6efe1",
          "ink-2": "#b8b0c8",
          "ink-3": "#7a738a",
          coral: "#ff7a5c",
          peach: "#ffb088",
          amber: "#f4c97a",
          pink: "#ff8fb2",
          violet: "#8a7fe6",
          teal: "#5dcaa5",
          // Category colors
          "sound-bath": "#8a7fe6",
          supper: "#ff7a5c",
          run: "#5dcaa5",
          "book-circle": "#f4c97a",
        },
        glass: "rgba(255,255,255,0.06)",
      },
      fontFamily: {
        serif: ["Instrument Serif", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
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
