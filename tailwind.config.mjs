/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      textColor: {
        DEFAULT: "var(--foreground)"
      },
      fontFamily: {
        // Adding Arabic-optimized fonts
        arabic: [
          'IBM Plex Sans Arabic',
          'Noto Sans Arabic',
          // Android Arabic fonts
          'Droid Arabic Naskh',
          'Roboto-Regular',
          'HelveticaNeue',
          'Dubai',
          'Almarai',
          'system-ui',
          'sans-serif'
        ],
      },
      // Adding custom line heights for better Arabic text spacing
      lineHeight: {
        'arabic-relaxed': '1.75',
        'arabic-loose': '2',
      },
      // Adding custom letter spacing for Arabic
      letterSpacing: {
        'arabic': '0.015em',
      },
      // Adding custom font sizes optimized for Arabic
      fontSize: {
        'arabic-sm': ['1rem', '1.5rem'],    // 16px with 24px line height
        'arabic-base': ['1.125rem', '1.75rem'], // 18px with 28px line height
        'arabic-lg': ['1.25rem', '1.875rem'],   // 20px with 30px line height
      },
    },
  },
  plugins: [],
};