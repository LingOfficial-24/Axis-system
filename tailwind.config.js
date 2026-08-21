/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // The UI uses `font-display` for headings — mapped to the system
        // sans stack so it renders crisply everywhere with zero extra
        // font-loading setup. Swap this for a real display font later if
        // you want a more distinct look (e.g. next/font with "Sora").
        display: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
