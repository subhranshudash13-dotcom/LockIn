/** @type {import('tailwindcss').Config} */

// 🎨 BRAND: Change 'accent' to your brand color.
// All NativeWind classes using bg-accent, text-accent, border-accent update automatically.
// Also update Theme.accent in lib/theme.ts to match.

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        accent: '#F59E0B',      // 🎨 BRAND: Obsidian Gold
        surface: '#0A0A0A',
        surface2: '#111111',
        muted: '#9CA3AF',
      },
    },
  },
  plugins: [],
}
