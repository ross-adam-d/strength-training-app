import { useState } from 'react'
import { ExerciseSlotRow } from './ExerciseSlotRow'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ExerciseSlot {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetReps: string
  notes: string | null
  exercise: { id: string; name: string }
}

interface Workout {
  id: string
  name: string
  dayOfWeek: number | null
  workoutExercises: ExerciseSlot[]
}

interface Exercise {
  id: string
  name: string
}

interface WorkoutCardProps {
  workout: Workout
  exercises: Exercise[]
  onSlotChange: () => void
}

export function WorkoutCard({ workout, exercises, onSlotChange }: WorkoutCardProps) {
  const [adding, setAdding] = useState(false)
  const [newExerciseId, setNewExerciseId] = useState('')
  const sorted = [...workout.workoutExercises].sort((a, b) => a.orderIndex - b.orderIndex)

  async function handleAdd() {
    if (!newExerciseId) return
    const res = await fetch('/api/workout-exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutId: workout.id,
        exerciseId: newExerciseId,
        targetSets: 3,
        targetReps: '8-10',
      }),
    })
    if (res.ok) {
      setAdding(false)
      setNewExerciseId('')
      onSlotChange()
    }
  }

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="mb-2">
        <p className="text-sm font-semibold text-gray-800">{workout.name}</p>
        {workout.dayOfWeek !== null && (
          <p className="text-xs text-gray-400">{DAY_NAMES[workout.dayOfWeek]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        {sorted.map((slot) => (
          <ExerciseSlotRow
            key={slot.id}
            slot={slot}
            exercises={exercises}
            onSlotChange={onSlotChange}
          />
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-1.5 mt-2 bg-primary-50 rounded p-1.5">
          <select
            value={newExerciseId}
            onChange={(e) => setNewExerciseId(e.target.value)}
            className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-1"
          >
            <option value="">Pick exercise...</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newExerciseId}
            className="text-xs bg-primary-600 text-white px-2 py-1 rounded disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewExerciseId('') }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 w-full text-xs text-primary-600 hover:text-primary-800 text-left px-1 py-0.5 hover:bg-primary-50 rounded"
        >
          + Add exercise
        </button>
      )}
    </div>
  )
}
