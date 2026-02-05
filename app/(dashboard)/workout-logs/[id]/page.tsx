import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function WorkoutLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const log = await prisma.workoutLog.findFirst({
    where: { id, userId: session.user.id },
    include: {
      workout: {
        select: { id: true, name: true },
      },
      exerciseLogs: {
        include: {
          exercise: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!log) {
    return <div className="text-center py-8">Workout log not found</div>
  }

  // Group by exercise, preserving order of first appearance
  const exerciseOrder: string[] = []
  const grouped = new Map<string, typeof log.exerciseLogs>()
  for (const el of log.exerciseLogs) {
    if (!grouped.has(el.exercise.id)) {
      grouped.set(el.exercise.id, [])
      exerciseOrder.push(el.exercise.id)
    }
    grouped.get(el.exercise.id)!.push(el)
  }
  grouped.forEach((sets) => sets.sort((a, b) => a.setNumber - b.setNumber))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {log.workout?.name ?? 'Manual Workout'}
        </h1>
        <p className="text-gray-600 mt-1">
          {new Date(log.completedAt).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          {log.duration && <span>Duration: {log.duration} min</span>}
          {log.overallRating && <span>Rating: {log.overallRating}/5</span>}
        </div>
        {log.notes && <p className="mt-3 text-gray-600 italic">{log.notes}</p>}
      </div>

      {exerciseOrder.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No exercises logged</p>
        </div>
      )}

      {exerciseOrder.map((exerciseId) => {
        const sets = grouped.get(exerciseId)!
        const skippedCount = sets.filter((s) => s.skipped).length

        return (
          <div key={exerciseId} className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-lg font-semibold mb-3">{sets[0].exercise.name}</h2>

            <div className="grid grid-cols-[1.75rem_1fr_1fr_1fr] gap-2 pb-2 border-b mb-2">
              <div />
              <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">Weight (kg)</div>
              <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">Reps</div>
              <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">RIR</div>
            </div>

            <div className="space-y-1">
              {sets.map((set) =>
                set.skipped ? (
                  <div key={set.setNumber} className="grid grid-cols-[1.75rem_1fr_1fr_1fr] gap-2 opacity-50">
                    <span className="text-sm text-gray-600">{set.setNumber}</span>
                    <span className="col-span-3 text-sm italic text-gray-400">Skipped</span>
                  </div>
                ) : (
                  <div key={set.setNumber} className="grid grid-cols-[1.75rem_1fr_1fr_1fr] gap-2">
                    <span className="text-sm font-semibold text-gray-700">{set.setNumber}</span>
                    <span className="text-sm text-center text-gray-900">{set.weight}</span>
                    <span className="text-sm text-center text-gray-900">{set.reps}</span>
                    <span className="text-sm text-center text-gray-500">{set.rir ?? '—'}</span>
                  </div>
                )
              )}
            </div>

            {skippedCount > 0 && (
              <p className="text-xs text-gray-400 mt-2">{skippedCount} set{skippedCount > 1 ? 's' : ''} skipped</p>
            )}
            {sets.some((s) => s.notes) && (
              <div className="mt-2 pt-2 border-t">
                {sets.filter((s) => s.notes).map((s) => (
                  <p key={s.setNumber} className="text-xs text-gray-500">Set {s.setNumber}: {s.notes}</p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
