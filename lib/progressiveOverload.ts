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
  refWeight: number,
  refReps: number,
  newWeight: number,
  repRange: { min: number; max: number }
): number {
  if (newWeight <= 0 || refWeight <= 0 || refReps <= 0) return repRange.min
  const e1RM = estimate1RM(refWeight, refReps)
  if (e1RM <= 0 || e1RM <= newWeight) return repRange.min
  const reps = Math.round(30 * (e1RM / newWeight - 1))
  return Math.max(repRange.min, Math.min(repRange.max, reps))
}

export function getSuggestion(
  lastSets: Array<{ setNumber: number; weight: number; reps: number; repsLeft?: number | null; repsRight?: number | null; rir?: number | null }>,
  targetReps: string | null | undefined,
  equipment: string[],
  isBodyweight: boolean,
  options?: {
    overloadTrigger?: 'topOfRange' | 'allSetsTop' | 'combo';
    rpeAutoDeload?: boolean;
    lastExerciseRpe?: number;
  }
): { weight: string; reps: string; progressionType: 'none' | 'rep' | 'weight' | 'deload' } {
  const repRange = parseRepRange(targetReps)
  const trigger = options?.overloadTrigger ?? 'topOfRange'

  // No history: show plan's target reps only, no weight
  if (!lastSets || lastSets.length === 0) {
    return { weight: '', reps: String(repRange.min), progressionType: 'none' }
  }

  const set1 = lastSets.find((s) => s.setNumber === 1) ?? lastSets[0]
  // For unilateral exercises reps is stored as 0; use repsLeft (per-side count) instead
  const effectiveRepsForSet = (s: typeof set1) => s.reps > 0 ? s.reps : (s.repsLeft || s.repsRight || 0)

  // Trigger check and eligibility use Set 1 (user's prescribed first set)
  const lastWeight = set1.weight
  const lastReps = effectiveRepsForSet(set1)
  const rir = set1.rir

  // RM calculation uses best-performing set (highest estimated 1RM across all sets)
  const bestSet = lastSets.reduce((best, s) => {
    const e = estimate1RM(s.weight, effectiveRepsForSet(s))
    return e > estimate1RM(best.weight, effectiveRepsForSet(best)) ? s : best
  }, lastSets[0])
  const refWeight = bestSet.weight
  const refReps = effectiveRepsForSet(bestSet)

  // If the last session was logged with no meaningful data (weight=0 AND reps=0 for all sets),
  // treat it as no history so PO shows plan target reps rather than 0/0.
  // This handles the case where a workout was opened but values were never entered.
  const sessionHasData = lastSets.some(
    (s) => (s.weight ?? 0) > 0 || (s.reps ?? 0) > 0 || (s.repsLeft ?? 0) > 0 || (s.repsRight ?? 0) > 0
  )
  if (!sessionHasData) {
    return { weight: '', reps: String(repRange.min), progressionType: 'none' }
  }

  // RPE auto-deload: if last session rated 5/5 (Too Much), reduce weight
  if (options?.rpeAutoDeload && options?.lastExerciseRpe === 5) {
    const increment = getWeightIncrement(equipment, isBodyweight)
    if (increment > 0) {
      const deloadWeight = Math.max(0, lastWeight - increment)
      return { weight: String(deloadWeight), reps: String(lastReps), progressionType: 'deload' }
    }
  }

  // Determine eligibility for progression
  // RIR 0 (failure) normally blocks progression, but if reps are at/above the top of the
  // range the user is clearly strong enough to increase weight regardless.
  let eligible: boolean
  if (rir !== null && rir !== undefined) {
    eligible = rir >= 1 || lastReps >= repRange.max
  } else {
    eligible = lastReps >= repRange.min
  }

  if (!eligible) {
    return { weight: String(lastWeight), reps: String(lastReps), progressionType: 'none' }
  }

  // Determine if weight progression trigger is met
  let triggerMet = false
  if (trigger === 'topOfRange') {
    triggerMet = lastReps >= repRange.max
  } else if (trigger === 'allSetsTop') {
    triggerMet = lastSets.every((s) => effectiveRepsForSet(s) >= repRange.max)
  } else if (trigger === 'combo') {
    const anyAtTop = lastSets.some((s) => effectiveRepsForSet(s) >= repRange.max)
    const allAboveMin = lastSets.every((s) => effectiveRepsForSet(s) >= repRange.min)
    triggerMet = anyAtTop && allAboveMin
  }

  if (!triggerMet) {
    // Rep progression: haven't met trigger yet
    if (lastReps < repRange.max) {
      return { weight: String(lastWeight), reps: String(lastReps + 1), progressionType: 'rep' }
    }
    // At top but trigger not met (e.g. allSetsTop and other sets aren't there) — keep same
    return { weight: String(lastWeight), reps: String(lastReps), progressionType: 'none' }
  }

  // Weight progression: trigger met
  const increment = getWeightIncrement(equipment, isBodyweight)
  if (increment === 0) {
    return { weight: String(lastWeight), reps: String(lastReps + 1), progressionType: 'rep' }
  }

  const newWeight = lastWeight + increment
  const suggestedReps = calculateSuggestedReps(refWeight, refReps, newWeight, repRange)

  return { weight: String(newWeight), reps: String(suggestedReps), progressionType: 'weight' }
}
