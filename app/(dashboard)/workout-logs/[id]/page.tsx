import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DeleteWorkoutLogButton from './DeleteWorkoutLogButton'
import UndoSkipButton from '@/components/UndoSkipButton'
import { formatWeight, weightUnit } from '@/lib/units'
import { formatSetTargets, SetTarget } from '@/lib/setTargets'

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
    where: { id },
    include: {
      user: { select: { unitPreference: true } },
      workout: {
        select: {
          id: true,
          name: true,
          microcycle: {
            select: {
              mesocycle: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          workoutExercises: {
            select: {
              exerciseId: true,
              targetSets: true,
              targetReps: true,
              setTargets: true,
            },
          },
        },
      },
      exerciseLogs: {
        include: {
          exercise: { select: { id: true, name: true, isUnilateral: true } },
        },
      },
    },
  })

  if (!log) {
    return <div className="text-center py-8">Workout log not found</div>
  }

  // Verify access: owner or coach with active relationship
  const isOwner = log.userId === session.user.id
  let hasAccess = isOwner
  if (!isOwner && session.user.role === 'COACH') {
    const rel = await prisma.coachClientRelationship.findFirst({
      where: { coachId: session.user.id, clientId: log.userId, status: 'ACTIVE' },
      select: { id: true },
    })
    hasAccess = !!rel
  }
  if (!hasAccess) {
    return <div className="text-center py-8">Workout log not found</div>
  }

  const unitPref = (log.user?.unitPreference ?? 'metric') as 'metric' | 'imperial'
  const unit = unitPref === 'imperial' ? 'lbs' : 'kg'

  // Build map from exerciseId → planned exercise data
  const workoutExerciseMap = new Map<string, { targetSets: number; targetReps: string | null; setTargets: SetTarget[] | null }>(
    (log.workout?.workoutExercises ?? []).map((we) => [
      we.exerciseId,
      { targetSets: we.targetSets, targetReps: we.targetReps, setTargets: we.setTargets as SetTarget[] | null },
    ])
  )

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

  const mesocycleId = log.workout?.microcycle?.mesocycle?.id

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10 mb-4">
        {mesocycleId ? (
          <Link
            href={`/mesocycles/${mesocycleId}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ← Back to {log.workout?.microcycle?.mesocycle?.name}
          </Link>
        ) : (
          <a href="/dashboard" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            ← Back to Dashboard
          </a>
        )}
        <div className="flex items-center gap-2 mt-2">
          <h1 className="text-lg font-bold text-gray-900">
            {log.workout?.name ?? 'Manual Workout'}
          </h1>
          {log.skipped && (
            <span className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-md font-medium">
              Skipped
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">
          {new Date(log.completedAt).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          {!log.skipped && log.duration && ` • ${log.duration} min`}
          {!log.skipped && log.overallRating && ` • ${log.overallRating}⭐`}
          {!log.skipped && log.overallRpe && ` • RPE ${log.overallRpe.toFixed(1)}`}
        </p>
        {log.notes && !log.skipped && (
          <p className="mt-2 text-sm text-gray-600 italic border-l-2 border-primary-300 pl-3">
            {log.notes}
          </p>
        )}
      </div>

      <div className="px-4">

        {log.skipped ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            <p className="text-gray-500 mb-4">This workout was skipped</p>
            {isOwner && (
              <UndoSkipButton workoutLogId={log.id} variant="detail" />
            )}
          </div>
        ) : exerciseOrder.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No exercises logged</p>
          </div>
        ) : null}

        {!log.skipped && exerciseOrder.map((exerciseId) => {
          const sets = grouped.get(exerciseId)!
          const skippedCount = sets.filter((s) => s.skipped).length
          const completedSets = sets.filter((s) => !s.skipped)
          const exerciseRpe = sets[0]?.exerciseRpe
          const isUnilateral = sets[0]?.exercise.isUnilateral ?? false

          const plannedExercise = workoutExerciseMap.get(exerciseId)
          const planLine = (() => {
            if (!plannedExercise) return null
            const st = plannedExercise.setTargets
            if (st && st.length > 0) {
              return <p className="text-xs text-orange-600 mb-2">Plan: {formatSetTargets(st, unit)}</p>
            }
            if (plannedExercise.targetSets && plannedExercise.targetReps) {
              return <p className="text-xs text-gray-400 mb-2">Plan: {plannedExercise.targetSets}×{plannedExercise.targetReps}</p>
            }
            return null
          })()

          return (
            <div key={exerciseId} className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900">{sets[0].exercise.name}</h2>
                {exerciseRpe && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    RPE {exerciseRpe}
                  </span>
                )}
              </div>

              {planLine}

              <div className={`grid ${isUnilateral ? 'grid-cols-[2rem_1fr_1.2fr_1fr]' : 'grid-cols-[2rem_1fr_1fr_1fr]'} gap-2 text-xs font-medium text-gray-500 mb-2`}>
                <div className="text-center">#</div>
                <div className="text-center">Weight</div>
                <div className="text-center">{isUnilateral ? 'Reps (L/R)' : 'Reps'}</div>
                <div className="text-center">RIR</div>
              </div>

              <div className="space-y-1.5">
                {sets.map((set) =>
                  set.skipped ? (
                    <div
                      key={set.setNumber}
                      className={`grid ${isUnilateral ? 'grid-cols-[2rem_1fr_1.2fr_1fr]' : 'grid-cols-[2rem_1fr_1fr_1fr]'} gap-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5`}
                    >
                      <span className="text-sm text-gray-400 text-center line-through">{set.setNumber}</span>
                      <span className="col-span-3 text-sm text-yellow-700 text-center">⊘ Skipped</span>
                    </div>
                  ) : (
                    <div key={set.setNumber} className={`grid ${isUnilateral ? 'grid-cols-[2rem_1fr_1.2fr_1fr]' : 'grid-cols-[2rem_1fr_1fr_1fr]'} gap-2 text-sm`}>
                      <span className="font-medium text-gray-700 text-center">{set.setNumber}</span>
                      <span className="text-center text-gray-900">{formatWeight(set.weight, unitPref)} {weightUnit(unitPref)}</span>
                      <span className="text-center text-gray-900">
                        {isUnilateral
                          ? `${set.repsLeft ?? 0} / ${set.repsRight ?? 0}`
                          : set.reps}
                      </span>
                      <span className="text-center text-gray-600">{set.rir ?? '—'}</span>
                    </div>
                  )
                )}
              </div>

              {completedSets.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                  {completedSets.length} set{completedSets.length !== 1 ? 's' : ''} completed
                  {skippedCount > 0 && ` • ${skippedCount} skipped`}
                </div>
              )}

              {sets[0]?.notes && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-600 italic">{sets[0].notes}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Delete — owner only, not for skipped (use Undo instead) */}
      {isOwner && !log.skipped && (
        <div className="px-4 pt-4 pb-8">
          <DeleteWorkoutLogButton id={log.id} />
        </div>
      )}
    </div>
  )
}
