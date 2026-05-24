/**
 * 🎨 BRAND — central theme constants.
 *
 * Change ACCENT (and the matching tailwind.config.js color) to rebrand the
 * entire app in one edit. All components import from here instead of
 * hardcoding color strings.
 *
 * Steps to rebrand:
 *   1. Change ACCENT below to your hex color
 *   2. Change the `accent` key in tailwind.config.js to the same hex
 *   3. Optionally change BG for a different dark shade
 */

// ── Primary brand colors (OBSIDIAN GOLD - PREMIUM) ──────────────────────────
export const ACCENT = '#F59E0B'           // Rich Amber/Gold
export const ACCENT_LIGHT = '#FBBF24'     // Gold highlight
export const ACCENT_DARK = '#B45309'      
export const BG = '#050505'               // Pure obsidian black

// Derived from ACCENT — adjust opacity for glassmorphism
export const ACCENT_DIM = 'rgba(245,158,11,0.08)'
export const ACCENT_BORDER = 'rgba(245,158,11,0.20)'
export const ACCENT_GLOW = 'rgba(245,158,11,0.15)'

// ── Backgrounds & Surfaces ────────────────────────────────────────────────────
export const SURFACE = '#0A0A0A'          // Main cards
export const SURFACE2 = '#111111'         // Elevated panels
export const SURFACE3 = '#171717'         // Tooltips/popups
export const GLASS_SURFACE = 'rgba(255,255,255,0.03)'

// ── Text ──────────────────────────────────────────────────────────────────────
export const TEXT_PRIMARY = '#F9FAFB'    // Near white
export const TEXT_SECONDARY = '#9CA3AF'  // Muted gray
export const TEXT_TERTIARY = '#6B7280'   // Dim gray
export const TEXT_DISABLED = '#374151'

// ── Borders ───────────────────────────────────────────────────────────────────
export const BORDER = 'rgba(255,255,255,0.06)'
export const BORDER_ACTIVE = ACCENT

// ── Semantic ──────────────────────────────────────────────────────────────────
export const ERROR = '#f87171'
export const ERROR_DIM = 'rgba(248,113,113,0.10)'
export const WARNING = '#fbbf24'
export const SUCCESS = '#4ade80'

// ── Tab bar ───────────────────────────────────────────────────────────────────
export const TAB_ACTIVE = ACCENT
export const TAB_INACTIVE = 'rgba(255,255,255,0.40)'
export const TAB_HEIGHT = 68

// ── Additional Tokens (Depth & Geometry) ───────────────────────────────────────
export const RADIUS_SM = 8
export const RADIUS_MD = 12
export const RADIUS_LG = 16
export const RADIUS_XL = 24
export const RADIUS_XXL = 32

export const SHADOW_SM = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }
export const SHADOW_MD = { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }
export const SHADOW_LG = { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 }

export const OPACITY_SURFACE = 0.6
export const OPACITY_DISABLED = 0.4
export const OPACITY_HINT = 0.2

export const SPACING_XS = 4
export const SPACING_SM = 8
export const SPACING_MD = 16
export const SPACING_LG = 24
export const SPACING_XL = 32
export const SPACING_XXL = 48

export const WEIGHT_REGULAR = 'Inter_400Regular'
export const WEIGHT_MEDIUM = 'Inter_500Medium'
export const WEIGHT_SBOLD = 'Inter_600SemiBold'
export const WEIGHT_BOLD = 'Inter_700Bold'
export const WEIGHT_EBOLD = 'Inter_800ExtraBold'

