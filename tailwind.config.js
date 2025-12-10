/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mint': {
          50: '#effef7',
          100: '#dafeef',
          200: '#b8fadd',
          300: '#81f4c3',
          400: '#43e5a0',
          500: '#1acd81',
          600: '#0fa968',
          700: '#108554',
          800: '#126945',
          900: '#11563a',
          950: '#063020',
        },
      },
    },
  },
  plugins: [],
}
