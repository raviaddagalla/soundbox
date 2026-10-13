/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Design Tokens
        'surface-background': '#F8FAFC',
        'surface-container': '#ECEEF0',
        'surface-container-low': '#F2F4F6',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-high': '#E6E8EA',
        'surface-border': '#E2E8F0',
        'surface-border-strong': '#CBD5E1',

        // Deep Navy Terminal Hero
        'navy-dark': '#0A0F1D',
        'navy-surface': '#111827',
        'navy-muted': '#1E293B',
        'primary-container': '#131B2E',
        'on-primary-container': '#94A3B8',

        // Emerald / Mint Feedback
        'emerald-primary': '#059669',
        'emerald-accent': '#10B981',
        'secondary': '#006C4A',
        'secondary-fixed': '#85F8C4',
        'secondary-fixed-dim': '#68DBA9',
        'secondary-container': '#D1FAE5',
        'on-secondary': '#FFFFFF',
        'on-secondary-fixed': '#002114',
        'on-secondary-container': '#00714E',

        // Content & Text
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-muted': '#64748B',
        'text-inverse': '#FFFFFF',
        'text-emerald': '#047857',

        // Alerts
        'amber-warning': '#F59E0B',
        'rose-alert': '#EF4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
        'glow-emerald': '0 0 16px 2px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
