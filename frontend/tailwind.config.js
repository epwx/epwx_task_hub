/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    {
      pattern: /bg-gradient-(to|from|via)-(r|l|t|b|tr|tl|br|bl)/,
    },
    {
      pattern: /from-(blue|purple|pink|green|gray|white|emerald)-(50|100|200|300|400|500|600|700|800)/,
    },
    {
      pattern: /via-(blue|purple|pink|green|gray|white|emerald)-(50|100|200|300|400|500|600|700|800)/,
    },
    {
      pattern: /to-(blue|purple|pink|green|gray|white|emerald)-(50|100|200|300|400|500|600|700|800)/,
    },
    {
      pattern: /animate-(pulse|spin|ping|bounce|fadeIn|slideInLeft|slideInRight|float|shimmer|gradientShift)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
