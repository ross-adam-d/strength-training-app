/**
 * PBeX brand mark — three circular arrow segments in a clockwise cycle.
 *
 * Each segment is a curved arrow with:
 *   - Blunt arrowhead at the front (tip at mid-radius, 10° past outer arc end)
 *   - Concave V-notch at the back (notch point at small radius toward centre)
 *
 * Path per segment:
 *   M outer-start (OS)
 *   A R R 0 0 1 outer-end (OE)     ← outer arc clockwise
 *   L tip (TIP)                    ← blunt arrowhead tip (mid-radius, +10° past OE)
 *   L inner-end (IE)               ← inner edge of arrowhead
 *   A r r 0 0 0 inner-start (IS)  ← inner arc counter-clockwise
 *   L back-notch (BN)              ← concave V-notch (deep toward centre)
 *   Z                              ← closes to OS
 *
 * TIP and BN are at the same angle as the adjacent segment's BN and TIP
 * respectively — creating the interlocking "flowing arrows" appearance.
 *
 * 48×48 mark  — centre (24,24), R=21, r=9, r_tip=15, r_notch=12
 * Stacked mark — centre (60,40), R=26, r=11, r_tip=18, r_notch=15
 *
 * Outer arcs: 100° each (10→110, 130→230, 250→350). Gaps: 20°.
 * TIP angles: 120°, 240°, 0°. BN angles: 0°, 120°, 240°.
 */

interface LogoProps {
  className?: string
  color?: string
}

/**
 * Shared arrow segments for the 48×48 mark.
 * Centre (24,24), R=21, r=9, r_tip=15, r_notch=5.
 *
 * Trig used:
 *   0°:   cos=1.0000  sin=0.0000
 *   10°:  cos=0.9848  sin=0.1736
 *   110°: cos=-0.3420 sin=0.9397
 *   120°: cos=-0.5000 sin=0.8660
 *   130°: cos=-0.6428 sin=0.7660
 *   230°: cos=-0.6428 sin=-0.7660
 *   240°: cos=-0.5000 sin=-0.8660
 *   250°: cos=-0.3420 sin=-0.9397
 *   350°: cos=0.9848  sin=-0.1736
 *
 * Seg 1: OS(44.68,27.64) OE(16.82,43.73) TIP(16.50,36.99) IE(20.92,32.46) IS(32.86,25.56) BN(29.00,24.00)
 * Seg 2: OS(10.50,40.09) OE(10.50, 7.91) TIP(16.50,11.01) IE(18.21,17.11) IS(18.21,30.89) BN(21.50,28.33)
 * Seg 3: OS(16.82, 4.27) OE(44.68,20.36) TIP(39.00,24.00) IE(32.86,22.44) IS(20.92,15.54) BN(21.50,19.67)
 */
function Mark48({ color }: { color: string }) {
  return (
    <>
      {/* Seg 1 — Plan: outer 10°→110°, tip 120°, notch 0° */}
      <path
        d="M 44.68 27.64 A 21 21 0 0 1 16.82 43.73 L 16.50 36.99 L 20.92 32.46 A 9 9 0 0 0 32.86 25.56 L 36.00 24.00 Z"
        fill={color}
      />
      {/* Seg 2 — Build: outer 130°→230°, tip 240°, notch 120° */}
      <path
        d="M 10.50 40.09 A 21 21 0 0 1 10.50 7.91 L 16.50 11.01 L 18.21 17.11 A 9 9 0 0 0 18.21 30.89 L 18.00 34.39 Z"
        fill={color}
      />
      {/* Seg 3 — Execute: outer 250°→350°, tip 0°, notch 240° */}
      <path
        d="M 16.82 4.27 A 21 21 0 0 1 44.68 20.36 L 39.00 24.00 L 32.86 22.44 A 9 9 0 0 0 20.92 15.54 L 18.00 13.61 Z"
        fill={color}
      />
    </>
  )
}

/** Standalone cycle mark — 48×48 viewBox. */
export function PBeXMark({ className, color = '#FF8000' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PBeX"
      role="img"
    >
      <Mark48 color={color} />
    </svg>
  )
}

/** Horizontal logo — mark + wordmark. Use in nav bar. */
export function PBeXLogo({ className, color = '#FF8000' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 210 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PBeX"
      role="img"
    >
      <Mark48 color={color} />
      <text
        x="58"
        y="25"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="30"
        fontWeight="900"
        fill={color}
        letterSpacing="-0.5"
      >
        PBeX
      </text>
    </svg>
  )
}

/**
 * Stacked logo — larger mark above wordmark + tagline.
 * Centre (60,40), R=26, r=11, r_tip=18, r_notch=6. ViewBox 0 0 120 120.
 *
 * Seg 1: OS(85.60,44.51) OE(51.11,64.43) TIP(51.00,55.59) IE(56.24,50.34) IS(70.83,41.91) BN(66.00,40.00)
 * Seg 2: OS(43.29,59.92) OE(43.29,20.08) TIP(51.00,24.41) IE(52.93,31.57) IS(52.93,48.43) BN(57.00,45.20)
 * Seg 3: OS(51.11,15.57) OE(85.60,35.49) TIP(78.00,40.00) IE(70.83,38.09) IS(56.24,29.66) BN(57.00,34.80)
 */
export function PBeXLogoStacked({ className, color = '#FF8000' }: LogoProps) {
  const tagColor = color === '#ffffff' || color === 'white'
    ? 'rgba(255,255,255,0.55)'
    : 'rgba(15,23,42,0.40)'

  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PBeX — Plan, Build, Execute"
      role="img"
    >
      {/* Seg 1 — Plan: outer 10°→110°, tip 120°, notch 0° */}
      <path
        d="M 85.60 44.51 A 26 26 0 0 1 51.11 64.43 L 51.00 55.59 L 56.24 50.34 A 11 11 0 0 0 70.83 41.91 L 75.00 40.00 Z"
        fill={color}
      />
      {/* Seg 2 — Build: outer 130°→230°, tip 240°, notch 120° */}
      <path
        d="M 43.29 59.92 A 26 26 0 0 1 43.29 20.08 L 51.00 24.41 L 52.93 31.57 A 11 11 0 0 0 52.93 48.43 L 52.50 52.99 Z"
        fill={color}
      />
      {/* Seg 3 — Execute: outer 250°→350°, tip 0°, notch 240° */}
      <path
        d="M 51.11 15.57 A 26 26 0 0 1 85.60 35.49 L 78.00 40.00 L 70.83 38.09 A 11 11 0 0 0 56.24 29.66 L 52.50 27.01 Z"
        fill={color}
      />

      {/* Wordmark */}
      <text
        x="60"
        y="88"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="28"
        fontWeight="900"
        fill={color}
        letterSpacing="-0.5"
      >
        PBeX
      </text>

      {/* Tagline */}
      <text
        x="60"
        y="108"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="7"
        fontWeight="500"
        fill={tagColor}
        letterSpacing="2.5"
      >
        PLAN · BUILD · EXECUTE
      </text>
    </svg>
  )
}
