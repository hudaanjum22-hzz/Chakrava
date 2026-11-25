// ============================================================
// Chakrava — Brand Colors & Design Tokens
// ============================================================

export const Colors = {
  // ── Primary palette ──────────────────────────────────────
  primary:        '#1A7F4B',   // Forest green
  primaryLight:   '#D1FAE5',   // Tint for backgrounds
  primaryDark:    '#145F38',   // Pressed / darker shade
  accent:         '#2ECC71',   // Bright accent green

  // ── Status colors ─────────────────────────────────────────
  danger:         '#E74C3C',   // Critical / overflow
  dangerLight:    '#FDECEA',
  warning:        '#F39C12',   // Needs attention
  warningLight:   '#FEF3CD',
  success:        '#27AE60',   // Collected / OK
  successLight:   '#D5F5E3',
  info:           '#2980B9',
  infoLight:      '#D6EAF8',

  // ── Neutrals ──────────────────────────────────────────────
  background:     '#F4F7F5',   // Screen background
  surface:        '#FFFFFF',   // Card / panel
  surfaceAlt:     '#F0F5F2',   // Subtle alternate surface
  border:         '#E2E8E4',   // Dividers

  // ── Text ──────────────────────────────────────────────────
  text:           '#1A2E22',   // Primary text (dark green-black)
  textSecondary:  '#52706A',   // Secondary / muted text
  textInverse:    '#FFFFFF',   // Text on dark surfaces
  muted:          '#94A3B8',   // Placeholder / disabled

  // ── Dark surface (header, login) ──────────────────────────
  dark:           '#0F2318',
  darkSurface:    '#1A3A2A',

  // ── Tab bar ───────────────────────────────────────────────
  tabActive:      '#1A7F4B',
  tabInactive:    '#94A3B8',
  tabBar:         '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
