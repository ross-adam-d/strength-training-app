export interface ExerciseSlot {
  label: string
  exerciseName: string
  equipment: string[]
  alternatives: { exerciseName: string; equipment: string[] }[]
  isCompound: boolean
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
  minDays?: number
  maxDays?: number
  allowedDays?: number[]
}

const WORKOUT_TYPES: Record<string, WorkoutType> = {
  'Full Body': {
    name: 'Full Body',
    slots: [
      { label: 'Legs (Compound)',  exerciseName: 'Barbell Squat',       equipment: ['barbell', 'rack'],  alternatives: [{ exerciseName: 'Hack Squat', equipment: ['machine'] }, { exerciseName: 'Leg Press', equipment: ['machine'] }, { exerciseName: 'Bulgarian Split Squat', equipment: ['dumbbell'] }],                                              isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 180 },
      { label: 'Chest (Compound)', exerciseName: 'Barbell Bench Press', equipment: ['barbell', 'bench'], alternatives: [{ exerciseName: 'Machine Chest Press', equipment: ['machine'] }, { exerciseName: 'Dumbbell Bench Press', equipment: ['dumbbell', 'bench'] }, { exerciseName: 'Push-ups', equipment: ['bodyweight'] }],                           isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Compound)',  exerciseName: 'Barbell Row',         equipment: ['barbell'],          alternatives: [{ exerciseName: 'Single-Arm Dumbbell Row', equipment: ['dumbbell'] }, { exerciseName: 'Seated Cable Row', equipment: ['cable'] }, { exerciseName: 'Lat Pulldown', equipment: ['cable'] }],                                      isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Shoulders',        exerciseName: 'Overhead Press',      equipment: ['barbell', 'rack'],  alternatives: [{ exerciseName: 'Arnold Press', equipment: ['dumbbell'] }, { exerciseName: 'Dumbbell Shoulder Press', equipment: ['dumbbell'] }],                                                                                                 isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Core',             exerciseName: 'Plank',               equipment: ['bodyweight'],       alternatives: [{ exerciseName: 'Ab Wheel Rollout', equipment: ['bodyweight'] }, { exerciseName: 'Decline Crunch', equipment: ['bodyweight'] }, { exerciseName: 'Hanging Leg Raise', equipment: ['pull-up-bar'] }],                              isCompound: false, buildSets: 3, buildReps: '60s',   recoverySets: 2, recoveryReps: '30s',   restPeriod: 60  },
    ],
  },
  'Upper': {
    name: 'Upper',
    slots: [
      { label: 'Chest (Compound)', exerciseName: 'Barbell Bench Press', equipment: ['barbell', 'bench'], alternatives: [{ exerciseName: 'Machine Chest Press', equipment: ['machine'] }, { exerciseName: 'Dumbbell Bench Press', equipment: ['dumbbell', 'bench'] }, { exerciseName: 'Push-ups', equipment: ['bodyweight'] }],  isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Compound)',  exerciseName: 'Barbell Row',         equipment: ['barbell'],          alternatives: [{ exerciseName: 'T-Bar Row', equipment: ['barbell'] }, { exerciseName: 'Single-Arm Dumbbell Row', equipment: ['dumbbell'] }, { exerciseName: 'Seated Cable Row', equipment: ['cable'] }],               isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Shoulders',        exerciseName: 'Overhead Press',      equipment: ['barbell', 'rack'],  alternatives: [{ exerciseName: 'Arnold Press', equipment: ['dumbbell'] }, { exerciseName: 'Dumbbell Shoulder Press', equipment: ['dumbbell'] }],                                                                          isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Biceps',           exerciseName: 'Dumbbell Curl',       equipment: ['dumbbell'],         alternatives: [{ exerciseName: 'Cable Curl', equipment: ['cable'] }, { exerciseName: 'Barbell Curl', equipment: ['barbell'] }, { exerciseName: 'Preacher Curl', equipment: ['barbell'] }],                              isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Lower': {
    name: 'Lower',
    slots: [
      { label: 'Legs (Compound)',  exerciseName: 'Barbell Squat',      equipment: ['barbell', 'rack'], alternatives: [{ exerciseName: 'Hack Squat', equipment: ['machine'] }, { exerciseName: 'Bulgarian Split Squat', equipment: ['dumbbell'] }, { exerciseName: 'Leg Press', equipment: ['machine'] }],                                          isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 180 },
      { label: 'Posterior Chain',  exerciseName: 'Romanian Deadlift', equipment: ['barbell'],          alternatives: [{ exerciseName: 'Hip Thrusts', equipment: ['barbell'] }, { exerciseName: 'Cable Pull-Through', equipment: ['cable'] }, { exerciseName: 'Good Mornings', equipment: ['barbell'] }],                                             isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 150 },
      { label: 'Quads',            exerciseName: 'Leg Extension',     equipment: ['machine'],          alternatives: [{ exerciseName: 'Bulgarian Split Squat', equipment: ['dumbbell'] }, { exerciseName: 'Hack Squat', equipment: ['machine'] }, { exerciseName: 'Lunges', equipment: ['dumbbell'] }],                                              isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Hamstrings',       exerciseName: 'Leg Curl',          equipment: ['machine'],          alternatives: [{ exerciseName: 'Seated Leg Curl', equipment: ['machine'] }, { exerciseName: 'Cable Pull-Through', equipment: ['cable'] }, { exerciseName: 'Good Mornings', equipment: ['barbell'] }],                                         isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Core',             exerciseName: 'Plank',             equipment: ['bodyweight'],       alternatives: [{ exerciseName: 'Ab Wheel Rollout', equipment: ['bodyweight'] }, { exerciseName: 'Decline Crunch', equipment: ['bodyweight'] }, { exerciseName: 'Russian Twist', equipment: ['bodyweight'] }],                                  isCompound: false, buildSets: 3, buildReps: '60s',   recoverySets: 2, recoveryReps: '30s',   restPeriod: 60  },
    ],
  },
  'Push': {
    name: 'Push',
    slots: [
      { label: 'Chest (Compound)',  exerciseName: 'Barbell Bench Press',  equipment: ['barbell', 'bench'], alternatives: [{ exerciseName: 'Machine Chest Press', equipment: ['machine'] }, { exerciseName: 'Dumbbell Bench Press', equipment: ['dumbbell', 'bench'] }, { exerciseName: 'Decline Bench Press', equipment: ['barbell', 'bench'] }],        isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Shoulders',         exerciseName: 'Overhead Press',       equipment: ['barbell', 'rack'],  alternatives: [{ exerciseName: 'Arnold Press', equipment: ['dumbbell'] }, { exerciseName: 'Dumbbell Shoulder Press', equipment: ['dumbbell'] }],                                                                                               isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Chest (Isolation)', exerciseName: 'Chest Fly (Dumbbell)', equipment: ['dumbbell'],         alternatives: [{ exerciseName: 'Cable Fly', equipment: ['cable'] }, { exerciseName: 'Push-ups', equipment: ['bodyweight'] }],                                                                                                                 isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Side Delts',        exerciseName: 'Lateral Raise',        equipment: ['dumbbell'],         alternatives: [{ exerciseName: 'Front Raise', equipment: ['dumbbell'] }],                                                                                                                                                                     isCompound: false, buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',    restPeriod: 60  },
      { label: 'Triceps',           exerciseName: 'Tricep Pushdown',      equipment: ['cable'],            alternatives: [{ exerciseName: 'Skull Crushers', equipment: ['barbell'] }, { exerciseName: 'Overhead Tricep Extension', equipment: ['dumbbell'] }, { exerciseName: 'Tricep Dips', equipment: ['bodyweight'] }],                               isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Pull': {
    name: 'Pull',
    slots: [
      { label: 'Back (Vertical)',   exerciseName: 'Pull-ups',       equipment: ['bodyweight'], alternatives: [{ exerciseName: 'Lat Pulldown', equipment: ['cable'] }, { exerciseName: 'Seated Cable Row', equipment: ['cable'] }],                                                                                    isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Horizontal)', exerciseName: 'Barbell Row',    equipment: ['barbell'],    alternatives: [{ exerciseName: 'T-Bar Row', equipment: ['barbell'] }, { exerciseName: 'Single-Arm Dumbbell Row', equipment: ['dumbbell'] }, { exerciseName: 'Seated Cable Row', equipment: ['cable'] }],               isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Biceps',            exerciseName: 'Dumbbell Curl',  equipment: ['dumbbell'],   alternatives: [{ exerciseName: 'Cable Curl', equipment: ['cable'] }, { exerciseName: 'Incline Dumbbell Curl', equipment: ['dumbbell'] }, { exerciseName: 'Barbell Curl', equipment: ['barbell'] }],                    isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
      { label: 'Rear Delts',        exerciseName: 'Face Pulls',     equipment: ['cable'],      alternatives: [{ exerciseName: 'Rear Delt Fly', equipment: ['dumbbell'] }, { exerciseName: 'Lateral Raise', equipment: ['dumbbell'] }],                                                                                 isCompound: false, buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',    restPeriod: 60  },
    ],
  },
  'Legs': {
    name: 'Legs',
    slots: [
      { label: 'Legs (Compound)', exerciseName: 'Barbell Squat',     equipment: ['barbell', 'rack'], alternatives: [{ exerciseName: 'Hack Squat', equipment: ['machine'] }, { exerciseName: 'Bulgarian Split Squat', equipment: ['dumbbell'] }, { exerciseName: 'Leg Press', equipment: ['machine'] }],                             isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 180 },
      { label: 'Posterior Chain', exerciseName: 'Romanian Deadlift', equipment: ['barbell'],         alternatives: [{ exerciseName: 'Hip Thrusts', equipment: ['barbell'] }, { exerciseName: 'Cable Pull-Through', equipment: ['cable'] }, { exerciseName: 'Good Mornings', equipment: ['barbell'] }],                                isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 150 },
      { label: 'Quads',           exerciseName: 'Leg Extension',     equipment: ['machine'],         alternatives: [{ exerciseName: 'Bulgarian Split Squat', equipment: ['dumbbell'] }, { exerciseName: 'Hack Squat', equipment: ['machine'] }, { exerciseName: 'Lunges', equipment: ['dumbbell'] }],                               isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Hamstrings',      exerciseName: 'Leg Curl',          equipment: ['machine'],         alternatives: [{ exerciseName: 'Seated Leg Curl', equipment: ['machine'] }, { exerciseName: 'Cable Pull-Through', equipment: ['cable'] }, { exerciseName: 'Good Mornings', equipment: ['barbell'] }],                          isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Core',            exerciseName: 'Plank',             equipment: ['bodyweight'],      alternatives: [{ exerciseName: 'Ab Wheel Rollout', equipment: ['bodyweight'] }, { exerciseName: 'Decline Crunch', equipment: ['bodyweight'] }, { exerciseName: 'Russian Twist', equipment: ['bodyweight'] }],                    isCompound: false, buildSets: 3, buildReps: '60s',   recoverySets: 2, recoveryReps: '30s',   restPeriod: 60  },
    ],
  },
  'Chest': {
    name: 'Chest',
    slots: [
      { label: 'Chest (Flat)',      exerciseName: 'Barbell Bench Press',   equipment: ['barbell', 'bench'], alternatives: [{ exerciseName: 'Machine Chest Press', equipment: ['machine'] }, { exerciseName: 'Dumbbell Bench Press', equipment: ['dumbbell', 'bench'] }, { exerciseName: 'Push-ups', equipment: ['bodyweight'] }],                        isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Chest (Incline)',   exerciseName: 'Incline Dumbbell Press', equipment: ['dumbbell'],        alternatives: [{ exerciseName: 'Incline Barbell Bench Press', equipment: ['barbell', 'bench'] }, { exerciseName: 'Cable Fly', equipment: ['cable'] }, { exerciseName: 'Push-ups', equipment: ['bodyweight'] }],                               isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 120 },
      { label: 'Chest (Isolation)', exerciseName: 'Chest Fly (Dumbbell)',  equipment: ['dumbbell'],        alternatives: [{ exerciseName: 'Cable Fly', equipment: ['cable'] }, { exerciseName: 'Push-ups', equipment: ['bodyweight'] }],                                                                                                                 isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Triceps',           exerciseName: 'Tricep Pushdown',       equipment: ['cable'],           alternatives: [{ exerciseName: 'Skull Crushers', equipment: ['barbell'] }, { exerciseName: 'Overhead Tricep Extension', equipment: ['dumbbell'] }, { exerciseName: 'Tricep Dips', equipment: ['bodyweight'] }],                               isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Back': {
    name: 'Back',
    slots: [
      { label: 'Back (Vertical)',   exerciseName: 'Pull-ups',      equipment: ['bodyweight'], alternatives: [{ exerciseName: 'Lat Pulldown', equipment: ['cable'] }, { exerciseName: 'Seated Cable Row', equipment: ['cable'] }],                                                                                     isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Horizontal)', exerciseName: 'Barbell Row',   equipment: ['barbell'],    alternatives: [{ exerciseName: 'T-Bar Row', equipment: ['barbell'] }, { exerciseName: 'Single-Arm Dumbbell Row', equipment: ['dumbbell'] }, { exerciseName: 'Pendlay Row', equipment: ['barbell'] }],                   isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Back (Width)',      exerciseName: 'Lat Pulldown',  equipment: ['cable'],      alternatives: [{ exerciseName: 'Pull-ups', equipment: ['bodyweight'] }, { exerciseName: 'Seated Cable Row', equipment: ['cable'] }],                                                                                     isCompound: true,  buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
      { label: 'Biceps',            exerciseName: 'Dumbbell Curl', equipment: ['dumbbell'],   alternatives: [{ exerciseName: 'Cable Curl', equipment: ['cable'] }, { exerciseName: 'Preacher Curl', equipment: ['barbell'] }, { exerciseName: 'Barbell Curl', equipment: ['barbell'] }],                              isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
  'Shoulders': {
    name: 'Shoulders',
    slots: [
      { label: 'Shoulders (Press)',  exerciseName: 'Overhead Press',  equipment: ['barbell', 'rack'], alternatives: [{ exerciseName: 'Arnold Press', equipment: ['dumbbell'] }, { exerciseName: 'Dumbbell Shoulder Press', equipment: ['dumbbell'] }],                           isCompound: true,  buildSets: 4, buildReps: '6-8',   recoverySets: 2, recoveryReps: '8-10',  restPeriod: 150 },
      { label: 'Side Delts',         exerciseName: 'Lateral Raise',   equipment: ['dumbbell'],        alternatives: [{ exerciseName: 'Front Raise', equipment: ['dumbbell'] }, { exerciseName: 'Upright Row', equipment: ['barbell'] }],                                         isCompound: false, buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',    restPeriod: 60  },
      { label: 'Rear Delts',         exerciseName: 'Face Pulls',      equipment: ['cable'],           alternatives: [{ exerciseName: 'Rear Delt Fly', equipment: ['dumbbell'] }, { exerciseName: 'Lateral Raise', equipment: ['dumbbell'] }],                                    isCompound: false, buildSets: 3, buildReps: '12-15', recoverySets: 2, recoveryReps: '15',    restPeriod: 60  },
      { label: 'Traps',              exerciseName: 'Dumbbell Shrugs', equipment: ['dumbbell'],        alternatives: [{ exerciseName: 'Barbell Shrugs', equipment: ['barbell'] }, { exerciseName: 'Upright Row', equipment: ['barbell'] }],                                        isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 90  },
    ],
  },
  'Arms': {
    name: 'Arms',
    slots: [
      { label: 'Biceps (Compound)',   exerciseName: 'Barbell Curl',     equipment: ['barbell'],          alternatives: [{ exerciseName: 'Cable Curl', equipment: ['cable'] }, { exerciseName: 'Preacher Curl', equipment: ['barbell'] }, { exerciseName: 'Dumbbell Curl', equipment: ['dumbbell'] }],                              isCompound: false, buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 90  },
      { label: 'Biceps (Isolation)',  exerciseName: 'Dumbbell Curl',    equipment: ['dumbbell'],         alternatives: [{ exerciseName: 'Incline Dumbbell Curl', equipment: ['dumbbell'] }, { exerciseName: 'Cable Curl', equipment: ['cable'] }, { exerciseName: 'Hammer Curl', equipment: ['dumbbell'] }],                        isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
      { label: 'Triceps (Compound)',  exerciseName: 'Close Grip Bench', equipment: ['barbell', 'bench'], alternatives: [{ exerciseName: 'Skull Crushers', equipment: ['barbell'] }, { exerciseName: 'Overhead Tricep Extension', equipment: ['dumbbell'] }, { exerciseName: 'Tricep Dips', equipment: ['bodyweight'] }],              isCompound: true,  buildSets: 3, buildReps: '8-10',  recoverySets: 2, recoveryReps: '10-12', restPeriod: 90  },
      { label: 'Triceps (Isolation)', exerciseName: 'Tricep Pushdown',  equipment: ['cable'],           alternatives: [{ exerciseName: 'Skull Crushers', equipment: ['barbell'] }, { exerciseName: 'Tricep Kickback', equipment: ['dumbbell'] }, { exerciseName: 'Overhead Tricep Extension', equipment: ['dumbbell'] }],            isCompound: false, buildSets: 3, buildReps: '10-12', recoverySets: 2, recoveryReps: '12-15', restPeriod: 60  },
    ],
  },
}

export function getWorkoutType(name: string): WorkoutType {
  return WORKOUT_TYPES[name]
}

export const SPLIT_CONFIGS: SplitConfig[] = [
  { key: 'fullbody',   label: 'Full Body',           workoutTypes: ['Full Body'],                                                                     minDays: 2 },
  { key: 'pushpull',   label: 'Push-Pull',            workoutTypes: ['Push', 'Pull'],                                                                  minDays: 2 },
  { key: 'upperlower', label: 'Upper-Lower',          workoutTypes: ['Upper', 'Lower'],                                                                allowedDays: [2, 4, 6] },
  { key: 'ulu',        label: 'Upper-Lower-Upper',    workoutTypes: ['Upper', 'Lower', 'Upper'],                                                       allowedDays: [3] },
  { key: 'lul',        label: 'Lower-Upper-Lower',    workoutTypes: ['Lower', 'Upper', 'Lower'],                                                       allowedDays: [3] },
  { key: '3u2l',       label: '3×Upper + 2×Lower',   workoutTypes: ['Upper', 'Upper', 'Upper', 'Lower', 'Lower'],                                     allowedDays: [5] },
  { key: '3l2u',       label: '3×Lower + 2×Upper',   workoutTypes: ['Lower', 'Lower', 'Lower', 'Upper', 'Upper'],                                     allowedDays: [5] },
  { key: 'brosplit',   label: 'Bro Split',            workoutTypes: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'],                                   minDays: 5 },
  { key: '4u3l',       label: '4×Upper + 3×Lower',   workoutTypes: ['Upper', 'Upper', 'Upper', 'Upper', 'Lower', 'Lower', 'Lower'],                   allowedDays: [7] },
  { key: '4l3u',       label: '4×Lower + 3×Upper',   workoutTypes: ['Lower', 'Lower', 'Lower', 'Lower', 'Upper', 'Upper', 'Upper'],                   allowedDays: [7] },
]

export function getSplitsForDays(days: number): SplitConfig[] {
  return SPLIT_CONFIGS.filter((s) => {
    if (s.allowedDays) return s.allowedDays.includes(days)
    return days >= (s.minDays ?? 2) && (s.maxDays === undefined || days <= s.maxDays)
  })
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
