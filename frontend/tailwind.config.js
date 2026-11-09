/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'rgb(var(--theme-primary-rgb) / 0.06)',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
          600: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
          700: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
          800: '#14532d',
          900: '#052e16',
          950: '#021f0e',
        },
        accent: 'rgb(var(--theme-accent-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--theme-secondary-rgb) / <alpha-value>)',
        white: 'rgb(var(--theme-surface-rgb) / <alpha-value>)',
        slate: {
          50: 'rgb(var(--theme-background-rgb) / <alpha-value>)',
          800: 'rgb(var(--theme-text-rgb) / <alpha-value>)',
          900: 'rgb(var(--theme-text-rgb) / <alpha-value>)',
        },
        navy: {
          800: '#0f172a',
          900: '#090d16',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
