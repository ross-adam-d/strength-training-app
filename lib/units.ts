export type UnitPreference = 'metric' | 'imperial'

export function kgToLbs(kg: number): number {
  return kg * 2.20462
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462
}

export function weightUnit(unitPref: UnitPreference | string): string {
  return unitPref === 'imperial' ? 'lbs' : 'kg'
}

// Convert a kg value to display value in the user's unit
export function kgToDisplay(kg: number, unitPref: UnitPreference | string): number {
  if (unitPref === 'imperial') {
    // Round to nearest 0.5 lbs
    const lbs = kgToLbs(kg)
    return Math.round(lbs * 2) / 2
  }
  return kg
}

// Format a weight stored in kg for display (returns a string like "100" or "220.5")
export function formatWeight(kg: number, unitPref: UnitPreference | string): string {
  const val = kgToDisplay(kg, unitPref)
  return val % 1 === 0 ? String(val) : val.toFixed(1)
}

// Convert a display value back to kg for storage
export function displayToKg(value: number, unitPref: UnitPreference | string): number {
  return unitPref === 'imperial' ? lbsToKg(value) : value
}

// Weight increment for progressive overload (in display units)
export function getDisplayIncrement(
  equipment: string[],
  isBodyweight: boolean,
  unitPref: UnitPreference | string,
): number {
  if (isBodyweight) return 0
  if (unitPref === 'imperial') {
    if (equipment.includes('barbell')) return 5
    if (equipment.includes('dumbbell')) return 2.5
    return 5
  }
  if (equipment.includes('barbell')) return 2.5
  if (equipment.includes('dumbbell')) return 1
  return 2.5
}
