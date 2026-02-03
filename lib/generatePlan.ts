import { addWeeks, format } from 'date-fns'
import { getWorkoutType, getDaysOfWeek, SPLIT_CONFIGS } from './splitTemplates'

export interface WizardInputs {
  totalWeeks: number
  buildWeeks: number
  recoveryWeeks: number
  trainingDays: number
  splitKey: string
  startDate: Date
}

interface ExerciseSlotPayload {
  exerciseName: string
  orderIndex: number
  targetSets: number
  targetReps: string
  notes: string
  restPeriod: number
}

interface WorkoutPayload {
  name: string
  dayOfWeek: number
  exercises: ExerciseSlotPayload[]
}

interface MicrocyclePayload {
  name: string
  weekNumber: number
  startDate: string
  endDate: string
  isRecovery: boolean
  workouts: WorkoutPayload[]
}

interface MesocyclePayload {
  name: string
  focus: string
  startDate: string
  endDate: string
  microcycles: MicrocyclePayload[]
}

export interface SetupPayload {
  name: string
  startDate: string
  endDate: string
  status: 'active'
  mesocycles: MesocyclePayload[]
}

export function generatePlan(inputs: WizardInputs): SetupPayload {
  const { totalWeeks, buildWeeks, recoveryWeeks, trainingDays, splitKey, startDate } = inputs

  // Resolve split config
  const splitConfig = SPLIT_CONFIGS.find((s) => s.key === splitKey)
  if (!splitConfig) throw new Error(`Invalid split key: ${splitKey}`)

  // Workout rotation: cycle through workout type names across training days
  const daysOfWeek = getDaysOfWeek(trainingDays)
  const rotation = daysOfWeek.map((_: number, i: number) => splitConfig.workoutTypes[i % splitConfig.workoutTypes.length])

  // Compute phase boundaries
  const cycleLength = buildWeeks + recoveryWeeks
  const fullCycles = Math.floor(totalWeeks / cycleLength)
  const remainder = totalWeeks - fullCycles * cycleLength

  interface PhaseInfo {
    buildWeeks: number
    recoveryWeeks: number
  }

  const phases: PhaseInfo[] = []
  for (let i = 0; i < fullCycles; i++) {
    phases.push({ buildWeeks, recoveryWeeks })
  }
  if (remainder > 0) {
    phases.push({ buildWeeks: remainder, recoveryWeeks: 0 })
  }

  // Walk phases → weeks → days
  let currentDate = startDate
  const mesocycles: MesocyclePayload[] = []

  phases.forEach((phase, phaseIdx) => {
    const totalPhaseWeeks = phase.buildWeeks + phase.recoveryWeeks
    const phaseStartDate = currentDate
    const phaseEndDate = addWeeks(currentDate, totalPhaseWeeks)

    const microcycles: MicrocyclePayload[] = []

    for (let w = 0; w < totalPhaseWeeks; w++) {
      const weekStart = addWeeks(currentDate, w)
      const weekEnd = addWeeks(weekStart, 1)
      const isRecovery = w >= phase.buildWeeks

      const workouts: WorkoutPayload[] = daysOfWeek.map((dow: number, i: number) => {
        const workoutTypeName = rotation[i]
        const workoutType = getWorkoutType(workoutTypeName)

        const exercises: ExerciseSlotPayload[] = workoutType.slots.map((slot, slotIdx) => ({
          exerciseName: slot.exerciseName,
          orderIndex: slotIdx,
          targetSets: isRecovery ? slot.recoverySets : slot.buildSets,
          targetReps: isRecovery ? slot.recoveryReps : slot.buildReps,
          notes: slot.label,
          restPeriod: slot.restPeriod,
        }))

        return { name: workoutTypeName, dayOfWeek: dow, exercises }
      })

      microcycles.push({
        name: `Week ${w + 1}${isRecovery ? ' (Recovery)' : ''}`,
        weekNumber: w + 1,
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
        isRecovery,
        workouts,
      })
    }

    currentDate = phaseEndDate

    mesocycles.push({
      name: `Phase ${phaseIdx + 1}`,
      focus: phase.recoveryWeeks > 0 ? 'Build + Recovery' : 'Build',
      startDate: format(phaseStartDate, 'yyyy-MM-dd'),
      endDate: format(phaseEndDate, 'yyyy-MM-dd'),
      microcycles,
    })
  })

  const blockEndDate = addWeeks(startDate, totalWeeks)

  return {
    name: `Training Block - ${format(startDate, 'MMM yyyy')}`,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(blockEndDate, 'yyyy-MM-dd'),
    status: 'active',
    mesocycles,
  }
}
