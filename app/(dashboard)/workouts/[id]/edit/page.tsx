'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import {
  DndContext,
  closestCenter,
  PointerSensor,
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
  notes: string | null
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

interface SortableExerciseProps {
  exercise: WorkoutExercise
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function SortableExercise({ exercise, onEdit, onDelete }: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardBody className="py-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded text-gray-500"
            >
              ⋮⋮
            </button>

            {/* Exercise Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">{exercise.exercise.name}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [addingExercise, setAddingExercise] = useState(false)
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null)

  // Exercise form state
  const [exerciseForm, setExerciseForm] = useState({
    exerciseId: '',
    targetSets: 3,
    targetReps: '8-12',
    targetRir: 2,
    tempo: '',
    restPeriod: 90,
    notes: '',
  })

  // Apply to rest of phase modal
  const [showScopeModal, setShowScopeModal] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    async function fetchData() {
      try {
        const [workoutRes, exercisesRes] = await Promise.all([
          fetch(`/api/workouts/${params.id}`),
          fetch('/api/exercises'),
        ])

        if (workoutRes.ok) {
          const data = await workoutRes.json()
          setWorkout(data)
          setWorkoutName(data.name)
          setDayOfWeek(data.dayOfWeek)
          setEstimatedDuration(data.estimatedDuration)
          setWarmupNotes(data.warmupNotes || '')
          setExercises(data.workoutExercises.sort((a: WorkoutExercise, b: WorkoutExercise) => a.orderIndex - b.orderIndex))
        }

        if (exercisesRes.ok) {
          const exercisesData = await exercisesRes.json()
          setAllExercises(exercisesData)
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

  function handleEditExercise(exerciseId: string) {
    const ex = exercises.find((e) => e.id === exerciseId)
    if (!ex) return

    setExerciseForm({
      exerciseId: ex.exercise.id,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps || '',
      targetRir: ex.targetRir ?? 2,
      tempo: ex.tempo || '',
      restPeriod: ex.restPeriod ?? 90,
      notes: ex.notes || '',
    })
    setEditingExercise(exerciseId)
  }

  async function handleSaveExercise() {
    if (!editingExercise && !addingExercise) return

    const endpoint = editingExercise
      ? `/api/workout-exercises/${editingExercise}`
      : '/api/workout-exercises'

    const method = editingExercise ? 'PATCH' : 'POST'

    const payload: any = {
      exerciseId: exerciseForm.exerciseId,
      targetSets: exerciseForm.targetSets,
      targetReps: exerciseForm.targetReps || null,
      targetRir: exerciseForm.targetRir || null,
      tempo: exerciseForm.tempo || null,
      restPeriod: exerciseForm.restPeriod || null,
      notes: exerciseForm.notes || null,
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

      if (response.ok) {
        // Refresh workout data
        const workoutRes = await fetch(`/api/workouts/${params.id}`)
        if (workoutRes.ok) {
          const data = await workoutRes.json()
          setExercises(data.workoutExercises.sort((a: WorkoutExercise, b: WorkoutExercise) => a.orderIndex - b.orderIndex))
        }
        setEditingExercise(null)
        setAddingExercise(false)
        resetExerciseForm()
      }
    } catch (error) {
      console.error('Error saving exercise:', error)
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

  function resetExerciseForm() {
    setExerciseForm({
      exerciseId: '',
      targetSets: 3,
      targetReps: '8-12',
      targetRir: 2,
      tempo: '',
      restPeriod: 90,
      notes: '',
    })
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
        router.back()
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
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
                value={dayOfWeek !== null ? dayOfWeek.toString() : ''}
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
                {exercises.map((exercise) => (
                  <SortableExercise
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={handleEditExercise}
                    onDelete={(id) => setExerciseToDelete(id)}
                  />
                ))}
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
      {(addingExercise || editingExercise) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setAddingExercise(false)
            setEditingExercise(null)
            resetExerciseForm()
          }}
          title={editingExercise ? 'Edit Exercise' : 'Add Exercise'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
              <Select
                options={allExercises.map((ex) => ({
                  value: ex.id,
                  label: ex.name,
                }))}
                value={exerciseForm.exerciseId}
                onChange={(e) => setExerciseForm({ ...exerciseForm, exerciseId: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Sets</label>
                <input
                  type="number"
                  value={exerciseForm.targetSets}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, targetSets: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Reps</label>
                <input
                  type="text"
                  value={exerciseForm.targetReps}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, targetReps: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="8-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target RIR</label>
                <input
                  type="number"
                  value={exerciseForm.targetRir}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, targetRir: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rest Period (s)</label>
                <input
                  type="number"
                  value={exerciseForm.restPeriod}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, restPeriod: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo (optional)</label>
              <input
                type="text"
                value={exerciseForm.tempo}
                onChange={(e) => setExerciseForm({ ...exerciseForm, tempo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="3-0-1-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={exerciseForm.notes}
                onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveExercise} className="flex-1">
                {editingExercise ? 'Update' : 'Add'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setAddingExercise(false)
                  setEditingExercise(null)
                  resetExerciseForm()
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

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

      {/* Apply to Rest of Phase Modal */}
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
