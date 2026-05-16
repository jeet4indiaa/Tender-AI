import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0D1117",
        paper: "#F5F3EE",
        muted: "#8B8680",
        accent: "#1B6FE8",
        success: "#0A8F5C",
        warn: "#C17D0A",
        danger: "#C0392B",
        border: "#E2DED8",
        card: "#FDFCFA",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
