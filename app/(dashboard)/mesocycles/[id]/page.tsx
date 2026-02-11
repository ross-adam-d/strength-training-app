'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Exercise {
  id: string
  name: string
  description?: string | null
  muscleGroups?: string[]
  equipment?: string[]
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
  orderIndex: number
  workoutExercises: WorkoutExercise[]
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
  goal: string | null
  trainingDaysPerWeek: number | null
  warmupNotes: string | null
  startDate: string
  endDate: string
  status: string
  macrocycle: {
    id: string
    name: string
  }
  microcycles: Microcycle[]
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MUSCLE_GROUP_OPTIONS = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'legs', label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'core', label: 'Core' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'forearms', label: 'Forearms' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance-band', label: 'Resistance Band' },
]

interface SortableWorkoutCardProps {
  id: string
  children: React.ReactNode
}

function SortableWorkoutCard({ id, children }: SortableWorkoutCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-4 cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded text-gray-500"
          onClick={(e) => e.stopPropagation()}
        >
          ⋮⋮
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

export default function MesocycleDetailPage() {
  const params = useParams()
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [addingToWorkout, setAddingToWorkout] = useState<string | null>(null)
  const [editingMesocycleWarmup, setEditingMesocycleWarmup] = useState(false)
  const [mesocycleWarmupText, setMesocycleWarmupText] = useState('')
  const [editingWorkoutWarmup, setEditingWorkoutWarmup] = useState<string | null>(null)
  const [workoutWarmupText, setWorkoutWarmupText] = useState('')
  const [confirmPinWorkout, setConfirmPinWorkout] = useState<string | null>(null)
  const [pinCount, setPinCount] = useState(0)
  const [pinDayName, setPinDayName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [exerciseForm, setExerciseForm] = useState<{
    exerciseId: string
    targetSets: number
    targetReps: string
    targetRir: number | null
    tempo: string
    restPeriod: number | null
    notes: string
  }>({
    exerciseId: '',
    targetSets: 3,
    targetReps: '8-12',
    targetRir: 2,
    tempo: '',
    restPeriod: 90,
    notes: '',
  })

  // Custom exercise creation state
  const [creatingCustomExercise, setCreatingCustomExercise] = useState(false)
  const [customExerciseName, setCustomExerciseName] = useState('')
  const [customExerciseDescription, setCustomExerciseDescription] = useState('')
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [customExerciseError, setCustomExerciseError] = useState('')
  const [isCreatingExercise, setIsCreatingExercise] = useState(false)

  async function fetchMesocycle() {
    try {
      const response = await fetch(`/api/mesocycles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMesocycle(data)
        // Expand all workouts by default
        const workoutIds = data.microcycles.flatMap((m: Microcycle) =>
          m.workouts.map((w: Workout) => w.id)
        )
        setExpandedWorkouts(new Set(workoutIds))
      }
    } catch (error) {
      console.error('Error fetching mesocycle:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchExercises() {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setAllExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  useEffect(() => {
    fetchMesocycle()
    fetchExercises()
  }, [])

  function toggleWorkout(workoutId: string) {
    const newExpanded = new Set(expandedWorkouts)
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId)
    } else {
      newExpanded.add(workoutId)
    }
    setExpandedWorkouts(newExpanded)
  }

  async function handleDayChange(workoutId: string, newDay: number) {
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: newDay }),
      })

      if (response.ok) {
        await fetchMesocycle()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update workout day')
      }
    } catch (error) {
      console.error('Error updating workout day:', error)
      alert('Failed to update workout day')
    }
  }

  async function handleSaveMesocycleWarmup() {
    try {
      const response = await fetch(`/api/mesocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warmupNotes: mesocycleWarmupText }),
      })

      if (response.ok) {
        setEditingMesocycleWarmup(false)
        await fetchMesocycle()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update warmup notes')
      }
    } catch (error) {
      console.error('Error updating warmup notes:', error)
      alert('Failed to update warmup notes')
    }
  }

  async function handleSaveWorkoutWarmup(workoutId: string) {
    setSaveError(null)
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warmupNotes: workoutWarmupText }),
      })

      if (response.ok) {
        setEditingWorkoutWarmup(null)
        await fetchMesocycle()
      } else {
        const data = await response.json()
        setSaveError(data.error || 'Failed to update workout warmup notes')
      }
    } catch (error) {
      console.error('Error updating workout warmup notes:', error)
      setSaveError('Failed to update workout warmup notes. Please try again.')
    }
  }

  function startPinWorkoutWarmup(workoutId: string) {
    if (!mesocycle) return

    // Find the current workout to get its day of week
    const currentWorkout = mesocycle.microcycles
      .flatMap(mc => mc.workouts)
      .find(w => w.id === workoutId)

    if (!currentWorkout) {
      setSaveError('Workout not found.')
      return
    }

    // Get all uncompleted workouts on the same day (excluding the current one)
    const sameDayWorkouts = mesocycle.microcycles
      .flatMap(mc => mc.workouts)
      .filter(w =>
        w.id !== workoutId &&
        w.workoutLogs.length === 0 &&
        w.dayOfWeek === currentWorkout.dayOfWeek
      )

    const dayName = currentWorkout.dayOfWeek !== null
      ? DAYS_OF_WEEK[currentWorkout.dayOfWeek]
      : 'unscheduled'

    if (sameDayWorkouts.length === 0) {
      setSaveError(`No remaining uncompleted ${dayName} workouts to pin to.`)
      return
    }

    setPinCount(sameDayWorkouts.length)
    setPinDayName(dayName)
    setConfirmPinWorkout(workoutId)
  }

  async function confirmPinWorkoutWarmup() {
    if (!mesocycle || !confirmPinWorkout) return

    setSaveError(null)
    const workoutId = confirmPinWorkout

    // Find the current workout to get its day of week
    const currentWorkout = mesocycle.microcycles
      .flatMap(mc => mc.workouts)
      .find(w => w.id === workoutId)

    if (!currentWorkout) {
      setSaveError('Workout not found.')
      return
    }

    // Get all uncompleted workouts on the same day (excluding the current one)
    const sameDayWorkouts = mesocycle.microcycles
      .flatMap(mc => mc.workouts)
      .filter(w =>
        w.id !== workoutId &&
        w.workoutLogs.length === 0 &&
        w.dayOfWeek === currentWorkout.dayOfWeek
      )

    try {
      // Update all same-day workouts with this warmup
      const updates = sameDayWorkouts.map(w =>
        fetch(`/api/workouts/${w.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warmupNotes: workoutWarmupText }),
        })
      )

      const results = await Promise.all(updates)
      const failedResults = results.filter(r => !r.ok)

      if (failedResults.length === 0) {
        setEditingWorkoutWarmup(null)
        setConfirmPinWorkout(null)
        await fetchMesocycle()
      } else {
        setSaveError(`${failedResults.length} of ${results.length} workouts failed to update. Please try again.`)
      }
    } catch (error) {
      console.error('Error pinning workout warmup:', error)
      setSaveError('Failed to pin warmup notes. Please try again.')
    }
  }

  function startAddExercise(workoutId: string) {
    setAddingToWorkout(workoutId)
    setExerciseForm({
      exerciseId: '',
      targetSets: 3,
      targetReps: '8-12',
      targetRir: 2,
      tempo: '',
      restPeriod: 90,
      notes: '',
    })
    resetCustomExerciseForm()
  }

  function resetCustomExerciseForm() {
    setCreatingCustomExercise(false)
    setCustomExerciseName('')
    setCustomExerciseDescription('')
    setSelectedMuscleGroups([])
    setSelectedEquipment([])
    setCustomExerciseError('')
    setIsCreatingExercise(false)
  }

  function toggleMuscleGroup(value: string) {
    setSelectedMuscleGroups((prev) =>
      prev.includes(value)
        ? prev.filter((m) => m !== value)
        : [...prev, value]
    )
    setCustomExerciseError('')
  }

  function toggleEquipment(value: string) {
    setSelectedEquipment((prev) =>
      prev.includes(value)
        ? prev.filter((e) => e !== value)
        : [...prev, value]
    )
    setCustomExerciseError('')
  }

  function handleExerciseSelectChange(value: string) {
    if (value === '__CREATE_CUSTOM__') {
      setCreatingCustomExercise(true)
      setExerciseForm({ ...exerciseForm, exerciseId: '' })
    } else {
      setCreatingCustomExercise(false)
      setExerciseForm({ ...exerciseForm, exerciseId: value })
    }
  }

  async function handleCreateCustomExercise() {
    setCustomExerciseError('')

    // Validation
    if (!customExerciseName.trim()) {
      setCustomExerciseError('Exercise name is required')
      return
    }

    if (selectedMuscleGroups.length === 0) {
      setCustomExerciseError('Please select at least one muscle group')
      return
    }

    if (selectedEquipment.length === 0) {
      setCustomExerciseError('Please select at least one equipment type')
      return
    }

    setIsCreatingExercise(true)

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customExerciseName.trim(),
          description: customExerciseDescription.trim() || undefined,
          muscleGroups: selectedMuscleGroups,
          equipment: selectedEquipment,
          videoUrl: '',
          imageUrl: '',
          isPublic: false,
        }),
      })

      if (response.ok) {
        const newExercise = await response.json()

        // Refresh exercises list
        await fetchExercises()

        // Auto-select the newly created exercise
        setExerciseForm({ ...exerciseForm, exerciseId: newExercise.id })

        // Reset custom exercise form
        resetCustomExerciseForm()
      } else {
        const errorData = await response.json()
        setCustomExerciseError(errorData.error || 'Failed to create exercise')
      }
    } catch (error) {
      console.error('Error creating custom exercise:', error)
      setCustomExerciseError('An unexpected error occurred')
    } finally {
      setIsCreatingExercise(false)
    }
  }

  async function handleAddExercise(workoutId: string) {
    if (!exerciseForm.exerciseId) {
      alert('Please select an exercise')
      return
    }

    try {
      const response = await fetch('/api/workout-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId,
          ...exerciseForm,
        }),
      })

      if (response.ok) {
        setAddingToWorkout(null)
        await fetchMesocycle()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add exercise')
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Failed to add exercise')
    }
  }

  function startEditExercise(we: WorkoutExercise) {
    setEditingExercise(we.id)
    setExerciseForm({
      exerciseId: we.exercise.id,
      targetSets: we.targetSets,
      targetReps: we.targetReps || '8-12',
      targetRir: we.targetRir ?? 2,
      tempo: we.tempo || '',
      restPeriod: we.restPeriod || 90,
      notes: we.notes || '',
    })
  }

  async function handleUpdateExercise(exerciseId: string) {
    try {
      const response = await fetch(`/api/workout-exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exerciseForm.exerciseId,
          targetSets: exerciseForm.targetSets,
          targetReps: exerciseForm.targetReps || null,
          targetRir: exerciseForm.targetRir ?? null,
          tempo: exerciseForm.tempo || null,
          restPeriod: exerciseForm.restPeriod ?? null,
          notes: exerciseForm.notes || null,
        }),
      })

      if (response.ok) {
        setEditingExercise(null)
        await fetchMesocycle()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update exercise')
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
      alert('Failed to update exercise')
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    if (!confirm('Are you sure you want to remove this exercise?')) {
      return
    }

    try {
      const response = await fetch(`/api/workout-exercises/${exerciseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchMesocycle()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete exercise')
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Failed to delete exercise')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      // Press delay of 250ms for better touch scrolling
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleWorkoutDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id || !mesocycle) return

    const activeWorkout = currentMicrocycle?.workouts.find(w => w.id === active.id)
    const overWorkout = currentMicrocycle?.workouts.find(w => w.id === over.id)

    if (!activeWorkout || !overWorkout) return

    const oldIndex = currentMicrocycle.workouts.findIndex(w => w.id === active.id)
    const newIndex = currentMicrocycle.workouts.findIndex(w => w.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Optimistically update UI
    const reorderedWorkouts = arrayMove(currentMicrocycle.workouts, oldIndex, newIndex)

    // Update orderIndex for all affected workouts
    const updates = reorderedWorkouts.map((workout, index) => ({
      id: workout.id,
      orderIndex: index,
    }))

    try {
      const response = await fetch(`/api/microcycles/${currentMicrocycle.id}/reorder-workouts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workouts: updates }),
      })

      if (response.ok) {
        await fetchMesocycle()
      } else {
        const data = await response.json()
        setSaveError(data.error || 'Failed to reorder workouts')
      }
    } catch (error) {
      console.error('Error reordering workouts:', error)
      setSaveError('Failed to reorder workouts. Please try again.')
    }
  }

  async function handleMoveExercise(exerciseId: string, direction: 'up' | 'down', exercises: WorkoutExercise[]) {
    const currentIndex = exercises.findIndex(e => e.id === exerciseId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= exercises.length) return

    const currentExercise = exercises[currentIndex]
    const targetExercise = exercises[targetIndex]

    try {
      // Swap orderIndex values
      await Promise.all([
        fetch(`/api/workout-exercises/${currentExercise.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: targetExercise.orderIndex }),
        }),
        fetch(`/api/workout-exercises/${targetExercise.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: currentExercise.orderIndex }),
        }),
      ])

      await fetchMesocycle()
    } catch (error) {
      console.error('Error reordering exercises:', error)
      alert('Failed to reorder exercises')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!mesocycle) {
    return <div className="text-center py-8">Phase not found</div>
  }

  const currentMicrocycle = mesocycle.microcycles[selectedWeek]

  return (
    <div className="pb-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          href={`/macrocycles/${mesocycle.macrocycle.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          ← Back to {mesocycle.macrocycle.name}
        </Link>
      </div>

      {/* Phase Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{mesocycle.name}</h1>
        <p className="text-gray-600 mt-1">
          {new Date(mesocycle.startDate).toLocaleDateString()} – {new Date(mesocycle.endDate).toLocaleDateString()}
        </p>
        {mesocycle.goal && (
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Goal:</span> {mesocycle.goal}
            {mesocycle.trainingDaysPerWeek && (
              <span className="ml-4">
                <span className="font-medium">Training:</span> {mesocycle.trainingDaysPerWeek} days/week
              </span>
            )}
          </p>
        )}

        {/* Phase-wide Warmup Section */}
        <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Phase Warmup Routine</h3>
            {mesocycle.status === 'planned' && !editingMesocycleWarmup && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingMesocycleWarmup(true)
                  setMesocycleWarmupText(mesocycle.warmupNotes || '')
                }}
              >
                {mesocycle.warmupNotes ? 'Edit' : 'Add'}
              </Button>
            )}
          </div>
          {editingMesocycleWarmup ? (
            <div className="space-y-2">
              <textarea
                className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg text-sm placeholder-gray-400"
                rows={3}
                placeholder="Describe the warmup routine for this phase..."
                value={mesocycleWarmupText}
                onChange={(e) => setMesocycleWarmupText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveMesocycleWarmup}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingMesocycleWarmup(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300">
              {mesocycle.warmupNotes || 'No warmup routine specified for this phase.'}
            </p>
          )}
        </div>
      </div>

      {/* Horizontal Week Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {mesocycle.microcycles.map((micro, index) => (
            <button
              key={micro.id}
              onClick={() => setSelectedWeek(index)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-lg font-medium transition
                ${selectedWeek === index
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Week {micro.weekNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Week Info */}
      {currentMicrocycle && (
        <div className="mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Week {currentMicrocycle.weekNumber}: {currentMicrocycle.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(currentMicrocycle.startDate).toLocaleDateString()} – {new Date(currentMicrocycle.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {currentMicrocycle.workouts.length} workout{currentMicrocycle.workouts.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Workouts for Selected Week */}
      {currentMicrocycle && (
        <div className="space-y-4">
          {currentMicrocycle.workouts.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-gray-600">
                  No workouts scheduled for this week
                </div>
              </CardBody>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleWorkoutDragEnd}
            >
              <SortableContext
                items={currentMicrocycle.workouts.map(w => w.id)}
                strategy={verticalListSortingStrategy}
              >
                {currentMicrocycle.workouts
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((workout) => {
                const isExpanded = expandedWorkouts.has(workout.id)
                const isCompleted = workout.workoutLogs.length > 0
                const lastLog = isCompleted ? workout.workoutLogs[0] : null

                return (
                  <SortableWorkoutCard key={workout.id} id={workout.id}>
                    <Card>
                    <CardBody>
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleWorkout(workout.id)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-xl">{isExpanded ? '▼' : '▶'}</span>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Week {currentMicrocycle.weekNumber} - {workout.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <span className="text-sm text-gray-600">Day:</span>
                                <Select
                                  options={[
                                    { value: '', label: 'Not scheduled' },
                                    ...DAYS_OF_WEEK.map((day, index) => ({
                                      value: index.toString(),
                                      label: day,
                                    })),
                                  ]}
                                  value={workout.dayOfWeek !== null ? workout.dayOfWeek.toString() : ''}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    handleDayChange(workout.id, value === '' ? -1 : parseInt(value))
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              {workout.estimatedDuration && (
                                <span className="text-sm text-gray-600">
                                  {workout.estimatedDuration} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              ✓ Completed
                            </span>
                          )}
                          {!isCompleted && (
                            <Link href={`/workouts/${workout.id}/log`}>
                              <Button size="sm" onClick={(e) => e.stopPropagation()}>
                                Log Workout
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t">
                          {/* Workout-specific Warmup */}
                          <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-white">Workout Warmup</h4>
                              {!isCompleted && editingWorkoutWarmup !== workout.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingWorkoutWarmup(workout.id)
                                    setWorkoutWarmupText(workout.warmupNotes || '')
                                  }}
                                >
                                  {workout.warmupNotes ? 'Edit' : 'Add'}
                                </Button>
                              )}
                            </div>
                            {editingWorkoutWarmup === workout.id ? (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                <textarea
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg text-sm placeholder-gray-400"
                                  rows={2}
                                  placeholder="Specific warmup for this workout..."
                                  value={workoutWarmupText}
                                  onChange={(e) => setWorkoutWarmupText(e.target.value)}
                                />
                                {saveError && (
                                  <div className="p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                                    {saveError}
                                  </div>
                                )}
                                {confirmPinWorkout === workout.id ? (
                                  <div className="p-3 bg-blue-900 border border-blue-700 rounded">
                                    <p className="text-sm text-white mb-2">
                                      Pin this warmup to {pinCount} remaining {pinDayName} workout(s)?
                                    </p>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={confirmPinWorkoutWarmup}>
                                        Confirm
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setConfirmPinWorkout(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button size="sm" onClick={() => handleSaveWorkoutWarmup(workout.id)}>
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => startPinWorkoutWarmup(workout.id)}
                                    >
                                      📌 Pin to Remaining Workouts
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => {
                                        setEditingWorkoutWarmup(null)
                                        setSaveError(null)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-300">
                                {workout.warmupNotes || 'Use phase warmup routine or add workout-specific warmup.'}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Exercises</h4>
                            {!isCompleted && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startAddExercise(workout.id)
                                }}
                              >
                                + Add Exercise
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {workout.workoutExercises
                              .sort((a, b) => a.orderIndex - b.orderIndex)
                              .map((we, index) => (
                                <div key={we.id}>
                                  {editingExercise === we.id ? (
                                    <div className="p-3 bg-blue-50 rounded-lg space-y-3" onClick={(e) => e.stopPropagation()}>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Exercise
                                        </label>
                                        <Select
                                          options={[
                                            { value: '__CREATE_CUSTOM__', label: '➕ Create Custom Exercise...' },
                                            ...allExercises.map((ex) => ({
                                              value: ex.id,
                                              label: ex.name,
                                            }))
                                          ]}
                                          value={creatingCustomExercise ? '__CREATE_CUSTOM__' : exerciseForm.exerciseId}
                                          onChange={(e) => handleExerciseSelectChange(e.target.value)}
                                        />
                                      </div>

                                      {creatingCustomExercise && (
                                        <div className="p-3 bg-gray-50 border-2 border-gray-400 rounded-lg space-y-3">
                                          <h6 className="text-sm font-semibold text-gray-900">Create Custom Exercise</h6>

                                          {customExerciseError && (
                                            <div className="p-2 bg-red-50 border border-red-200 rounded">
                                              <p className="text-xs text-red-600">{customExerciseError}</p>
                                            </div>
                                          )}

                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Exercise Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                              type="text"
                                              className="w-full px-2 py-1.5 text-sm border-2 border-gray-400 rounded bg-white"
                                              placeholder="e.g., Barbell Bench Press"
                                              value={customExerciseName}
                                              onChange={(e) => {
                                                setCustomExerciseName(e.target.value)
                                                setCustomExerciseError('')
                                              }}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Description (optional)
                                            </label>
                                            <textarea
                                              className="w-full px-2 py-1.5 text-sm border-2 border-gray-400 rounded bg-white"
                                              rows={2}
                                              placeholder="Describe the exercise..."
                                              value={customExerciseDescription}
                                              onChange={(e) => setCustomExerciseDescription(e.target.value)}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Muscle Groups <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-1 p-2 border-2 border-gray-400 rounded max-h-32 overflow-y-auto bg-gray-100">
                                              {MUSCLE_GROUP_OPTIONS.map((option) => (
                                                <label
                                                  key={option.value}
                                                  className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-200 p-1 rounded text-xs"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedMuscleGroups.includes(option.value)}
                                                    onChange={() => toggleMuscleGroup(option.value)}
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                  />
                                                  <span className="text-gray-700">{option.label}</span>
                                                </label>
                                              ))}
                                            </div>
                                            {selectedMuscleGroups.length > 0 && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                Selected: {selectedMuscleGroups.join(', ')}
                                              </p>
                                            )}
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Equipment <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-1 p-2 border-2 border-gray-400 rounded max-h-32 overflow-y-auto bg-gray-100">
                                              {EQUIPMENT_OPTIONS.map((option) => (
                                                <label
                                                  key={option.value}
                                                  className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-200 p-1 rounded text-xs"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedEquipment.includes(option.value)}
                                                    onChange={() => toggleEquipment(option.value)}
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                  />
                                                  <span className="text-gray-700">{option.label}</span>
                                                </label>
                                              ))}
                                            </div>
                                            {selectedEquipment.length > 0 && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                Selected: {selectedEquipment.join(', ')}
                                              </p>
                                            )}
                                          </div>

                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              onClick={handleCreateCustomExercise}
                                              disabled={isCreatingExercise}
                                            >
                                              {isCreatingExercise ? 'Creating...' : 'Create & Use Exercise'}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              onClick={resetCustomExerciseForm}
                                              disabled={isCreatingExercise}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {!creatingCustomExercise && exerciseForm.exerciseId && (
                                      <>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sets
                                          </label>
                                          <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            value={exerciseForm.targetSets}
                                            onChange={(e) =>
                                              setExerciseForm({
                                                ...exerciseForm,
                                                targetSets: parseInt(e.target.value) || 0,
                                              })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reps
                                          </label>
                                          <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="e.g. 8-12"
                                            value={exerciseForm.targetReps}
                                            onChange={(e) =>
                                              setExerciseForm({ ...exerciseForm, targetReps: e.target.value })
                                            }
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            RIR
                                          </label>
                                          <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            value={exerciseForm.targetRir ?? ''}
                                            onChange={(e) =>
                                              setExerciseForm({
                                                ...exerciseForm,
                                                targetRir: e.target.value ? parseInt(e.target.value) : null,
                                              })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tempo
                                          </label>
                                          <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="3010"
                                            value={exerciseForm.tempo}
                                            onChange={(e) =>
                                              setExerciseForm({ ...exerciseForm, tempo: e.target.value })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rest (s)
                                          </label>
                                          <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            value={exerciseForm.restPeriod ?? ''}
                                            onChange={(e) =>
                                              setExerciseForm({
                                                ...exerciseForm,
                                                restPeriod: e.target.value ? parseInt(e.target.value) : null,
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Notes
                                        </label>
                                        <textarea
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                          rows={2}
                                          value={exerciseForm.notes}
                                          onChange={(e) =>
                                            setExerciseForm({ ...exerciseForm, notes: e.target.value })
                                          }
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateExercise(we.id)}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => setEditingExercise(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                      </>)}
                                    </div>
                                  ) : (
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                      <span className="text-sm font-medium text-gray-500 w-6">
                                        {index + 1}.
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{we.exercise.name}</p>
                                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                                          {we.targetSets && <span>{we.targetSets} sets</span>}
                                          {we.targetReps && <span>{we.targetReps} reps</span>}
                                          {we.targetRir !== null && <span>RIR {we.targetRir}</span>}
                                          {we.tempo && <span>Tempo: {we.tempo}</span>}
                                          {we.restPeriod && <span>Rest: {we.restPeriod}s</span>}
                                        </div>
                                        {we.notes && (
                                          <p className="text-sm text-gray-600 mt-1 italic">{we.notes}</p>
                                        )}
                                      </div>
                                      {!isCompleted && (
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                          <div className="flex flex-col gap-0.5">
                                            <button
                                              className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                              onClick={() => handleMoveExercise(we.id, 'up', workout.workoutExercises)}
                                              disabled={index === 0}
                                              title="Move up"
                                            >
                                              ⬆️
                                            </button>
                                            <button
                                              className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                              onClick={() => handleMoveExercise(we.id, 'down', workout.workoutExercises)}
                                              disabled={index === workout.workoutExercises.length - 1}
                                              title="Move down"
                                            >
                                              ⬇️
                                            </button>
                                          </div>
                                          <button
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            onClick={() => startEditExercise(we)}
                                            title="Edit exercise"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            onClick={() => handleDeleteExercise(we.id)}
                                            title="Remove exercise"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            {addingToWorkout === workout.id && (
                              <div className="p-3 bg-green-50 rounded-lg space-y-3" onClick={(e) => e.stopPropagation()}>
                                <h5 className="font-medium text-gray-900">Add Exercise</h5>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Exercise
                                  </label>
                                  <Select
                                    options={[
                                      { value: '__CREATE_CUSTOM__', label: '➕ Create Custom Exercise...' },
                                      ...allExercises.map((ex) => ({
                                        value: ex.id,
                                        label: ex.name,
                                      }))
                                    ]}
                                    value={creatingCustomExercise ? '__CREATE_CUSTOM__' : exerciseForm.exerciseId}
                                    onChange={(e) => handleExerciseSelectChange(e.target.value)}
                                  />
                                </div>

                                {creatingCustomExercise && (
                                  <div className="p-3 bg-gray-50 border-2 border-gray-400 rounded-lg space-y-3">
                                    <h6 className="text-sm font-semibold text-gray-900">Create Custom Exercise</h6>

                                    {customExerciseError && (
                                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                                        <p className="text-xs text-red-600">{customExerciseError}</p>
                                      </div>
                                    )}

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Exercise Name <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        className="w-full px-2 py-1.5 text-sm border-2 border-gray-400 rounded bg-white"
                                        placeholder="e.g., Barbell Bench Press"
                                        value={customExerciseName}
                                        onChange={(e) => {
                                          setCustomExerciseName(e.target.value)
                                          setCustomExerciseError('')
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Description (optional)
                                      </label>
                                      <textarea
                                        className="w-full px-2 py-1.5 text-sm border-2 border-gray-400 rounded bg-white"
                                        rows={2}
                                        placeholder="Describe the exercise..."
                                        value={customExerciseDescription}
                                        onChange={(e) => setCustomExerciseDescription(e.target.value)}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Muscle Groups <span className="text-red-500">*</span>
                                      </label>
                                      <div className="grid grid-cols-2 gap-1 p-2 border-2 border-gray-400 rounded max-h-32 overflow-y-auto bg-gray-100">
                                        {MUSCLE_GROUP_OPTIONS.map((option) => (
                                          <label
                                            key={option.value}
                                            className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-200 p-1 rounded text-xs"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={selectedMuscleGroups.includes(option.value)}
                                              onChange={() => toggleMuscleGroup(option.value)}
                                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-gray-700">{option.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                      {selectedMuscleGroups.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Selected: {selectedMuscleGroups.join(', ')}
                                        </p>
                                      )}
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Equipment <span className="text-red-500">*</span>
                                      </label>
                                      <div className="grid grid-cols-2 gap-1 p-2 border-2 border-gray-400 rounded max-h-32 overflow-y-auto bg-gray-100">
                                        {EQUIPMENT_OPTIONS.map((option) => (
                                          <label
                                            key={option.value}
                                            className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-200 p-1 rounded text-xs"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={selectedEquipment.includes(option.value)}
                                              onChange={() => toggleEquipment(option.value)}
                                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-gray-700">{option.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                      {selectedEquipment.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Selected: {selectedEquipment.join(', ')}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={handleCreateCustomExercise}
                                        disabled={isCreatingExercise}
                                      >
                                        {isCreatingExercise ? 'Creating...' : 'Create & Use Exercise'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={resetCustomExerciseForm}
                                        disabled={isCreatingExercise}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {!creatingCustomExercise && exerciseForm.exerciseId && (
                                  <>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Sets
                                    </label>
                                    <input
                                      type="number"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                      value={exerciseForm.targetSets}
                                      onChange={(e) =>
                                        setExerciseForm({
                                          ...exerciseForm,
                                          targetSets: parseInt(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Reps
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                      placeholder="e.g. 8-12"
                                      value={exerciseForm.targetReps}
                                      onChange={(e) =>
                                        setExerciseForm({ ...exerciseForm, targetReps: e.target.value })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      RIR
                                    </label>
                                    <input
                                      type="number"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                      value={exerciseForm.targetRir ?? ''}
                                      onChange={(e) =>
                                        setExerciseForm({
                                          ...exerciseForm,
                                          targetRir: e.target.value ? parseInt(e.target.value) : null,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Tempo
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                      placeholder="3010"
                                      value={exerciseForm.tempo}
                                      onChange={(e) =>
                                        setExerciseForm({ ...exerciseForm, tempo: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Rest (s)
                                    </label>
                                    <input
                                      type="number"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                      value={exerciseForm.restPeriod ?? ''}
                                      onChange={(e) =>
                                        setExerciseForm({
                                          ...exerciseForm,
                                          restPeriod: e.target.value ? parseInt(e.target.value) : null,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                  </label>
                                  <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    rows={2}
                                    value={exerciseForm.notes}
                                    onChange={(e) =>
                                      setExerciseForm({ ...exerciseForm, notes: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddExercise(workout.id)}
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setAddingToWorkout(null)
                                      resetCustomExerciseForm()
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                </>
                                )}
                              </div>
                            )}
                          </div>
                          {isCompleted && lastLog && (
                            <div className="mt-4 pt-4 border-t">
                              <Link href={`/workout-logs/${lastLog.id}`}>
                                <Button variant="secondary" size="sm">
                                  View Workout Log
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                  </SortableWorkoutCard>
                )
              })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  )
}
