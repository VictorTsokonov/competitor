import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        rule: "var(--rule)",
        card: "var(--card)",
        cream: "var(--cream)",
        "cat-setting": "var(--cat-setting)",
        "cat-definition": "var(--cat-definition)",
        "cat-rule": "var(--cat-rule)",
        "cat-goal": "var(--cat-goal)",
        "cat-informal": "var(--cat-informal)",
        "cat-rule-hi": "var(--cat-rule-hi)",
        "cat-goal-hi": "var(--cat-goal-hi)",
      },
      fontFamily: {
        display: ["var(--font-display)", "cursive"],
        body: ["var(--font-body)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
