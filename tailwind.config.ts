import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fcd9a8',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff8000',
          600: '#d96b00',
          700: '#b35800',
          800: '#8a4400',
          900: '#6b3400',
        },
      },
    },
  },
  plugins: [],
}

export default config
