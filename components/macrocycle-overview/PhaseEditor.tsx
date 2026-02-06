'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
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
  workoutLogs: {
    id: string
    completedAt: string
  }[]
}

interface Microcycle {
  id: string
  name: string
  weekNumber: number
  startDate: string
  endDate: string
  workouts: Workout[]
}

interface Mesocycle {
  id: string
  name: string
  focus: string | null
  status?: string
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

  // Phase is locked if this specific mesocycle is active (has completed workouts)
  const isLocked = mesocycle.status === 'active' || mesocycle.status === 'completed'

  // Map workout name → ID from the current (or first) microcycle for "Start" links
  const startWorkoutIds = useMemo(() => {
    const now = new Date()
    const active = mesocycle.microcycles.find(
      (m) => now >= new Date(m.startDate) && now < new Date(m.endDate)
    ) ?? mesocycle.microcycles[0]
    const ids: Record<string, string> = {}
    if (active) {
      for (const w of active.workouts) {
        if (!ids[w.name]) ids[w.name] = w.id
      }
    }
    return ids
  }, [mesocycle.microcycles])

  // Track which workout templates have been completed (check across all microcycles)
  const completedWorkouts = useMemo(() => {
    const completed = new Set<string>()
    for (const micro of mesocycle.microcycles) {
      for (const workout of micro.workouts) {
        if (workout.workoutLogs && workout.workoutLogs.length > 0) {
          completed.add(workout.name)
        }
      }
    }
    return completed
  }, [mesocycle.microcycles])

  const [slotsByWorkout, setSlotsByWorkout] = useState<Record<string, SlotData[]>>(
    () => buildSlots(templateWorkouts)
  )
  const [applyToSubsequent, setApplyToSubsequent] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null)

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
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-semibold text-gray-800">{mesocycle.name}</span>
            {mesocycle.focus && (
              <span className="text-sm text-gray-500 ml-2">— {mesocycle.focus}</span>
            )}
            {isLocked && (
              <span className="text-xs text-gray-500 ml-2">🔒 Locked</span>
            )}
            {dirty && !isLocked && <span className="text-xs text-amber-600 ml-2">• Unsaved changes</span>}
          </div>
          <div className="flex gap-2">
            {!isLocked && (
              <>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                >
                  {isExpanded ? 'Hide' : 'Edit'} Workouts
                </button>
                {dirty && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="text-xs bg-primary-600 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-primary-700"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Horizontal week cards */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {mesocycle.microcycles.map((microcycle) => {
            const now = new Date()
            const isActive = now >= new Date(microcycle.startDate) && now < new Date(microcycle.endDate)
            const isSelected = selectedWeekId === microcycle.id

            return (
              <button
                key={microcycle.id}
                onClick={() => setSelectedWeekId(isSelected ? null : microcycle.id)}
                className={`flex-shrink-0 w-32 p-3 rounded-lg border-2 transition cursor-pointer hover:shadow-md ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : isActive
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-primary-300'
                }`}
              >
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Week {microcycle.weekNumber}</p>
                  <p className="text-sm font-medium text-gray-900">{microcycle.name}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(microcycle.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  {isActive && (
                    <span className="inline-block mt-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected week workouts */}
        {selectedWeekId && (() => {
          const selectedWeek = mesocycle.microcycles.find(m => m.id === selectedWeekId)
          if (!selectedWeek) return null

          return (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  Week {selectedWeek.weekNumber} - {selectedWeek.name}
                </h4>
                <Link
                  href={`/microcycles/${selectedWeek.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Full Week →
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {selectedWeek.workouts.map((workout) => {
                  const isCompleted = workout.workoutLogs && workout.workoutLogs.length > 0
                  return (
                    <div key={workout.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{workout.name}</h5>
                        {isCompleted ? (
                          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            ✓ Completed
                          </span>
                        ) : (
                          <Link
                            href={`/workouts/${workout.id}/log`}
                            className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
                          >
                            Start
                          </Link>
                        )}
                      </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {workout.workoutExercises.slice(0, 3).map((we) => (
                        <div key={we.id}>
                          {we.exercise.name} - {we.targetSets} × {we.targetReps}
                        </div>
                      ))}
                      {workout.workoutExercises.length > 3 && (
                        <div className="text-gray-500">
                          +{workout.workoutExercises.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
                })}
              </div>
            </div>
          )
        })()}
      </div>

      {!isLocked && isExpanded && (
        <div className="bg-gray-50 p-3">
        {isLocked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-yellow-800">
              🔒 This phase is locked because workouts have been completed. You can view the structure but cannot make changes.
              To edit individual workouts, click the &quot;Start&quot; button to go to the workout page.
            </p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {templateWorkouts.map((workout) => {
            const isWorkoutCompleted = completedWorkouts.has(workout.name)
            const isWorkoutReadOnly = isLocked || isWorkoutCompleted

            return (
              <div key={workout.name} className="bg-white rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">{workout.name}</p>
                  {isWorkoutCompleted ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      ✓ Completed
                    </span>
                  ) : startWorkoutIds[workout.name] ? (
                    <Link
                      href={`/workouts/${startWorkoutIds[workout.name]}/log`}
                      className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                    >
                      Start
                    </Link>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {(slotsByWorkout[workout.name] || []).map((slot, idx) => (
                    <EditableSlotRow
                      key={idx}
                      slot={slot}
                      exercises={localExercises}
                      onChange={(updated) => !isWorkoutReadOnly && updateSlot(workout.name, idx, updated)}
                      onDelete={() => !isWorkoutReadOnly && deleteSlot(workout.name, idx)}
                      onReorder={(dir) => !isWorkoutReadOnly && reorderSlot(workout.name, idx, dir)}
                      onExerciseCreated={handleExerciseCreated}
                      readOnly={isWorkoutReadOnly}
                    />
                  ))}
                </div>
                {!isWorkoutReadOnly && (
                  <button
                    type="button"
                    onClick={() => addSlot(workout.name)}
                    className="mt-2 w-full text-xs text-primary-600 hover:text-primary-800 text-left px-1 py-0.5 hover:bg-primary-50 rounded"
                  >
                    + Add exercise
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {!isLocked && (
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
        )}

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
