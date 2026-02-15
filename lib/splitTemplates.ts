export interface ExerciseSlot {
  label: string
  exerciseName: string
  buildSets: number
  buildReps: string
  recoverySets: number
  recoveryReps: string
  restPeriod: number
}

export interface WorkoutType {
  name: string
  slots: ExerciseSlot[]
}

export interface SplitConfig {
  key: string
  label: string
  workoutTypes: string[]
  minDays: number
  maxDays?: number
}

const WORKOUT_TYPES: Record<string, WorkoutType> = {
  'Full Body': {
    name: 'Full Body',
    slots: [
      { label: 'Legs (Compound)',  exerciseName: 'Barbell Squat',       buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 180 },
      { label: 'Chest (Compound)', exerciseName: 'Barbell Bench Press', buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Compound)',  exerciseName: 'Barbell Row',         buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Shoulders',        exerciseName: 'Overhead Press',      buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Core',             exerciseName: 'Plank',               buildSets: 3, buildReps: '60s',   recoverySets: 2, recoveryReps: '30s',   restPeriod: 60  },
    ],
  },
  'Upper': {
    name: 'Upper',
    slots: [
      { label: 'Chest (Compound)', exerciseName: 'Barbell Bench Press', buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Compound)',  exerciseName: 'Barbell Row',         buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Shoulders',        exerciseName: 'Overhead Press',      buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Biceps',           exerciseName: 'Dumbbell Curl',       buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Lower': {
    name: 'Lower',
    slots: [
      { label: 'Legs (Compound)',  exerciseName: 'Barbell Squat',       buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 180 },
      { label: 'Posterior Chain',  exerciseName: 'Romanian Deadlift',  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 150 },
      { label: 'Quads',            exerciseName: 'Leg Extension',      buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Hamstrings',       exerciseName: 'Leg Curl',           buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Core',             exerciseName: 'Plank',              buildSets: 3, buildReps: '60s',   recoverySets: 2, recoveryReps: '30s',   restPeriod: 60  },
    ],
  },
  'Push': {
    name: 'Push',
    slots: [
      { label: 'Chest (Compound)',  exerciseName: 'Barbell Bench Press',  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Shoulders',         exerciseName: 'Overhead Press',       buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Chest (Isolation)', exerciseName: 'Chest Fly (Dumbbell)', buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Side Delts',        exerciseName: 'Lateral Raise',        buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',    restPeriod: 60  },
      { label: 'Triceps',           exerciseName: 'Tricep Pushdown',      buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Pull': {
    name: 'Pull',
    slots: [
      { label: 'Back (Vertical)',   exerciseName: 'Pull-ups',       buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Horizontal)', exerciseName: 'Barbell Row',   buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Biceps',            exerciseName: 'Dumbbell Curl', buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
      { label: 'Rear Delts',        exerciseName: 'Face Pulls',    buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',   restPeriod: 60  },
    ],
  },
  'Legs': {
    name: 'Legs',
    slots: [
      { label: 'Legs (Compound)', exerciseName: 'Barbell Squat',      buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 180 },
      { label: 'Posterior Chain', exerciseName: 'Romanian Deadlift', buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 150 },
      { label: 'Quads',           exerciseName: 'Leg Extension',     buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Hamstrings',      exerciseName: 'Leg Curl',          buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Core',            exerciseName: 'Plank',             buildSets: 3, buildReps: '60s',   recoverySets: 2, recoveryReps: '30s',   restPeriod: 60  },
    ],
  },
  'Chest': {
    name: 'Chest',
    slots: [
      { label: 'Chest (Flat)',     exerciseName: 'Barbell Bench Press',  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Chest (Incline)',  exerciseName: 'Incline Dumbbell Press', buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Chest (Isolation)', exerciseName: 'Chest Fly (Dumbbell)', buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Triceps',          exerciseName: 'Tricep Pushdown',     buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Back': {
    name: 'Back',
    slots: [
      { label: 'Back (Vertical)',   exerciseName: 'Pull-ups',       buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Horizontal)', exerciseName: 'Barbell Row',   buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Width)',      exerciseName: 'Lat Pulldown',  buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Biceps',            exerciseName: 'Dumbbell Curl', buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Shoulders': {
    name: 'Shoulders',
    slots: [
      { label: 'Shoulders (Press)',  exerciseName: 'Overhead Press',    buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Side Delts',         exerciseName: 'Lateral Raise',     buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',    restPeriod: 60  },
      { label: 'Rear Delts',         exerciseName: 'Face Pulls',        buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',    restPeriod: 60  },
      { label: 'Traps',              exerciseName: 'Dumbbell Shrugs',   buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
    ],
  },
  'Arms': {
    name: 'Arms',
    slots: [
      { label: 'Biceps (Compound)',  exerciseName: 'Barbell Curl',      buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 90  },
      { label: 'Biceps (Isolation)', exerciseName: 'Dumbbell Curl',     buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
      { label: 'Triceps (Compound)', exerciseName: 'Close Grip Bench',  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 90  },
      { label: 'Triceps (Isolation)', exerciseName: 'Tricep Pushdown',   buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
}

export function getWorkoutType(name: string): WorkoutType {
  return WORKOUT_TYPES[name]
}

export const SPLIT_CONFIGS: SplitConfig[] = [
  { key: 'fullbody',   label: 'Full Body',            workoutTypes: ['Full Body'],                               minDays: 2 },
  { key: 'upperlower', label: 'Upper / Lower',        workoutTypes: ['Upper', 'Lower'],                          minDays: 2 },
  { key: 'pushpull',   label: 'Push / Pull',          workoutTypes: ['Push', 'Pull'],                            minDays: 2 },
  { key: 'ppl',        label: 'Push / Pull / Legs',   workoutTypes: ['Push', 'Pull', 'Legs'],                    minDays: 3 },
  { key: 'ppl_fb',     label: 'PPL + Full Body',      workoutTypes: ['Push', 'Pull', 'Legs', 'Full Body'],       minDays: 4, maxDays: 4 },
  { key: 'ppl_ul',     label: 'PPL + Upper / Lower',  workoutTypes: ['Push', 'Pull', 'Legs', 'Upper', 'Lower'],  minDays: 5 },
]

export function getSplitsForDays(days: number): SplitConfig[] {
  return SPLIT_CONFIGS.filter(
    (s) => days >= s.minDays && (s.maxDays === undefined || days <= s.maxDays)
  )
}

const DAY_MAPPINGS: Record<number, number[]> = {
  2: [1, 4],                   // Mon, Thu
  3: [1, 3, 5],                // Mon, Wed, Fri
  4: [1, 2, 4, 5],             // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5],          // Mon–Fri
  6: [1, 2, 3, 4, 5, 6],       // Mon–Sat
  7: [0, 1, 2, 3, 4, 5, 6],    // Sun–Sat
}

export function getDaysOfWeek(trainingDays: number): number[] {
  return DAY_MAPPINGS[trainingDays] ?? DAY_MAPPINGS[5]
}
