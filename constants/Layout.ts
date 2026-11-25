// ============================================================
// Chakrava — Layout / Spacing Design Tokens
// ============================================================

export const Layout = {
  // ── Spacing ───────────────────────────────────────────────
  spacing: {
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    xxl:  48,
  },

  // ── Border radius ─────────────────────────────────────────
  radius: {
    sm:   8,
    md:   12,
    lg:   16,
    xl:   24,
    full: 999,
  },

  // ── Font sizes ────────────────────────────────────────────
  fontSize: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  26,
    hero: 32,
  },

  // ── Font weights (typed as TextStyle-compatible strings) ──
  fontWeight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '900' as const,
  },

  // ── Shadows (Android elevation + iOS shadow) ──────────────
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 8,
    },
  },
} as const;
