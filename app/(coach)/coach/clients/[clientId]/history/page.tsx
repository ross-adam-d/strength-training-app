'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface ExerciseLog {
  exercise: { name: string }
  weight: number
  reps: number
  skipped: boolean
}

interface WorkoutLog {
  id: string
  completedAt: string
  duration: number | null
  overallRpe: number | null
  overallRating: number | null
  workout: { name: string } | null
  exerciseLogs: ExerciseLog[]
}

export default function ClientHistoryPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/coach/clients/${clientId}/workout-logs?limit=50`)
      .then((r) => r.json())
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading workout history...</div>
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No workouts logged yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const uniqueExercises = new Set(
          log.exerciseLogs.filter((e) => !e.skipped).map((e) => e.exercise.name)
        ).size

        return (
          <div
            key={log.id}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {log.workout?.name ?? 'Manual workout'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(log.completedAt).toLocaleDateString('en-AU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  {uniqueExercises > 0 && <span>{uniqueExercises} exercises</span>}
                  {log.duration && (
                    <>
                      <span>·</span>
                      <span>{log.duration} min</span>
                    </>
                  )}
                  {log.overallRpe && (
                    <>
                      <span>·</span>
                      <span>RPE {log.overallRpe}</span>
                    </>
                  )}
                  {log.overallRating && (
                    <>
                      <span>·</span>
                      <span>{'★'.repeat(log.overallRating)}{'☆'.repeat(5 - log.overallRating)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {log.exerciseLogs.filter((e) => !e.skipped).length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-50">
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set(log.exerciseLogs.filter((e) => !e.skipped).map((e) => e.exercise.name))
                  ).slice(0, 6).map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {name}
                    </span>
                  ))}
                  {new Set(log.exerciseLogs.filter((e) => !e.skipped).map((e) => e.exercise.name)).size > 6 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                      +{new Set(log.exerciseLogs.filter((e) => !e.skipped).map((e) => e.exercise.name)).size - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
