// Shared helpers for non-traditional lifts (bodyweight, weighted-bodyweight, timed).
//
// Storage semantics: ExerciseLog.weight always holds the *added* load.
//   - Pure bodyweight (push-ups)      → weight = 0
//   - Weighted bodyweight (dips + 20) → weight = 20
//   - Standard barbell/machine        → weight = the loaded weight
//
// For reporting, bodyweight exercises derive an *effective load* by adding the
// session bodyweight on top of the added load. Session bodyweight falls back to
// the user's profile weight when a given session didn't record one (backfill).

export type LiftType = 'load' | 'bodyweight' | 'timed'

export function liftType(isBodyweight: boolean, isTimed: boolean): LiftType {
  if (isTimed) return 'timed'
  if (isBodyweight) return 'bodyweight'
  return 'load'
}

/**
 * Effective load (kg) for a single set.
 * For bodyweight exercises this is bodyweight + added load; otherwise just weight.
 * Returns null when a bodyweight exercise has no bodyweight reference available,
 * so callers can omit load/1RM metrics rather than under-report.
 */
export function effectiveLoad(
  weight: number,
  isBodyweight: boolean,
  bodyweight: number | null | undefined
): number | null {
  if (!isBodyweight) return weight
  if (bodyweight == null) return null
  return bodyweight + (weight || 0)
}

/** Resolve the bodyweight reference for a log: session value first, then profile fallback. */
export function resolveBodyweight(
  sessionBodyweight: number | null | undefined,
  profileWeight: number | null | undefined
): number | null {
  return sessionBodyweight ?? profileWeight ?? null
}
