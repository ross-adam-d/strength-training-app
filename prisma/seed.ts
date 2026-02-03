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
      muscleGroups: ['back', 'legs', 'glutes', 'core'],
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
      muscleGroups: ['legs', 'glutes', 'core'],
      equipment: ['barbell', 'rack'],
      isPublic: true,
    },
    {
      name: 'Front Squat',
      description: 'Quad-focused squat variation with bar in front',
      muscleGroups: ['legs', 'glutes', 'core'],
      equipment: ['barbell', 'rack'],
      isPublic: true,
    },
    {
      name: 'Romanian Deadlift',
      description: 'Hamstring and glute focused deadlift variation',
      muscleGroups: ['legs', 'glutes', 'back'],
      equipment: ['barbell'],
      isPublic: true,
    },
    {
      name: 'Leg Press',
      description: 'Machine-based compound leg exercise',
      muscleGroups: ['legs', 'glutes'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Leg Curl',
      description: 'Isolation exercise for hamstrings',
      muscleGroups: ['legs'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Leg Extension',
      description: 'Isolation exercise for quadriceps',
      muscleGroups: ['legs'],
      equipment: ['machine'],
      isPublic: true,
    },
    {
      name: 'Lunges',
      description: 'Unilateral leg exercise',
      muscleGroups: ['legs', 'glutes'],
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
  ]

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    })
  }

  console.log(`Seeded ${exercises.length} exercises`)
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
