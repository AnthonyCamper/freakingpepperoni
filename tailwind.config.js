/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'error-container': '#ffdad6', 'surface-dim': '#dbdad6', 'outline': '#8e706d',
        'background': '#faf9f5', 'outline-variant': '#e2beba', 'on-secondary-container': '#656464',
        'on-tertiary': '#ffffff', 'surface-container-highest': '#e3e2df', 'tertiary-container': '#904917',
        'surface-bright': '#faf9f5', 'on-primary': '#ffffff', 'surface-variant': '#e3e2df',
        'primary-container': '#b22222', 'tertiary': '#723200', 'surface-container-lowest': '#ffffff',
        'surface-container': '#efeeea', 'on-surface-variant': '#5a403e', 'secondary-fixed': '#e4e2e1',
        'inverse-surface': '#2f312e', 'surface': '#faf9f5', 'secondary-container': '#e4e2e1',
        'on-background': '#1b1c1a', 'on-error': '#ffffff', 'tertiary-fixed': '#ffdbc9',
        'on-primary-fixed': '#410003', 'on-primary-container': '#ffc8c2', 'primary-fixed': '#ffdad6',
        'inverse-primary': '#ffb4ac', 'surface-tint': '#b52424', 'on-surface': '#1b1c1a',
        'on-primary-fixed-variant': '#92030f', 'inverse-on-surface': '#f2f1ed', 'primary-fixed-dim': '#ffb4ac',
        'on-tertiary-fixed-variant': '#753401', 'on-secondary-fixed-variant': '#474747', 'secondary': '#5f5e5e',
        'surface-container-high': '#e9e8e4', 'on-tertiary-fixed': '#321200', 'on-secondary': '#ffffff',
        'on-error-container': '#93000a', 'tertiary-fixed-dim': '#ffb68c', 'on-tertiary-container': '#ffcaad',
        'on-secondary-fixed': '#1b1c1c', 'error': '#ba1a1a', 'secondary-fixed-dim': '#c8c6c6',
        'primary': '#8f000d', 'surface-container-low': '#f4f4f0',
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      spacing: {
        'margin-mobile': '16px', 'unit': '4px', 'stack-md': '16px', 'margin-desktop': '64px',
        'gutter': '24px', 'stack-sm': '8px', 'stack-lg': '32px',
      },
      fontFamily: {
        'display-lg': ['Domine'], 'body-sm': ['Public Sans'], 'label-mono': ['Courier Prime'],
        'body-md': ['Public Sans'], 'body-lg': ['Public Sans'], 'display-lg-mobile': ['Domine'],
        'headline-sm': ['Domine'], 'headline-md': ['Domine'], 'label-caps': ['Courier Prime'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-sm': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-mono': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-md': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-lg': ['20px', { lineHeight: '32px', fontWeight: '400' }],
        'display-lg-mobile': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-sm': ['24px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-md': ['32px', { lineHeight: '36px', fontWeight: '700' }],
        'label-caps': ['14px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
