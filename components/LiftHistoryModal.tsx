'use client'

import { useState, useEffect } from 'react'

interface ExerciseLog {
  id: string
  setNumber: number
  reps: number
  weight: number
  rir: number | null
  skipped: boolean
  notes: string | null
  workoutLog: {
    completedAt: string
  }
}

interface WorkoutSession {
  date: string
  sets: ExerciseLog[]
}

interface LiftHistoryModalProps {
  exerciseId: string
  exerciseName: string
  onClose: () => void
}

export function LiftHistoryModal({ exerciseId, exerciseName, onClose }: LiftHistoryModalProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExerciseHistory()
  }, [exerciseId])

  const fetchExerciseHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/logs`)
      if (res.ok) {
        const logs: ExerciseLog[] = await res.json()

        // Group logs by workout session (completedAt date)
        const sessionMap = new Map<string, ExerciseLog[]>()
        logs.forEach((log) => {
          const dateKey = new Date(log.workoutLog.completedAt).toISOString().split('T')[0]
          if (!sessionMap.has(dateKey)) {
            sessionMap.set(dateKey, [])
          }
          sessionMap.get(dateKey)!.push(log)
        })

        // Convert to array and sort by date (most recent first)
        const sessionArray: WorkoutSession[] = Array.from(sessionMap.entries())
          .map(([date, sets]) => ({
            date,
            sets: sets.sort((a, b) => a.setNumber - b.setNumber),
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10) // Show last 10 sessions

        setSessions(sessionArray)
      }
    } catch (error) {
      console.error('Error fetching exercise history:', error)
    } finally {
      setLoading(false)
    }
  }

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Lift History</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Exercise Name */}
        <div className="px-4 py-3 bg-primary-50 border-b">
          <h3 className="font-medium text-gray-900">{exerciseName}</h3>
          <p className="text-sm text-gray-600">Last 10 workout sessions</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading history...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No previous data for this exercise</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const sessionDate = new Date(session.date)
                const completedSets = session.sets.filter((s) => !s.skipped)

                return (
                  <div key={session.date} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {sessionDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </h4>
                      <span className="text-sm text-gray-600">
                        {completedSets.length} {completedSets.length === 1 ? 'set' : 'sets'}
                      </span>
                    </div>

                    {/* Sets Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">Set</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">Weight</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">Reps</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">RIR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {session.sets.map((set) => (
                            <tr
                              key={set.id}
                              className={set.skipped ? 'text-gray-400 line-through' : ''}
                            >
                              <td className="px-3 py-2">
                                {set.skipped ? '⊘ ' : ''}
                                {set.setNumber}
                              </td>
                              <td className="px-3 py-2">
                                {set.skipped ? '—' : `${set.weight} kg`}
                              </td>
                              <td className="px-3 py-2">
                                {set.skipped ? '—' : set.reps}
                              </td>
                              <td className="px-3 py-2">
                                {set.skipped ? '—' : set.rir ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Stats */}
                    {completedSets.length > 0 && (
                      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          <strong className="text-gray-900">Total Volume:</strong>{' '}
                          {completedSets
                            .reduce((sum, set) => sum + set.weight * set.reps, 0)
                            .toLocaleString()}{' '}
                          kg
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-gray-900">Avg Weight:</strong>{' '}
                          {(
                            completedSets.reduce((sum, set) => sum + set.weight, 0) /
                            completedSets.length
                          ).toFixed(1)}{' '}
                          kg
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
