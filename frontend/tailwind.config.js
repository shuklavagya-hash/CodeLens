/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          DEFAULT: '#0A0F0A',   // near-black terminal background
          deep: '#060906',      // darker panel background
          line: '#1A3A1A',      // grid / hairline color
        },
        paper: '#E8FFF0',        // node fill, primary light text (soft green-white)
        muted: '#6AAE7A',        // secondary text (dim green)
        signal: '#4DFF88',       // accent — selection / blast-radius / interactive glow
        safe: '#2A5A3A',         // unaffected / structural accent
      },
      fontFamily: {
        display: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        body: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        data: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'blueprint-grid':
          'linear-gradient(rgba(77,255,136,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(77,255,136,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
};
