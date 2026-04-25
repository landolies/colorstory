import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'hsl(var(--paper) / <alpha-value>)',
        'paper-elevated': 'hsl(var(--paper-elevated) / <alpha-value>)',
        ink: 'hsl(var(--ink) / <alpha-value>)',
        rule: 'hsl(var(--rule) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces Variable"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono Variable"', 'Menlo', 'monospace'],
      },
      animation: {
        'wiggle-a': 'wiggle-a 0.18s ease-in-out infinite',
        'wiggle-b': 'wiggle-b 0.18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
