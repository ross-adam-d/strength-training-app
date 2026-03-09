export function parseRepRange(targetReps: string | null | undefined): { min: number; max: number } {
  if (!targetReps) return { min: 1, max: 99 }
  const rangeMatch = targetReps.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) }
  const single = parseInt(targetReps)
  if (!isNaN(single)) return { min: single, max: single }
  return { min: 1, max: 99 }
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  return weight * (1 + reps / 30)
}

export function getWeightIncrement(equipment: string[], isBodyweight: boolean): number {
  if (isBodyweight) return 0
  if (equipment.includes('barbell')) return 2.5
  if (equipment.includes('dumbbell')) return 1
  return 2.5 // cable, machine, bodyweight-with-load, other
}

export function calculateSuggestedReps(
  oneRM: number,
  newWeight: number,
  repRange: { min: number; max: number }
): number {
  if (newWeight <= 0) return repRange.min
  const reps = Math.floor((oneRM / newWeight - 1) * 30)
  return Math.max(repRange.min, Math.min(repRange.max, reps))
}

export function getSuggestion(
  lastSet: { weight: number; reps: number; repsLeft?: number | null; repsRight?: number | null; rir?: number | null } | undefined,
  targetReps: string | null | undefined,
  equipment: string[],
  isBodyweight: boolean
): { weight: string; reps: string } {
  const repRange = parseRepRange(targetReps)

  // No history: show plan's target reps only, no weight
  if (!lastSet) {
    return { weight: '', reps: String(repRange.min) }
  }

  const { weight: lastWeight, rir } = lastSet
  // For unilateral exercises reps is stored as 0; use repsLeft (per-side count) instead
  const lastReps = lastSet.reps > 0 ? lastSet.reps : (lastSet.repsLeft || lastSet.repsRight || 0)

  // Determine eligibility for progression
  let eligible: boolean
  if (rir !== null && rir !== undefined) {
    eligible = rir >= 1
  } else {
    // No RIR recorded: eligible if they hit at least the minimum target reps
    eligible = lastReps >= repRange.min
  }

  if (!eligible) {
    // Not ready to progress — suggest same as last time
    return { weight: String(lastWeight), reps: String(lastReps) }
  }

  // Rep progression: haven't hit the top of the range yet
  if (lastReps < repRange.max) {
    return { weight: String(lastWeight), reps: String(lastReps + 1) }
  }

  // Weight progression: hit the top of the range
  const increment = getWeightIncrement(equipment, isBodyweight)
  if (increment === 0) {
    // Bodyweight: can only add reps
    return { weight: String(lastWeight), reps: String(lastReps + 1) }
  }

  const newWeight = lastWeight + increment
  const oneRM = estimate1RM(lastWeight, lastReps)
  const suggestedReps = calculateSuggestedReps(oneRM, newWeight, repRange)

  return { weight: String(newWeight), reps: String(suggestedReps) }
}
