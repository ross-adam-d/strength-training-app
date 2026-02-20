import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const updates: { name: string; muscleGroups: string[] }[] = [
  { name: 'Deadlift',          muscleGroups: ['back', 'quads', 'hamstrings', 'glutes', 'core'] },
  { name: 'Barbell Squat',     muscleGroups: ['quads', 'hamstrings', 'glutes', 'core'] },
  { name: 'Front Squat',       muscleGroups: ['quads', 'glutes', 'core'] },
  { name: 'Romanian Deadlift', muscleGroups: ['hamstrings', 'glutes', 'back'] },
  { name: 'Leg Press',         muscleGroups: ['quads', 'hamstrings', 'glutes'] },
  { name: 'Leg Curl',          muscleGroups: ['hamstrings'] },
  { name: 'Good Mornings',     muscleGroups: ['hamstrings', 'back'] },
  { name: 'Leg Extension',     muscleGroups: ['quads'] },
  { name: 'Lunges',            muscleGroups: ['quads', 'hamstrings', 'glutes'] },
]

async function main() {
  for (const { name, muscleGroups } of updates) {
    const result = await prisma.exercise.updateMany({
      where: { name },
      data: { muscleGroups },
    })
    console.log(`${name}: updated ${result.count} record(s) → [${muscleGroups.join(', ')}]`)
  }
  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
