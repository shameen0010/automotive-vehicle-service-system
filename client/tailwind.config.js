/**
 * Tailwind CSS configuration
 * - Scans the specified content files for class usage
 * - Extends the theme with custom color tokens and shadows
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant palette
        bg: '#0b1020', // deep navy
        surface: '#10182a', // slightly lighter, modern surface
        accent: '#4fffb0', // vibrant green accent
        primary: '#3fa7ff', // vibrant blue accent
        muted: '#a3b8d0', // lighter muted
        glass: 'rgba(255, 255, 255, 0.06)', // slightly more visible glass
        // Extra accent for gradients
        accent2: '#38e8fc', // cyan accent for gradients
      },
      boxShadow: {
        soft: '0 8px 30px rgba(2, 6, 23, 0.7)',
        glass: '0 6px 18px rgba(2, 6, 23, 0.5)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};