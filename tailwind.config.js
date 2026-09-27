/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Kích hoạt Dark Mode bằng class
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        appBg: "var(--bg-primary)",
        cardBg: "var(--bg-card)",
        textSub: "var(--text-secondary)",
        borderSub: "var(--border-color)",
      },
    },
  },
  plugins: [],
};
