'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { ExercisePickerModal, ExercisePickerResult, ExercisePickerInitialValues } from '@/components/ExercisePickerModal'
import { SetTarget, formatSetTargets } from '@/lib/setTargets'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Exercise {
  id: string
  name: string
  description?: string
}

interface WorkoutExercise {
  id: string
  orderIndex: number
  targetSets: number
  targetReps: string | null
  targetRir: number | null
  tempo: string | null
  restPeriod: number | null
  supersetWithPrevious: boolean
  notes: string | null
  setTargets: SetTarget[] | null
  exercise: Exercise
}

interface Workout {
  id: string
  name: string
  dayOfWeek: number | null
  estimatedDuration: number | null
  warmupNotes: string | null
  microcycle: {
    id: string
    weekNumber: number
    mesocycle: {
      id: string
      name: string
      macrocycle: {
        id: string
        name: string
      }
    }
  }
  workoutExercises: WorkoutExercise[]
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Calculate superset groups: returns Map of exercise.id -> group number (1, 2, 3...) or null
function calculateSupersetGroups(exercises: WorkoutExercise[]): Map<string, number | null> {
  const groups = new Map<string, number | null>()
  let currentGroup = 0
  let inSuperset = false

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    const nextEx = exercises[i + 1]

    if (ex.supersetWithPrevious) {
      // This exercise is part of a superset
      if (!inSuperset) {
        // Start a new superset group
        currentGroup++
        // Mark the previous exercise as part of this group too
        if (i > 0) {
          groups.set(exercises[i - 1].id, currentGroup)
        }
      }
      groups.set(ex.id, currentGroup)
      inSuperset = true
    } else {
      // Not in a superset
      if (!inSuperset) {
        groups.set(ex.id, null)
      } else {
        // Previous exercise(s) were in a superset, but this one isn't
        groups.set(ex.id, null)
        inSuperset = false
      }
    }

    // Check if next exercise continues the superset
    if (inSuperset && (!nextEx || !nextEx.supersetWithPrevious)) {
      inSuperset = false
    }
  }

  return groups
}

interface SortableExerciseProps {
  exercise: WorkoutExercise
  supersetGroup: number | null  // SS1, SS2, etc. or null if not in superset
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
}

