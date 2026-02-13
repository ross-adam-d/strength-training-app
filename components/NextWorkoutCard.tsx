'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface NextWorkoutCardProps {
  workout: { id: string; name: string; dayOfWeek: number | null } | null
  label: string
  hasActiveBlock: boolean
}

export function NextWorkoutCard({ workout, label, hasActiveBlock }: NextWorkoutCardProps) {
  const [hasInProgress, setHasInProgress] = useState(false)

  useEffect(() => {
    if (workout) {
      const draftKey = `workout-draft-${workout.id}`
      setHasInProgress(!!localStorage.getItem(draftKey))
    }
  }, [workout])

  if (!workout) {
    return hasActiveBlock ? (
      <p className="text-gray-500">All workouts completed this week</p>
    ) : (
      <p className="text-gray-500">No active training block</p>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{label}</p>
          {hasInProgress && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-md font-medium whitespace-nowrap">
              ⏳ In Progress
            </span>
          )}
        </div>
        <p className="text-xl font-bold text-gray-900">{workout.name}</p>
      </div>
      <Link
        href={`/workouts/${workout.id}/log`}
        className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
      >
        {hasInProgress ? 'Resume' : 'Start'}
      </Link>
    </div>
  )
}
