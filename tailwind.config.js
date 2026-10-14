/*
  One config for both modes:
  - Preview: index.html loads the Tailwind CDN, then this file sets `tailwind.config`.
  - Build:   the Tailwind CLI reads it through `module.exports`.
*/
const config = {
  content: ['./index.html', './script.js'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

if (typeof module !== 'undefined') module.exports = config;
if (typeof tailwind !== 'undefined') tailwind.config = config;
