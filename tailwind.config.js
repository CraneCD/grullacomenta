/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Grulla Comenta · traditional Japanese pigment palette ──────────
        // Washi paper — warm cream neutrals (backgrounds & surfaces)
        paper: {
          50: '#FFFDF8',
          100: '#FBF5EB',
          200: '#F4EAD8',
          300: '#EADCC2',
          400: '#DCC9A8',
        },
        // Sumi ink — warm browny near-blacks (text & strong surfaces)
        ink: {
          300: '#C7BAA8',
          400: '#A99C8B',
          500: '#8B7F70',
          600: '#6B6053',
          700: '#4F463C',
          800: '#3B342D',
          900: '#2A2521',
        },
        // Kaki / persimmon — the primary warm accent (柿)
        persimmon: {
          200: '#F7CBA8',
          300: '#F0A878',
          400: '#E5814A',
          500: '#D9602E',
          600: '#BC4A20',
          700: '#983819',
        },
        // Ai / indigo — the cool counterweight (藍)
        indigo: {
          300: '#8395AB',
          400: '#566982',
          500: '#3D5169',
          600: '#2E3E52',
          700: '#22303F',
        },
        // Matcha — moss green (抹茶)
        matcha: {
          300: '#B6C089',
          400: '#9BAA66',
          500: '#7E8E4C',
          600: '#63713A',
        },
        // Kin / gold — kintsugi amber (金)
        gold: {
          300: '#EBCB82',
          400: '#DDB257',
          500: '#C5953A',
          600: '#A2772B',
        },
        // Azuki — deep red bean (小豆), for danger
        azuki: {
          400: '#C56657',
          500: '#B14B3E',
          600: '#8F3A30',
        },
        // Sakura — soft rose, decorative tertiary (桜)
        sakura: {
          300: '#F2C7CC',
          400: '#E79CA6',
        },
        // Semantic helpers
        border: '#E7D9C2',
        'border-strong': '#D8C4A4',
        divider: '#EFE4D2',
        // Keep legacy admin (dark) palette working
        dark: {
          DEFAULT: '#121212',
          100: '#1a1a1a',
          200: '#2d2d2d',
          300: '#404040',
          400: '#525252',
          500: '#737373',
          600: '#999999',
          700: '#a3a3a3',
          800: '#d4d4d4',
          900: '#ffffff',
        },
        accent: {
          DEFAULT: '#3D5169',
          hover: '#2E3E52',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
        ui: ['var(--font-ui)', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['var(--font-ui)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
        pill: '999px',
      },
      boxShadow: {
        // Warm, low, diffuse — sunlight through shoji paper
        xs: '0 1px 2px rgba(74, 48, 24, 0.06)',
        sm: '0 2px 6px -1px rgba(74, 48, 24, 0.09)',
        md: '0 6px 18px -6px rgba(74, 48, 24, 0.16)',
        lg: '0 16px 40px -12px rgba(74, 48, 24, 0.22)',
        xl: '0 28px 64px -16px rgba(58, 38, 18, 0.26)',
      },
      letterSpacing: {
        label: '0.12em',
      },
      maxWidth: {
        prose: '720px',
      },
      spacing: {
        18: '4.5rem',
        112: '28rem',
        128: '32rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
