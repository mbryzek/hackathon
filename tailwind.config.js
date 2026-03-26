/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'hackathon-blue': '#5B7FF6',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
