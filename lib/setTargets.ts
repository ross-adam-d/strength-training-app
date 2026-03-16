export interface SetTarget {
  sets: number      // count of identical sets in this group (e.g. 2)
  reps: string      // "1", "3", "8-12"
  weight?: number   // kg; omit = progressive overload still applies for weight
}

/** Expand grouped SetTargets into one entry per individual set, with pre-filled reps/weight. */
export function expandSetTargets(targets: SetTarget[]): { setNumber: number; reps: string; weight?: number }[] {
  const result: { setNumber: number; reps: string; weight?: number }[] = []
  let setNum = 1
  for (const group of targets) {
    for (let i = 0; i < group.sets; i++) {
      result.push({ setNumber: setNum++, reps: group.reps, weight: group.weight })
    }
  }
  return result
}

/** Format SetTargets as a compact human-readable string, e.g. "1×1 @ 200kg · 2×3 @ 175kg" */
export function formatSetTargets(targets: SetTarget[], unit: 'kg' | 'lbs'): string {
  return targets.map((g) => {
    const w = g.weight != null
      ? ` @ ${unit === 'lbs' ? Math.round(g.weight * 2.2046) : g.weight}${unit}`
      : ''
    return `${g.sets}×${g.reps}${w}`
  }).join(' · ')
}

/** Returns true if all set groups have a weight prescribed (PO should be bypassed). */
export function allWeightsPrescribed(targets: SetTarget[]): boolean {
  return targets.length > 0 && targets.every((g) => g.weight != null)
}
