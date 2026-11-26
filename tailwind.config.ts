import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#0a1128", 900: "#0f1b3d", 800: "#152a5e", 700: "#1c3a7d", 600: "#274b9e" },
        brand: { red: "#d7263d", amber: "#e8a33d", green: "#1f9d55", gray: "#6b7280" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 1px 3px rgba(15, 27, 61, 0.08), 0 1px 2px rgba(15, 27, 61, 0.06)" },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
