import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        harmony: {
          teal: "#20B2AA", // Xanh ngọc
          cream: "#FFFDD0", // Trắng kem
          purple: "#6A5ACD", // Tím
          gold: "#D4AF37", // Gold
        },
      },
    },
  },
  plugins: [],
};

export default config;
