/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          DEFAULT: '#0B2545',   // deep blueprint navy — base background
          deep: '#071A33',      // darker panel background
          line: '#2C4A73',      // grid / hairline color
        },
        paper: '#E8F1FF',        // node fill, primary light text
        muted: '#7C93B3',        // secondary text
        signal: '#FF8A3D',       // blast-radius / warning amber accent
        safe: '#5FD4A8',         // unaffected / safe accent
      },
      fontFamily: {
        display: ['"Space Mono"', 'ui-monospace', 'monospace'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        data: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'blueprint-grid':
          'linear-gradient(rgba(197,217,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(197,217,241,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
};
