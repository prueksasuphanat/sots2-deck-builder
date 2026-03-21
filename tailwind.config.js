/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-red':    '0 0 18px rgba(239,68,68,0.45)',
        'glow-green':  '0 0 18px rgba(16,185,129,0.45)',
        'glow-blue':   '0 0 18px rgba(14,165,233,0.45)',
        'glow-orange': '0 0 18px rgba(249,115,22,0.45)',
        'glow-pink':   '0 0 18px rgba(236,72,153,0.45)',
        'glow-gold':   '0 0 18px rgba(245,158,11,0.35)',
      },
      animation: {
        'float':    'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.25s ease-out',
        'fade-in':  'fadeIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer':  'shimmer 1.8s linear infinite',
      },
      keyframes: {
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
        slideUp:    { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulseSoft:  { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
