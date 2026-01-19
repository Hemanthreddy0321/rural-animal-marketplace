/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        appGreen: "#66CC66",       // light green
        appDark: "#0F3D0F",        // dark green
      },
    },
  },
  plugins: [],
};
