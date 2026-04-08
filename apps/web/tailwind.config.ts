import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        panel: 'var(--color-panel)',
        panelStrong: 'var(--color-panel-strong)',
        surfaceElevated: 'var(--color-surface-elevated)',
        rail: 'var(--color-rail)',
        line: 'var(--color-line)',
        lineStrong: 'var(--color-line-strong)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        tertiary: 'var(--color-tertiary)',
        accent: 'var(--color-accent)',
        accentSoft: 'var(--color-accent-soft)',
        action: 'var(--color-action)',
        actionSoft: 'var(--color-action-soft)',
        success: 'var(--color-success)',
        successSoft: 'var(--color-success-soft)',
        warning: 'var(--color-warning)',
        warningSoft: 'var(--color-warning-soft)',
        danger: 'var(--color-danger)',
        dangerSoft: 'var(--color-danger-soft)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        glow: 'var(--shadow-glow)',
        warm: 'var(--shadow-warm)',
      },
      borderRadius: {
        sm2: 'var(--radius-sm)',
        btn: 'var(--radius-btn)',
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        xl2: 'var(--radius-panel)',
        xl3: 'var(--radius-panel)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
      },
      transitionTimingFunction: {
        mqds: 'var(--ease-default)',
      },
    },
  },
  plugins: [],
};

export default config;
