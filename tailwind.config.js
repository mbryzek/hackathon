/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f9fafb',    // gray-50
          dark: '#1f2937',     // gray-800
          darker: '#111827',   // gray-900
        },
        accent: {
          DEFAULT: '#eab308',  // yellow-500
          light: '#fef9c3',    // yellow-100
          bright: '#facc15',   // yellow-400
          hover: '#ca8a04',    // yellow-600
          cta: '#fde047',      // yellow-300
        },
        content: {
          DEFAULT: '#1f2937',  // gray-800
          muted: '#4b5563',    // gray-600
          subtle: '#9ca3af',   // gray-400
          inverse: '#ffffff',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