function SortableExercise({ exercise, supersetGroup, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isInSuperset = supersetGroup !== null

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isInSuperset ? 'border-l-4 border-l-primary-500 bg-primary-50' : ''}>
        <CardBody className="py-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle + Arrow Buttons */}
            <div className="flex flex-col items-center mt-1 gap-0">
              <button
                onClick={() => onMoveUp(exercise.id)}
                disabled={isFirst}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded transition-colors leading-none"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                ⋮⋮
              </button>
              <button
                onClick={() => onMoveDown(exercise.id)}
                disabled={isLast}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded transition-colors leading-none"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            {/* Exercise Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{exercise.exercise.name}</h3>
                {isInSuperset && (
                  <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded">
                    SS{supersetGroup}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {exercise.setTargets && exercise.setTargets.length > 0 ? (
                  <div className="col-span-2">
                    <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded mr-1.5">Prescribed</span>
                    <span className="text-gray-700 text-xs">{formatSetTargets(exercise.setTargets, 'kg')}</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-600">Sets:</span>{' '}
                      <span className="font-medium">{exercise.targetSets}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reps:</span>{' '}
                      <span className="font-medium">{exercise.targetReps || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">RIR:</span>{' '}
                      <span className="font-medium">{exercise.targetRir ?? 'N/A'}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-600">Rest:</span>{' '}
                  <span className="font-medium">{exercise.restPeriod ? `${exercise.restPeriod}s` : 'N/A'}</span>
                </div>
                {exercise.tempo && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Tempo:</span>{' '}
                    <span className="font-medium">{exercise.tempo}</span>
                  </div>
                )}
                {exercise.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notes:</span>{' '}
                    <span className="font-medium">{exercise.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <Button size="sm" variant="secondary" onClick={() => onEdit(exercise.id)} className="flex-1">
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(exercise.id)} className="flex-1">
              Delete
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default function EditWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Workout metadata
  const [workoutName, setWorkoutName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null)
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null)
  const [warmupNotes, setWarmupNotes] = useState('')

  // Exercise management
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [addingExercise, setAddingExercise] = useState(false)
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null)
  const [pickerInitialValues, setPickerInitialValues] = useState<ExercisePickerInitialValues | undefined>()

  // Apply to rest of phase modal (workout-level only)
  const [showScopeModal, setShowScopeModal] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    setLoading(true)
    setExercises([])
    async function fetchData() {
      try {
        const workoutRes = await fetch(`/api/workouts/${params.id}`)

        if (workoutRes.ok) {
          const data = await workoutRes.json()
          setWorkout(data)
          setWorkoutName(data.name)
          setDayOfWeek(data.dayOfWeek ?? null)
          setEstimatedDuration(data.estimatedDuration ?? null)
          setWarmupNotes(data.warmupNotes || '')
          setExercises(data.workoutExercises.sort((a: WorkoutExercise, b: WorkoutExercise) => a.orderIndex - b.orderIndex))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = exercises.findIndex((e) => e.id === active.id)
    const newIndex = exercises.findIndex((e) => e.id === over.id)

    const reordered = arrayMove(exercises, oldIndex, newIndex)
    setExercises(reordered)

    // Update orderIndex in database
    try {
      await Promise.all(
        reordered.map((ex, index) =>
          fetch(`/api/workout-exercises/${ex.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIndex: index }),
          })
        )
      )
    } catch (error) {
      console.error('Error reordering exercises:', error)
    }
  }

  async function handleMoveExercise(exerciseId: string, direction: 'up' | 'down') {
    const idx = exercises.findIndex((e) => e.id === exerciseId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === exercises.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const reordered = [...exercises]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]
    setExercises(reordered)
    try {
      await Promise.all(
        reordered.map((ex, index) =>
          fetch(`/api/workout-exercises/${ex.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIndex: index }),
          })
        )
      )
    } catch (error) {
      console.error('Error reordering exercises:', error)
    }
  }

  function handleEditExercise(exerciseId: string) {
    const ex = exercises.find((e) => e.id === exerciseId)
    if (!ex) return
    setPickerInitialValues({
      exerciseId: ex.exercise.id,
      targetSets: String(ex.targetSets),
      targetReps: ex.targetReps || '',
      targetRir: ex.targetRir !== null ? String(ex.targetRir) : '2',
      tempo: ex.tempo || '',
      restPeriod: ex.restPeriod !== null ? String(ex.restPeriod) : '90',
      supersetWithPrevious: ex.supersetWithPrevious,
      notes: ex.notes || '',
      setTargets: ex.setTargets ?? null,
    })
    setEditingExercise(exerciseId)
  }

  async function performExerciseSave(result: ExercisePickerResult) {
    setSaving(true)

    const endpoint = editingExercise
      ? `/api/workout-exercises/${editingExercise}`
      : '/api/workout-exercises'
    const method = editingExercise ? 'PATCH' : 'POST'

    const payload: any = {
      exerciseId: result.exercise.id,
      targetSets: result.targetSets,
      targetReps: result.targetReps || null,
      targetRir: result.targetRir,
      tempo: result.tempo || null,
      restPeriod: result.restPeriod,
      supersetWithPrevious: result.supersetWithPrevious,
      notes: result.notes || null,
      setTargets: result.setTargets ?? null,
    }

    if (!editingExercise) {
      payload.workoutId = params.id
      payload.orderIndex = exercises.length
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Failed to save exercise')
        setSaving(false)
        return
      }

      const savedData = await response.json()

      if (editingExercise) {
        setExercises((prev) =>
          prev.map((ex) =>
            ex.id === editingExercise
              ? {
                  ...ex,
                  exercise: { id: savedData.exercise.id, name: savedData.exercise.name },
                  targetSets: savedData.targetSets,
                  targetReps: savedData.targetReps ?? null,
                  targetRir: savedData.targetRir ?? null,
                  tempo: savedData.tempo ?? null,
                  restPeriod: savedData.restPeriod ?? null,
                  supersetWithPrevious: savedData.supersetWithPrevious,
                  notes: savedData.notes ?? null,
                  setTargets: (savedData.setTargets ?? null) as SetTarget[] | null,
                }
              : ex
          )
        )
      } else {
        setExercises((prev) => [
          ...prev,
          {
            id: savedData.id,
            orderIndex: prev.length,
            targetSets: savedData.targetSets,
            targetReps: savedData.targetReps ?? null,
            targetRir: savedData.targetRir ?? null,
            tempo: savedData.tempo ?? null,
            restPeriod: savedData.restPeriod ?? null,
            supersetWithPrevious: savedData.supersetWithPrevious,
            notes: savedData.notes ?? null,
            setTargets: (savedData.setTargets ?? null) as SetTarget[] | null,
            exercise: { id: savedData.exercise.id, name: savedData.exercise.name },
          },
        ])
      }
      setEditingExercise(null)
      setAddingExercise(false)
      setPickerInitialValues(undefined)
      setSaving(false)
    } catch (error) {
      console.error('Error saving exercise:', error)
      alert('Network error. Please try again.')
      setSaving(false)
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    try {
      const response = await fetch(`/api/workout-exercises/${exerciseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExercises(exercises.filter((e) => e.id !== exerciseId))
        setExerciseToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
    }
  }

  async function handleSave(applyToRest: boolean) {
    setSaving(true)

    try {
      const payload: any = {
        name: workoutName,
        dayOfWeek: dayOfWeek === null ? null : dayOfWeek,
        estimatedDuration,
        warmupNotes: warmupNotes || null,
      }

      if (applyToRest) {
        payload.applyToRestOfPhase = true
      }

      const response = await fetch(`/api/workouts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Navigate back to the correct week in phase overview
        if (workout) {
          const weekIndex = workout.microcycle.weekNumber - 1
          router.push(`/mesocycles/${workout.microcycle.mesocycle.id}?week=${weekIndex}`)
        } else {
          router.back()
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save workout')
      }
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Failed to save workout')
    } finally {
      setSaving(false)
      setShowScopeModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        {/* Header Skeleton */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-9 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6 animate-pulse">
          {/* Workout Details Card Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Exercises Section Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-9 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Exercise Cards Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-8 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-48"></div>
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-5 bg-gray-100 rounded w-full"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <div className="h-9 bg-gray-200 rounded flex-1"></div>
                    <div className="h-9 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Workout not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <Link
            href={`/mesocycles/${workout.microcycle.mesocycle.id}?week=${workout.microcycle.weekNumber - 1}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Edit Workout</h1>
          <Button size="sm" onClick={() => setShowScopeModal(true)} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Workout Metadata */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Workout Details</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
              <Select
                options={[
                  { value: '', label: 'Not scheduled' },
                  ...DAYS_OF_WEEK.map((day, index) => ({
                    value: index.toString(),
                    label: day,
                  })),
                ]}
                value={dayOfWeek != null ? dayOfWeek.toString() : ''}
                onChange={(e) => {
                  const value = e.target.value
                  setDayOfWeek(value === '' ? null : parseInt(value))
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (minutes)</label>
              <input
                type="number"
                value={estimatedDuration || ''}
                onChange={(e) => setEstimatedDuration(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warmup Notes</label>
              <textarea
                value={warmupNotes}
                onChange={(e) => setWarmupNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe the warmup routine..."
              />
            </div>
          </CardBody>
        </Card>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
            <Button size="sm" onClick={() => setAddingExercise(true)}>
              + Add Exercise
            </Button>
          </div>

          {/* Drag-and-drop exercise list */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {(() => {
                  const supersetGroups = calculateSupersetGroups(exercises)
                  return exercises.map((exercise, index) => (
                    <SortableExercise
                      key={exercise.id}
                      exercise={exercise}
                      supersetGroup={supersetGroups.get(exercise.id) ?? null}
                      onEdit={handleEditExercise}
                      onDelete={(id) => setExerciseToDelete(id)}
                      onMoveUp={(id) => handleMoveExercise(id, 'up')}
                      onMoveDown={(id) => handleMoveExercise(id, 'down')}
                      isFirst={index === 0}
                      isLast={index === exercises.length - 1}
                    />
                  ))
                })()}
              </div>
            </SortableContext>
          </DndContext>

          {exercises.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No exercises added yet</p>
              <p className="text-sm mt-1">Click &quot;Add Exercise&quot; to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Exercise Modal */}
      <ExercisePickerModal
        open={addingExercise || editingExercise !== null}
        onClose={() => { setAddingExercise(false); setEditingExercise(null); setPickerInitialValues(undefined) }}
        onAdd={performExerciseSave}
        mode="plan"
        existingExerciseIds={exercises.filter(e => e.id !== editingExercise).map(e => e.exercise.id)}
        initialValues={pickerInitialValues}
        addLabel={editingExercise ? 'Update' : 'Add'}
      />

      {/* Delete Confirmation Modal */}
      {exerciseToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setExerciseToDelete(null)}
          title="Delete Exercise?"
        >
          <p className="text-gray-600 mb-4">
            Are you sure you want to remove this exercise from the workout?
          </p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => handleDeleteExercise(exerciseToDelete)} className="flex-1">
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setExerciseToDelete(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </Modal>
      )}

      {/* Apply to Rest of Phase Modal (Workout-level) */}
      {showScopeModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowScopeModal(false)}
          title="Save Changes"
        >
          <p className="text-gray-700 mb-4">
            Do you want these changes to apply to <strong>{workoutName}</strong> for the remainder of the phase?
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => handleSave(true)} className="w-full">
              Yes - Apply to All Remaining
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)} className="w-full">
              No - This Week Only
            </Button>
            <Button variant="ghost" onClick={() => setShowScopeModal(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </Modal>
      )}


    </div>
  )
}
