import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#15171a",
        parchment: "#f7f3ea",
        moss: "#4f6546",
        wine: "#7a2f42",
        brass: "#b48b45",
      },
    },
  },
  plugins: [],
};

export default config;

