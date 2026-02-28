/**
 * pbX brand mark — three circular arrow segments in a clockwise cycle.
 *
 * Each segment is a curved arrow with:
 *   - Blunt arrowhead at the front (tip at mid-radius, 10° past outer arc end)
 *   - Flat tail at the back (straight radial cut — Z closes IS→OS)
 *
 * Path per segment:
 *   M outer-start (OS)
 *   A R R 0 0 1 outer-end (OE)     ← outer arc clockwise
 *   L tip (TIP)                    ← blunt arrowhead tip (mid-radius, +10° past OE)
 *   L inner-end (IE)               ← inner edge of arrowhead
 *   A r r 0 0 0 inner-start (IS)  ← inner arc counter-clockwise
 *   Z                              ← flat radial tail (IS straight back to OS)
 *
 * 48×48 mark  — centre (24,24), R=21, r=7, r_tip=15
 * Stacked mark — centre (60,40), R=26, r=8, r_tip=18
 *
 * Outer arcs: 100° each (10→110, 130→230, 250→350). Gaps: 20°.
 * TIP angles: 120°, 240°, 0°. Tail cut angles: 10°, 130°, 250°.
 */

interface LogoProps {
  className?: string
  color?: string
}

/**
 * Shared arrow segments for the 48×48 mark.
 * Centre (24,24), R=21, r=7, r_tip=15.
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
 * Seg 1: OS(44.68,27.65) OE(16.82,43.73) TIP(16.50,37.00) IE(20.50,30.06) IS(30.89,25.22)
 * Seg 2: OS(10.50,40.09) OE(10.50, 7.91) TIP(16.50,11.01) IE(20.50,17.94) IS(19.50,29.36)
 * Seg 3: OS(16.82, 4.27) OE(44.68,20.36) TIP(39.00,24.00) IE(31.00,24.00) IS(21.61,17.42)
 */
function Mark48({ color }: { color: string }) {
  return (
    <>
      {/* Seg 1 — Plan: outer 10°→110°, tip 120°, tail 10° */}
      <path
        d="M 44.68 27.65 A 21 21 0 0 1 16.82 43.73 L 16.50 37.00 L 20.50 30.06 A 7 7 0 0 0 30.89 25.22 Z"
        fill={color}
      />
      {/* Seg 2 — Build: outer 130°→230°, tip 240°, tail 130° */}
      <path
        d="M 10.50 40.09 A 21 21 0 0 1 10.50 7.91 L 16.50 11.01 L 20.50 17.94 A 7 7 0 0 0 19.50 29.36 Z"
        fill={color}
      />
      {/* Seg 3 — Execute: outer 250°→350°, tip 0°, tail 250° */}
      <path
        d="M 16.82 4.27 A 21 21 0 0 1 44.68 20.36 L 39.00 24.00 L 31.00 24.00 A 7 7 0 0 0 21.61 17.42 Z"
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
      aria-label="pbX"
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
      aria-label="pbX"
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
        pbX
      </text>
    </svg>
  )
}

/**
 * Stacked logo — larger mark above wordmark + tagline.
 * Centre (60,40), R=26, r=8, r_tip=18. ViewBox 0 0 120 120.
 *
 * Seg 1: OS(85.60,44.51) OE(51.11,64.43) TIP(51.00,55.59) IE(56.00,46.93) IS(67.88,41.39)
 * Seg 2: OS(43.29,59.92) OE(43.29,20.08) TIP(51.00,24.41) IE(56.00,33.07) IS(54.86,46.13)
 * Seg 3: OS(51.11,15.57) OE(85.60,35.49) TIP(78.00,40.00) IE(68.00,40.00) IS(57.26,32.48)
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
      aria-label="pbX — Plan, Build, Execute"
      role="img"
    >
      {/* Seg 1 — Plan: outer 10°→110°, tip 120°, tail 10° */}
      <path
        d="M 85.60 44.51 A 26 26 0 0 1 51.11 64.43 L 51.00 55.59 L 56.00 46.93 A 8 8 0 0 0 67.88 41.39 Z"
        fill={color}
      />
      {/* Seg 2 — Build: outer 130°→230°, tip 240°, tail 130° */}
      <path
        d="M 43.29 59.92 A 26 26 0 0 1 43.29 20.08 L 51.00 24.41 L 56.00 33.07 A 8 8 0 0 0 54.86 46.13 Z"
        fill={color}
      />
      {/* Seg 3 — Execute: outer 250°→350°, tip 0°, tail 250° */}
      <path
        d="M 51.11 15.57 A 26 26 0 0 1 85.60 35.49 L 78.00 40.00 L 68.00 40.00 A 8 8 0 0 0 57.26 32.48 Z"
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
        pbX
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
