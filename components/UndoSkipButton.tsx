'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UndoSkipButtonProps {
  workoutLogId: string
  variant?: 'dashboard' | 'mesocycle' | 'detail'
  onUndone?: () => void
}

export default function UndoSkipButton({ workoutLogId, variant = 'dashboard', onUndone }: UndoSkipButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleUndo = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workout-logs/${workoutLogId}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Failed to undo skip')
        return
      }
      if (onUndone) {
        onUndone()
      } else {
        router.refresh()
      }
    } catch {
      alert('Failed to undo skip')
    } finally {
      setLoading(false)
    }
  }

  const className = variant === 'detail'
    ? 'px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-sm'
    : variant === 'mesocycle'
      ? 'flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition'
      : 'px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition font-medium'

  return (
    <button onClick={handleUndo} disabled={loading} className={className}>
      {loading ? 'Undoing...' : 'Undo'}
    </button>
  )
}
