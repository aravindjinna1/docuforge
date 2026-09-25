import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base:   '#0D0F1A',
          card:   '#131520',
          raised: '#181A28',
          hover:  '#1C1E30',
        },
        accent: {
          DEFAULT: '#7C6FFF',
          hover:   '#8F84FF',
        },
        border: {
          subtle:   '#1E2235',
          default:  '#252840',
          emphasis: '#323660',
        },
        ink: {
          primary:   '#E8EAF6',
          secondary: '#8B90B8',
          muted:     '#4B5080',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease forwards',
        'spin-fast': 'spin 0.6s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
