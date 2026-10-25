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
          orange: '#F97316',
          'orange-hover': '#EA580C',
          black: '#111111',
          charcoal: '#171717',
          gray: {
            light: '#F8F8F8',
            border: '#E5E5E5',
            text: '#737373',
          },
          success: '#16A34A',
          warning: '#EAB308',
          error: '#DC2626',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
