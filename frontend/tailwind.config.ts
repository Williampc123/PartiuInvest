import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1F44',
          deep: '#061530',
          soft: '#1B3F86',
        },
        blue: {
          DEFAULT: '#3F6FD8',
          light: '#8FB2F5',
        },
        gold: {
          DEFAULT: '#F5B82E',
          light: '#FFE27A',
          deep: '#9A6A12',
        },
        muted: '#5B6885',
        ok: '#0F7B4B',
        danger: '#B42318',
      },
      fontFamily: {
        sans: ['Outfit', 'Nunito Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out -3s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
