/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#00000a', s1: '#06060f', s2: '#0a0a18',
        c1: '#00f5ff', c2: '#ff00aa', c3: '#7b2fff', gold: '#ffd700',
        gry: '#5a6080'
      },
      fontFamily: {
        orb: ['Orbitron', 'sans-serif'],
        raj: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
}
