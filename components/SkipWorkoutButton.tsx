'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SkipWorkoutButtonProps {
  workoutId: string
  variant?: 'dashboard' | 'mesocycle'
  onSkipped?: () => void
}

export default function SkipWorkoutButton({ workoutId, variant = 'dashboard', onSkipped }: SkipWorkoutButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSkip = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workouts/${workoutId}/skip`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to skip workout')
        return
      }
      setShowConfirm(false)
      if (onSkipped) {
        onSkipped()
      } else {
        router.refresh()
      }
    } catch {
      alert('Failed to skip workout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={
          variant === 'dashboard'
            ? 'px-4 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition'
            : 'px-4 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition'
        }
      >
        Skip
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skip this workout?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This workout will be marked as skipped. You can undo this later if you change your mind.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
                disabled={loading}
              >
                {loading ? 'Skipping...' : 'Skip Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
