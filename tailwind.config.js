/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warm charcoal
        ink: {
          50: '#f7f7f6',
          100: '#e4e4e2',
          200: '#c9c9c5',
          300: '#a7a7a1',
          400: '#85857e',
          500: '#6b6b64',
          600: '#54544e',
          700: '#454541',
          800: '#393936',
          900: '#31312f',
          950: '#1a1a19',
        },
        // Soft sage accent
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c8d8c8',
          300: '#a1bca1',
          400: '#769a76',
          500: '#567d56',
          600: '#436443',
          700: '#375037',
          800: '#2e412e',
          900: '#273627',
          950: '#121d12',
        },
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(86, 125, 86, 0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
      },
      animation: {
        'in': 'in 0.4s ease-out',
        'in-up': 'in-up 0.4s ease-out',
        'scale': 'scale 0.2s ease-out',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
