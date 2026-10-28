import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        ink: "var(--text)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        line: "var(--border)",
      },
    },
  },
  plugins: [],
};

export default config;
