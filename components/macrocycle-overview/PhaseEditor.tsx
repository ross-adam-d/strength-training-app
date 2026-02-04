'use client'

import { useState, useEffect } from 'react'
import { EditableSlotRow, SlotData } from './EditableSlotRow'

interface ExerciseSlot {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetReps: string | null
  tempo: string | null
  restPeriod: number | null
  targetRir: number | null
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

interface Mesocycle {
  id: string
  name: string
  focus: string | null
  microcycles: Microcycle[]
}

interface Exercise {
  id: string
  name: string
}

interface PhaseEditorProps {
  mesocycle: Mesocycle
  exercises: Exercise[]
  onRefresh: () => void
}

function buildSlots(workouts: Workout[]): Record<string, SlotData[]> {
  const map: Record<string, SlotData[]> = {}
  for (const workout of workouts) {
    map[workout.name] = workout.workoutExercises
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((slot) => ({
        exerciseId: slot.exerciseId,
        exerciseName: slot.exercise.name,
        orderIndex: slot.orderIndex,
        targetSets: slot.targetSets,
        targetReps: slot.targetReps || '',
        tempo: slot.tempo || '',
        restPeriod: slot.restPeriod,
        targetRir: slot.targetRir,
        notes: slot.notes || '',
      }))
  }
  return map
}

export function PhaseEditor({ mesocycle, exercises, onRefresh }: PhaseEditorProps) {
  const templateWorkouts =
    mesocycle.microcycles.length > 0 ? mesocycle.microcycles[0].workouts : []

  const [slotsByWorkout, setSlotsByWorkout] = useState<Record<string, SlotData[]>>(
    () => buildSlots(templateWorkouts)
  )
  const [applyToSubsequent, setApplyToSubsequent] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises)

  useEffect(() => {
    setLocalExercises(exercises)
  }, [exercises])

  function updateSlot(workoutName: string, index: number, updated: SlotData) {
    setSlotsByWorkout((prev) => ({
      ...prev,
      [workoutName]: prev[workoutName].map((s, i) => (i === index ? updated : s)),
    }))
    setDirty(true)
  }

  function deleteSlot(workoutName: string, index: number) {
    setSlotsByWorkout((prev) => ({
      ...prev,
      [workoutName]: prev[workoutName]
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, orderIndex: i })),
    }))
    setDirty(true)
  }

  function reorderSlot(workoutName: string, index: number, direction: 'up' | 'down') {
    const arr = [...(slotsByWorkout[workoutName] || [])]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    setSlotsByWorkout((prev) => ({
      ...prev,
      [workoutName]: arr.map((s, i) => ({ ...s, orderIndex: i })),
    }))
    setDirty(true)
  }

  function addSlot(workoutName: string) {
    setSlotsByWorkout((prev) => ({
      ...prev,
      [workoutName]: [
        ...(prev[workoutName] || []),
        {
          exerciseId: '',
          exerciseName: '',
          orderIndex: (prev[workoutName] || []).length,
          targetSets: 3,
          targetReps: '8-10',
          tempo: '',
          restPeriod: null,
          targetRir: null,
          notes: '',
        },
      ],
    }))
    setDirty(true)
  }

  function handleExerciseCreated(exercise: Exercise) {
    setLocalExercises((prev) => [...prev, exercise])
  }

  async function handleSave() {
    for (const [name, slots] of Object.entries(slotsByWorkout)) {
      for (const slot of slots) {
        if (!slot.exerciseId) {
          setError(`Select an exercise for each slot in "${name}"`)
          return
        }
      }
    }
    for (const slots of Object.values(slotsByWorkout)) {
      for (const slot of slots) {
        if (slot.tempo && !/^\d{4}$/.test(slot.tempo)) {
          setError('Tempo must be exactly 4 digits (e.g. 3010)')
          return
        }
      }
    }

    setSaving(true)
    setError(null)

    try {
      for (const [workoutName, slots] of Object.entries(slotsByWorkout)) {
        const res = await fetch(`/api/mesocycles/${mesocycle.id}/sync-exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutName,
            exercises: slots.map((s) => ({
              exerciseId: s.exerciseId,
              orderIndex: s.orderIndex,
              targetSets: s.targetSets,
              targetReps: s.targetReps,
              tempo: s.tempo || undefined,
              restPeriod: s.restPeriod ?? undefined,
              targetRir: s.targetRir ?? undefined,
              notes: s.notes || undefined,
            })),
            applyToSubsequent,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          setError(err.error || 'Failed to save')
          return
        }
      }
      setDirty(false)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border rounded-lg mb-4 overflow-hidden">
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
        <div>
          <span className="text-sm font-semibold text-gray-800">{mesocycle.name}</span>
          {mesocycle.focus && (
            <span className="text-sm text-gray-500 ml-2">— {mesocycle.focus}</span>
          )}
          {dirty && <span className="text-xs text-amber-600 ml-2">• Unsaved changes</span>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="text-xs bg-primary-600 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-primary-700"
        >
          {saving ? 'Saving...' : 'Save Phase'}
        </button>
      </div>

      <div className="bg-gray-50 p-3">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {templateWorkouts.map((workout) => (
            <div key={workout.name} className="bg-white rounded-lg border p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">{workout.name}</p>
              <div className="space-y-2">
                {(slotsByWorkout[workout.name] || []).map((slot, idx) => (
                  <EditableSlotRow
                    key={idx}
                    slot={slot}
                    exercises={localExercises}
                    onChange={(updated) => updateSlot(workout.name, idx, updated)}
                    onDelete={() => deleteSlot(workout.name, idx)}
                    onReorder={(dir) => reorderSlot(workout.name, idx, dir)}
                    onExerciseCreated={handleExerciseCreated}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => addSlot(workout.name)}
                className="mt-2 w-full text-xs text-primary-600 hover:text-primary-800 text-left px-1 py-0.5 hover:bg-primary-50 rounded"
              >
                + Add exercise
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={applyToSubsequent}
              onChange={(e) => setApplyToSubsequent(e.target.checked)}
              className="rounded"
            />
            Apply changes to all subsequent phases
          </label>
        </div>

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  )
}
