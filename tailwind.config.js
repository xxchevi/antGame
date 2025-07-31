/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      colors: {
        // 蚂蚁帝国主题色彩
        ant: {
          50: '#fefdf8',
          100: '#fef7e0',
          200: '#fdecc8',
          300: '#fbd9a5',
          400: '#f7c069',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        earth: {
          50: '#f7f3f0',
          100: '#ede4d8',
          200: '#dcc7b0',
          300: '#c7a482',
          400: '#b08660',
          500: '#9c6d47',
          600: '#8b5a3c',
          700: '#744a33',
          800: '#5f3d2e',
          900: '#4f3429',
        },
        tunnel: {
          50: '#f6f3f0',
          100: '#e8e0d8',
          200: '#d4c4b0',
          300: '#bba082',
          400: '#a68660',
          500: '#8b6d47',
          600: '#75593c',
          700: '#614a33',
          800: '#523e2e',
          900: '#473529',
        }
      },
      fontFamily: {
        'game': ['Comic Sans MS', 'cursive'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)' },
        }
      },
      backgroundImage: {
        'ant-gradient': 'linear-gradient(135deg, #fef7e0 0%, #f59e0b 100%)',
        'earth-gradient': 'linear-gradient(180deg, #f7f3f0 0%, #8b5a3c 100%)',
        'tunnel-gradient': 'linear-gradient(90deg, #e8e0d8 0%, #614a33 100%)',
      },
      boxShadow: {
        'ant': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
        'earth': '0 4px 14px 0 rgba(139, 90, 60, 0.25)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(245, 158, 11, 0.1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      }
    },
  },
  plugins: [
    // require('@tailwindcss/typography'),
  ],
}