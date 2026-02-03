import { useState } from 'react'
import { WorkoutCard } from './WorkoutCard'

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

interface Microcycle {
  id: string
  name: string
  weekNumber: number
  workouts: Workout[]
}

interface Exercise {
  id: string
  name: string
}

interface WeekRowProps {
  microcycle: Microcycle
  exercises: Exercise[]
  onSlotChange: () => void
}

export function WeekRow({ microcycle, exercises, onSlotChange }: WeekRowProps) {
  const [open, setOpen] = useState(false)
  const isRecovery = microcycle.name.includes('Recovery')

  return (
    <div className="border rounded-lg mb-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 transition text-left"
      >
        <span className={`text-sm font-medium ${isRecovery ? 'text-amber-700' : 'text-gray-800'}`}>
          {microcycle.name}
        </span>
        <div className="flex items-center gap-2">
          {isRecovery && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Recovery</span>
          )}
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t grid sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-gray-50">
          {microcycle.workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              exercises={exercises}
              onSlotChange={onSlotChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
