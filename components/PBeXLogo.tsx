/**
 * PBeX brand mark — three chevron/arrowhead segments in a clockwise cycle.
 *
 * Each segment is an annular chevron:
 *   - Outer arc: 108° (6→114, 126→234, 246→354)
 *   - Inner arc:  84° (18→102, 138→222, 258→342) — 12° taper each side
 *
 * Path per segment:
 *   M outer-start
 *   A R R 0 0 1 outer-end      ← outer arc clockwise
 *   L inner-end                ← diagonal to inner (creates pointed tip)
 *   A r r 0 0 0 inner-start   ← inner arc counter-clockwise
 *   Z                          ← diagonal back (creates angled back)
 *
 * The 12° gaps at the outer rim sit between each outer-end (point) and the
 * next outer-start — "small gap between the point of one arrow and the start
 * of the next arc."
 *
 * 48×48 mark  — centre (24,24), R=21, r=12
 * Stacked mark — centre (60,40), R=26, r=15  (same shape, scaled)
 */

interface LogoProps {
  className?: string
  color?: string
}

/**
 * Shared chevron segments for the 48×48 mark.
 * Centre (24,24), outer R=21, inner r=12.
 *
 * Precomputed coordinates (all values rounded to 2 dp):
 *
 * Trig values used:
 *   6°:  cos=0.9945 sin=0.1045   18°: cos=0.9511 sin=0.3090
 *   102°: cos=-0.2079 sin=0.9781  114°: cos=-0.4067 sin=0.9135
 *   126°: cos=-0.5878 sin=0.8090  138°: cos=-0.7431 sin=0.6691
 *   222°: cos=-0.7431 sin=-0.6691 234°: cos=-0.5878 sin=-0.8090
 *   246°: cos=-0.4067 sin=-0.9135 258°: cos=-0.2079 sin=-0.9781
 *   342°: cos=0.9511 sin=-0.3090  354°: cos=0.9945 sin=-0.1045
 *
 * Seg 1 (Plan):    OS(44.88,26.19) OE(15.46,43.18) IE(21.51,35.74) IS(35.41,27.71)
 * Seg 2 (Build):   OS(11.66,40.99) OE(11.66, 7.01) IE(15.08,15.97) IS(15.08,32.03)
 * Seg 3 (Execute): OS(15.46, 4.82) OE(44.88,21.81) IE(35.41,20.29) IS(21.51,12.26)
 */
function Mark48({ color }: { color: string }) {
  return (
    <>
      {/* Seg 1 — Plan: outer 6°→114°, inner 18°→102° */}
      <path
        d="M 44.88 26.19 A 21 21 0 0 1 15.46 43.18 L 21.51 35.74 A 12 12 0 0 0 35.41 27.71 Z"
        fill={color}
      />
      {/* Seg 2 — Build: outer 126°→234°, inner 138°→222° */}
      <path
        d="M 11.66 40.99 A 21 21 0 0 1 11.66 7.01 L 15.08 15.97 A 12 12 0 0 0 15.08 32.03 Z"
        fill={color}
      />
      {/* Seg 3 — Execute: outer 246°→354°, inner 258°→342° */}
      <path
        d="M 15.46 4.82 A 21 21 0 0 1 44.88 21.81 L 35.41 20.29 A 12 12 0 0 0 21.51 12.26 Z"
        fill={color}
      />
      {/* Centre hub */}
      <circle cx="24" cy="24" r="3.5" fill="white" />
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
 * Centre (60,40), R=26, r=15. ViewBox 0 0 120 120.
 *
 * Seg 1 (Plan):    OS(85.86,42.72) OE(49.43,63.75) IE(56.88,54.67) IS(74.27,44.64)
 * Seg 2 (Build):   OS(44.72,61.03) OE(44.72,18.97) IE(48.85,29.96) IS(48.85,50.04)
 * Seg 3 (Execute): OS(49.43,16.25) OE(85.86,37.28) IE(74.27,35.36) IS(56.88,25.33)
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
      {/* Seg 1 — Plan */}
      <path
        d="M 85.86 42.72 A 26 26 0 0 1 49.43 63.75 L 56.88 54.67 A 15 15 0 0 0 74.27 44.64 Z"
        fill={color}
      />
      {/* Seg 2 — Build */}
      <path
        d="M 44.72 61.03 A 26 26 0 0 1 44.72 18.97 L 48.85 29.96 A 15 15 0 0 0 48.85 50.04 Z"
        fill={color}
      />
      {/* Seg 3 — Execute */}
      <path
        d="M 49.43 16.25 A 26 26 0 0 1 85.86 37.28 L 74.27 35.36 A 15 15 0 0 0 56.88 25.33 Z"
        fill={color}
      />
      {/* Centre hub */}
      <circle cx="60" cy="40" r="4.5" fill="white" />

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
