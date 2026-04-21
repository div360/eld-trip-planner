/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("./tailwind.preset.cjs")],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
};
