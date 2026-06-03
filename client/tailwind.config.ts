import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366F1', hover: '#4F46E5', foreground: '#ffffff' },
        background: { DEFAULT: '#0F172A', light: '#F8FAFC' },
        surface: { DEFAULT: '#1E293B', light: '#FFFFFF' },
        border: { DEFAULT: '#334155', light: '#E2E8F0' },
        'text-primary': { DEFAULT: '#F8FAFC', light: '#0F172A' },
        'text-secondary': { DEFAULT: '#94A3B8', light: '#64748B' },
        success: { DEFAULT: '#22C55E', light: '#16A34A' },
        error: { DEFAULT: '#EF4444', light: '#DC2626' },
        warning: { DEFAULT: '#F59E0B', light: '#D97706' },
      },
      borderRadius: { lg: '0.5rem', md: '0.375rem', sm: '0.25rem' },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [animate],
};
export default config;
