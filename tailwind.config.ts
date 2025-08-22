import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4F46E5', // indigo-600
          hover: '#4338CA',   // indigo-700
          ring: 'rgba(79,70,229,0.35)',
        }
      },
      borderRadius: {
        lgx: '12px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)'
      },
      screens: { xs: '420px' }
    },
  },
  plugins: [],
}
export default config
