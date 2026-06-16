/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8A838',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        honey: {
          DEFAULT: '#E8A838',
          light: '#F5D78E',
          dark: '#D49420',
          cream: '#FFF8E7',
          warm: '#FFEFC8',
        },
        bee: {
          black: '#2C2416',
          dark: '#3D3220',
          brown: '#6B5B3E',
          stripe: '#4A3F2A',
        },
        hive: {
          bg: '#FDF6E3',
          dark: '#2A2318',
        },
        pollen: {
          yellow: '#FFE135',
          orange: '#FF9F1C',
        },
        nectar: {
          pink: '#FFB088',
        },
        leaf: {
          green: '#7CB342',
          light: '#AED581',
        },
        accent: {
          orange: '#FFA500',
          green: '#32CD32',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        display: ['ZCOOL XiaoWei', 'serif'],
      },
      animation: {
        'bounce-slow': 'bounce 1.5s infinite',
        'bee-fly': 'beeFly 3s ease-in-out infinite',
        'bee-buzz': 'beeBuzz 0.3s ease-in-out infinite',
        'wing-flap': 'wingFlap 0.1s ease-in-out infinite',
        'honey-drip': 'honeyDrip 2s ease-in-out infinite',
        'pollen-float': 'pollenFloat 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'hex-pulse': 'hexPulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'honey': '0 2px 8px rgba(232, 168, 56, 0.1), 0 0 0 1px rgba(232, 168, 56, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'honey-lg': '0 4px 16px rgba(232, 168, 56, 0.2), 0 0 0 1px rgba(232, 168, 56, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'hive': '0 4px 12px rgba(232, 168, 56, 0.4), 0 0 0 1px rgba(212, 148, 32, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      },
      borderRadius: {
        'hive': '16px',
        'hive-lg': '24px',
      },
    },
  },
  plugins: [],
};
