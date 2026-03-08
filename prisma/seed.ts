import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding exercise library...')

  const exercises = [
    // Chest exercises
    {
      name: 'Barbell Bench Press',
      description: 'Classic compound chest exercise using a barbell',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      isPublic: true,
    },
    {
      name: 'Dumbbell Bench Press',
      description: 'Chest press using dumbbells for greater range of motion',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['dumbbell', 'bench'],
      isPublic: true,
    },
    {
      name: 'Incline Barbell Bench Press',
      description: 'Upper chest focused barbell press on incline bench',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      isPublic: true,
    },
    {
      name: 'Incline Dumbbell Press',
      description: 'Upper chest focused dumbbell press on incline bench',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['dumbbell', 'bench'],
      isPublic: true,
    },
    {
      name: 'Chest Fly (Dumbbell)',
      description: 'Isolation exercise for chest using dumbbells',
      muscleGroups: ['chest'],
      equipment: ['dumbbell', 'bench'],
      isPublic: true,
    },
    {
      name: 'Push-ups',
      description: 'Bodyweight chest exercise',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['bodyweight'],
      isPublic: true,
    },

    // Back exercises
    {
      name: 'Deadlift',
      description: 'Fundamental compound movement for posterior chain',
      muscleGroups: ['back', 'quads', 'hamstrings', 'glutes', 'core'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Barbell Row',
      description: 'Compound back exercise with barbell',
      muscleGroups: ['back', 'biceps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Pull-ups',
      description: 'Bodyweight vertical pulling exercise',
      muscleGroups: ['back', 'biceps'],
      equipment: ['bodyweight', 'pull-up-bar'],
      isPublic: true,
    },
    {
      name: 'Lat Pulldown',
      description: 'Machine-based vertical pulling exercise',
      muscleGroups: ['back', 'biceps'],
      equipment: ['cable', 'machine'],
      isPublic: true,
    },
    {
      name: 'Seated Cable Row',
      description: 'Horizontal pulling exercise using cable machine',
      muscleGroups: ['back', 'biceps'],
      equipment: ['cable', 'machine'],
      isPublic: true,
    },

    // Leg exercises
    {
      name: 'Barbell Squat',
      description: 'Fundamental compound leg exercise',
      muscleGroups: ['quads', 'hamstrings', 'glutes', 'core'],
      equipment: ['barbell', 'rack'],
      isPublic: true,
    },
    {
      name: 'Front Squat',
      description: 'Quad-focused squat variation with bar in front',
      muscleGroups: ['quads', 'glutes', 'core'],
      equipment: ['barbell', 'rack'],
      isPublic: true,
    },
    {
      name: 'Romanian Deadlift',
      description: 'Hamstring and glute focused deadlift variation',
      muscleGroups: ['hamstrings', 'glutes', 'back'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Leg Press',
      description: 'Machine-based compound leg exercise',
      muscleGroups: ['quads', 'hamstrings', 'glutes'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Leg Curl',
      description: 'Isolation exercise for hamstrings',
      muscleGroups: ['hamstrings'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Good Mornings',
      description: 'Hip hinge movement targeting hamstrings and lower back',
      muscleGroups: ['hamstrings', 'back'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Leg Extension',
      description: 'Isolation exercise for quadriceps',
      muscleGroups: ['quads'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Lunges',
      description: 'Unilateral leg exercise',
      muscleGroups: ['quads', 'hamstrings', 'glutes'],
      equipment: ['dumbbell', 'bodyweight'],
      isPublic: true,
    },

    // Shoulder exercises
    {
      name: 'Overhead Press',
      description: 'Compound shoulder press with barbell',
      muscleGroups: ['shoulders', 'triceps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Dumbbell Shoulder Press',
      description: 'Overhead press using dumbbells',
      muscleGroups: ['shoulders', 'triceps'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Lateral Raise',
      description: 'Isolation exercise for side deltoids',
      muscleGroups: ['shoulders'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Front Raise',
      description: 'Isolation exercise for front deltoids',
      muscleGroups: ['shoulders'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Face Pulls',
      description: 'Rear deltoid and upper back exercise',
      muscleGroups: ['shoulders', 'back'],
      equipment: ['cable'],
      isPublic: true,
    },

    // Arm exercises
    {
      name: 'Barbell Curl',
      description: 'Classic bicep exercise with barbell',
      muscleGroups: ['biceps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Dumbbell Curl',
      description: 'Bicep curl using dumbbells',
      muscleGroups: ['biceps'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Hammer Curl',
      description: 'Neutral grip bicep curl',
      muscleGroups: ['biceps', 'forearms'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Close Grip Bench',
      description: 'Barbell bench press with narrow grip, targeting triceps',
      muscleGroups: ['triceps', 'chest'],
      equipment: ['barbell', 'bench'],
      isPublic: true,
    },
    {
      name: 'Dumbbell Shrugs',
      description: 'Shoulder shrug for upper trapezius development',
      muscleGroups: ['shoulders'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Tricep Dips',
      description: 'Bodyweight tricep exercise',
      muscleGroups: ['triceps', 'chest'],
      equipment: ['bodyweight', 'dip-bars'],
      isPublic: true,
    },
    {
      name: 'Tricep Pushdown',
      description: 'Cable-based tricep isolation exercise',
      muscleGroups: ['triceps'],
      equipment: ['cable'],
      isPublic: true,
    },
    {
      name: 'Overhead Tricep Extension',
      description: 'Overhead tricep exercise with dumbbell',
      muscleGroups: ['triceps'],
      equipment: ['dumbbell'],
      isPublic: true,
    },

    // Core exercises
    {
      name: 'Plank',
      description: 'Isometric core stability exercise',
      muscleGroups: ['core'],
      equipment: ['bodyweight'],
      isPublic: true,
    },
    {
      name: 'Hanging Leg Raise',
      description: 'Advanced core exercise hanging from bar',
      muscleGroups: ['core'],
      equipment: ['pull-up-bar'],
      isPublic: true,
    },
    {
      name: 'Cable Crunch',
      description: 'Cable-based abdominal exercise',
      muscleGroups: ['core'],
      equipment: ['cable'],
      isPublic: true,
    },

    // Chest additions
    {
      name: 'Cable Fly',
      description: 'Cable-based chest fly providing constant tension throughout the range of motion',
      muscleGroups: ['chest'],
      equipment: ['cable'],
      isPublic: true,
    },
    {
      name: 'Machine Chest Press',
      description: 'Guided chest press machine for chest development without stabilisation demands',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Decline Bench Press',
      description: 'Barbell press on a decline angle targeting the lower chest',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      isPublic: true,
    },

    // Back additions
    {
      name: 'T-Bar Row',
      description: 'Barbell row using a T-bar setup for mid-back thickness',
      muscleGroups: ['back', 'biceps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Single-Arm Dumbbell Row',
      description: 'Unilateral dumbbell row for balanced lat and mid-back development',
      muscleGroups: ['back', 'biceps'],
      equipment: ['dumbbell'],
      isPublic: true,
      isUnilateral: true,
    },
    {
      name: 'Pendlay Row',
      description: 'Strict barbell row reset to the floor each rep for explosive back strength',
      muscleGroups: ['back', 'biceps'],
      equipment: ['barbell'],
      isPublic: true,
    },

    // Shoulder & trap additions
    {
      name: 'Barbell Shrugs',
      description: 'Heavy shrug movement for upper trapezius development',
      muscleGroups: ['shoulders'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Upright Row',
      description: 'Vertical pull targeting the traps and lateral deltoids',
      muscleGroups: ['shoulders', 'biceps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Arnold Press',
      description: 'Rotating dumbbell shoulder press hitting all three deltoid heads',
      muscleGroups: ['shoulders', 'triceps'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Rear Delt Fly',
      description: 'Dumbbell fly isolation for the posterior deltoid and upper back',
      muscleGroups: ['shoulders'],
      equipment: ['dumbbell'],
      isPublic: true,
    },

    // Glute additions
    {
      name: 'Hip Thrusts',
      description: 'Hip extension movement with barbell for isolated glute development',
      muscleGroups: ['glutes', 'hamstrings'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Bulgarian Split Squat',
      description: 'Rear-foot-elevated split squat for unilateral quad and glute development',
      muscleGroups: ['quads', 'glutes'],
      equipment: ['dumbbell'],
      isPublic: true,
      isUnilateral: true,
    },
    {
      name: 'Hack Squat',
      description: 'Machine-based squat for quad-dominant lower body development without a rack',
      muscleGroups: ['quads', 'glutes'],
      equipment: ['machine'],
      isPublic: true,
    },

    // Leg additions
    {
      name: 'Box Squat',
      description: 'Squat to a box developing hip drive and posterior chain strength',
      muscleGroups: ['quads', 'hamstrings', 'glutes', 'core'],
      equipment: ['barbell', 'rack'],
      isPublic: true,
    },
    {
      name: 'Seated Leg Curl',
      description: 'Seated machine curl for isolated hamstring development',
      muscleGroups: ['hamstrings'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Cable Pull-Through',
      description: 'Cable hip hinge targeting the glutes and hamstrings',
      muscleGroups: ['hamstrings', 'glutes'],
      equipment: ['cable'],
      isPublic: true,
    },

    // Bicep additions
    {
      name: 'Cable Curl',
      description: 'Cable-based curl providing constant tension throughout the range of motion',
      muscleGroups: ['biceps'],
      equipment: ['cable'],
      isPublic: true,
    },
    {
      name: 'Preacher Curl',
      description: 'Strict bicep curl on a preacher pad eliminating shoulder involvement',
      muscleGroups: ['biceps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Incline Dumbbell Curl',
      description: 'Curl on an incline bench for maximum long-head bicep stretch',
      muscleGroups: ['biceps'],
      equipment: ['dumbbell'],
      isPublic: true,
    },

    // Tricep additions
    {
      name: 'Skull Crushers',
      description: 'Lying barbell extension for overall tricep mass development',
      muscleGroups: ['triceps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Tricep Kickback',
      description: 'Dumbbell kickback isolating the tricep through full extension',
      muscleGroups: ['triceps'],
      equipment: ['dumbbell'],
      isPublic: true,
      isUnilateral: true,
    },

    // Core additions
    {
      name: 'Ab Wheel Rollout',
      description: 'Anti-extension core exercise for total core and shoulder stability',
      muscleGroups: ['core'],
      equipment: ['bodyweight'],
      isPublic: true,
      isBodyweight: true,
    },
    {
      name: 'Decline Crunch',
      description: 'Crunch on a decline bench for upper ab focus',
      muscleGroups: ['core'],
      equipment: ['bodyweight'],
      isPublic: true,
      isBodyweight: true,
    },
    {
      name: 'Russian Twist',
      description: 'Rotational core exercise targeting the obliques',
      muscleGroups: ['core'],
      equipment: ['bodyweight'],
      isPublic: true,
      isBodyweight: true,
    },

    // Forearm addition
    {
      name: 'Reverse Curl',
      description: 'Overhand curl targeting the brachialis, brachioradialis, and forearms',
      muscleGroups: ['biceps', 'forearms'],
      equipment: ['barbell'],
      isPublic: true,
    },

    // ── Olympic Lifting — Clean variants ──────────────────────────────────
    {
      name: 'Power Clean',
      description: 'Explosive barbell pull from the floor caught above parallel — the most widely used Olympic derivative for developing whole-body power',
      muscleGroups: ['glutes', 'hamstrings', 'back', 'traps', 'quads', 'shoulders'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Hang Power Clean',
      description: 'Power clean initiated from a hang position (mid-thigh or knee) — eliminates the floor pull and emphasises rate of force development',
      muscleGroups: ['glutes', 'hamstrings', 'traps', 'back', 'shoulders'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Hang Clean',
      description: 'Full squat clean from a hang position — develops explosive hip extension and a strong receiving position',
      muscleGroups: ['glutes', 'hamstrings', 'traps', 'back', 'quads'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Squat Clean',
      description: 'Full Olympic clean caught in a deep front squat — highest technical demand of the clean variants; requires excellent mobility and positional strength',
      muscleGroups: ['glutes', 'hamstrings', 'traps', 'back', 'quads'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Clean Pull',
      description: 'Clean without the catch — bar pulled to hip height with maximal triple extension; allows heavy loading of the posterior chain pulling pattern',
      muscleGroups: ['glutes', 'hamstrings', 'back', 'traps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Hang Clean Pull',
      description: 'Clean pull initiated from a hang position — loads the hip extension pattern without floor mechanics',
      muscleGroups: ['glutes', 'hamstrings', 'traps', 'back'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Clean High Pull',
      description: 'Clean pull continued to elbow-high position — more accessible than the full clean while building trap and upper-back pulling strength',
      muscleGroups: ['traps', 'back', 'glutes', 'hamstrings', 'shoulders'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Muscle Clean',
      description: 'Clean with no re-bend in the receiving position — continuous pull demanding strong deltoid and trap engagement; primarily a technique builder',
      muscleGroups: ['traps', 'shoulders', 'back', 'glutes'],
      equipment: ['barbell'],
      isPublic: true,
    },

    // ── Olympic Lifting — Snatch variants ─────────────────────────────────
    {
      name: 'Power Snatch',
      description: 'Explosive wide-grip pull from the floor caught above parallel — develops full-body power with significant shoulder stability demand',
      muscleGroups: ['glutes', 'hamstrings', 'back', 'traps', 'shoulders'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Hang Power Snatch',
      description: 'Power snatch from a hang position — removes the floor pull to focus on the explosive extension and overhead receiving position',
      muscleGroups: ['glutes', 'hamstrings', 'traps', 'shoulders', 'back'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Hang Snatch',
      description: 'Full squat snatch from a hang position — combines explosive hip drive with a deep overhead squat catch',
      muscleGroups: ['glutes', 'hamstrings', 'traps', 'shoulders', 'quads'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Squat Snatch',
      description: 'Full Olympic snatch caught in a deep overhead squat — the most technical Olympic lift; maximum power and mobility demands',
      muscleGroups: ['glutes', 'hamstrings', 'traps', 'shoulders', 'quads', 'core'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Snatch Pull',
      description: 'Snatch-grip pull from the floor without the catch — heavily loads the posterior chain with wide-grip bar path mechanics',
      muscleGroups: ['glutes', 'hamstrings', 'back', 'traps'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Snatch High Pull',
      description: 'Snatch pull continued to elbow-high position — accessible entry to Olympic pulling patterns with no overhead catch required',
      muscleGroups: ['traps', 'back', 'glutes', 'hamstrings', 'shoulders'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Overhead Squat',
      description: 'Barbell squat with the bar locked out overhead — builds the shoulder stability, thoracic mobility, and positional strength required for the snatch',
      muscleGroups: ['quads', 'glutes', 'core', 'shoulders', 'back'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Snatch Grip Deadlift',
      description: 'Conventional deadlift with a wide snatch grip — builds snatch-specific pulling strength and lat engagement at a heavier load than the full snatch',
      muscleGroups: ['glutes', 'hamstrings', 'back', 'traps', 'core'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Snatch Balance',
      description: 'Dip-drive-drop drill for the snatch receiving position — develops footwork, overhead stability, and confidence under the bar',
      muscleGroups: ['shoulders', 'quads', 'core'],
      equipment: ['barbell'],
      isPublic: true,
    },

    // ── Olympic Lifting — Jerk variants ───────────────────────────────────
    {
      name: 'Push Press',
      description: 'Overhead press with a leg drive initiation — bridges the gap between strict press and the jerk; strong power output driver',
      muscleGroups: ['shoulders', 'triceps', 'glutes', 'quads'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Push Jerk',
      description: 'Overhead drive with a dip-and-drive then re-bend under the bar — higher power output than push press; feet remain in place',
      muscleGroups: ['shoulders', 'triceps', 'quads', 'core'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Split Jerk',
      description: 'Competition jerk with a split-stance receiving position — highest overhead loading potential; requires footwork and positional practice',
      muscleGroups: ['shoulders', 'triceps', 'quads', 'core'],
      equipment: ['barbell'],
      isPublic: true,
    },

    // ── Calves ───────────────────────────────────────────────────────────────
    {
      name: 'Standing Calf Raise',
      description: 'Classic bilateral calf raise performed with straight knees — primarily targets the gastrocnemius',
      muscleGroups: ['calves'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Standing Calf Raise (Barbell)',
      description: 'Barbell calf raise performed on a plate or step — heavy loading for gastrocnemius development',
      muscleGroups: ['calves'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Standing Calf Raise (Dumbbell)',
      description: 'Dumbbell calf raise — convenient variation with full range of motion off a step',
      muscleGroups: ['calves'],
      equipment: ['dumbbell'],
      isPublic: true,
    },
    {
      name: 'Single Leg Calf Raise',
      description: 'Unilateral bodyweight calf raise — loads each leg independently for balanced development',
      muscleGroups: ['calves'],
      equipment: ['bodyweight'],
      isPublic: true,
      isUnilateral: true,
    },
    {
      name: 'Seated Calf Raise',
      description: 'Calf raise performed seated with knees bent — emphasises the soleus over the gastrocnemius',
      muscleGroups: ['calves'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Leg Press Calf Raise',
      description: 'Calf raise performed on a leg press machine — allows heavy bilateral loading through the full range of motion',
      muscleGroups: ['calves'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Donkey Calf Raise',
      description: 'Hinged-forward calf raise with a neutral torso — stretches the gastrocnemius under load for greater hypertrophy stimulus',
      muscleGroups: ['calves'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Smith Machine Calf Raise',
      description: 'Standing calf raise on the Smith machine — guided bar path allows focus on contraction without balance demands',
      muscleGroups: ['calves'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Cable Calf Raise',
      description: 'Single or bilateral calf raise using a cable machine — constant tension throughout the range of motion',
      muscleGroups: ['calves'],
      equipment: ['cable'],
      isPublic: true,
    },
  ]

  for (const exercise of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: exercise.name, isPublic: true },
    })
    if (!existing) {
      await prisma.exercise.create({ data: exercise })
    }
  }

  console.log(`Seeded ${exercises.length} exercises`)

  // Set ADMIN role on developer account
  const devEmail = process.env.ADMIN_EMAIL
  if (devEmail) {
    await prisma.user.updateMany({
      where: { email: devEmail },
      data: { role: 'ADMIN' },
    })
    console.log(`Set ADMIN role on ${devEmail}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
