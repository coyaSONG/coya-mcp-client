/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          '100': 'rgb(219 234 254 / <alpha-value>)',
          '400': 'rgb(96 165 250 / <alpha-value>)',
          '600': 'rgb(37 99 235 / <alpha-value>)',
          '900': 'rgb(30 58 138 / <alpha-value>)',
        },
        gray: {
          '100': 'rgb(243 244 246 / <alpha-value>)',
          '200': 'rgb(229 231 235 / <alpha-value>)',
          '300': 'rgb(209 213 219 / <alpha-value>)',
          '600': 'rgb(75 85 99 / <alpha-value>)',
          '700': 'rgb(55 65 81 / <alpha-value>)',
          '800': 'rgb(31 41 55 / <alpha-value>)',
        },
        yellow: {
          '100': 'rgb(254 249 195 / <alpha-value>)',
          '900': 'rgb(113 63 18 / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
  hoverOnlyWhenSupported: true,
};
