/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
        },
        secondary: {
          400: '#f093fb',
          500: '#f5576c',
          600: '#e53e3e',
        },
        success: {
          400: '#43e97b',
          500: '#38d66a',
          600: '#2d7738',
        },
        accent: {
          400: '#4facfe',
          500: '#00f2fe',
        },
        warm: {
          300: '#ffecd2',
          400: '#fcb69f',
        },
        chart: {
          volume: '#8884d8',
          weight: '#82ca9d',
          sets: '#ffc658',
          muscle1: '#ff7c7c',
          muscle2: '#8dd1e1',
          muscle3: '#d084d0',
          muscle4: '#ffb347',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-success': 'linear-gradient(135deg, #43e97b 0%, #38d66a 100%)',
        'gradient-accent': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-warm': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'card': '0 4px 15px rgba(0, 0, 0, 0.1)',
        'hover': '0 8px 25px rgba(0, 0, 0, 0.15)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'glass': '8px',
      },
      fontFamily: {
        'primary': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'display': ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};