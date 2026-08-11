/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#06080E', // Main background
          925: '#0C111A', // Workspace background
          900: '#121826', // Cards background
          850: '#182132', // Elevated cards background
          800: '#202B3D', // Inputs background
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
        },
        gis: {
          bg: '#06080E',
          workspace: '#0C111A',
          panel: '#121826',
          elevated: '#182132',
          input: '#202B3D',
          border: 'rgba(255,255,255,0.05)',
        },
        primary: {
          DEFAULT: '#3B82F6', // Apple Blue primary color
          dark: '#2563EB',
          light: '#60A5FA',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        purple: '#8B5CF6',
        accent: '#06B6D4',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        glow: '0 0 15px rgba(37, 99, 235, 0.5)',
      },
    },
  },
  plugins: [],
}
