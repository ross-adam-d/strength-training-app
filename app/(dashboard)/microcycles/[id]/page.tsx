'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface WorkoutExercise {
  id: string
  orderIndex: number
  targetSets: number
  targetReps: string
  targetRpe?: number
  exercise: {
    id: string
    name: string
  }
}

interface Workout {
  id: string
  name: string
  description?: string
  dayOfWeek?: number
  estimatedDuration?: number
  workoutExercises: WorkoutExercise[]
  workoutLogs: {
    id: string
    completedAt: string
    exerciseLogs: {
      exerciseId: string
      exercise: { id: string; name: string }
      setNumber: number
      reps: number
      weight: number
      skipped: boolean
    }[]
  }[]
}

interface Microcycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  weekNumber: number
  mesocycle: {
    id: string
    name: string
    macrocycle: {
      id: string
      name: string
    }
  }
  workouts: Workout[]
}

interface Exercise {
  id: string
  name: string
}

const DAYS_OF_WEEK = [
  { value: '', label: 'No specific day' },
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

export default function MicrocycleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [microcycle, setMicrocycle] = useState<Microcycle | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedExercises, setSelectedExercises] = useState<
    Array<{ exerciseId: string; targetSets: number; targetReps: string; targetRpe?: number }>
  >([])

  useEffect(() => {
    fetchMicrocycle()
    fetchExercises()
  }, [])

  async function fetchMicrocycle() {
    try {
      const response = await fetch(`/api/microcycles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMicrocycle(data)
      }
    } catch (error) {
      console.error('Error fetching microcycle:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchExercises() {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this microcycle?')) {
      return
    }

    try {
      const response = await fetch(`/api/microcycles/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok && microcycle) {
        router.push(`/mesocycles/${microcycle.mesocycle.id}`)
      }
    } catch (error) {
      console.error('Error deleting microcycle:', error)
    }
  }

  async function handleCreateWorkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const dayOfWeekValue = formData.get('dayOfWeek') as string
    const estimatedDurationValue = formData.get('estimatedDuration') as string

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      dayOfWeek: dayOfWeekValue ? parseInt(dayOfWeekValue) : undefined,
      estimatedDuration: estimatedDurationValue ? parseInt(estimatedDurationValue) : undefined,
      notes: formData.get('notes') as string,
      microcycleId: params.id,
      exercises: selectedExercises.map((ex, index) => ({
        ...ex,
        orderIndex: index,
      })),
    }

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsModalOpen(false)
        setSelectedExercises([])
        fetchMicrocycle()
      }
    } catch (error) {
      console.error('Error creating workout:', error)
    }
  }

  function addExercise() {
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId: '', targetSets: 3, targetReps: '8-12', targetRpe: undefined },
    ])
  }

  function removeExercise(index: number) {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index))
  }

  function updateExercise(index: number, field: string, value: any) {
    const updated = [...selectedExercises]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedExercises(updated)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!microcycle) {
    return <div className="text-center py-8">Microcycle not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/mesocycles/${microcycle.mesocycle.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          ← Back to {microcycle.mesocycle.name}
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-700 rounded">
                  Week {microcycle.weekNumber}
                </span>
                <h1 className="text-3xl font-bold text-gray-900">{microcycle.name}</h1>
              </div>
              <p className="text-gray-600 mt-1">
                {new Date(microcycle.startDate).toLocaleDateString()} -{' '}
                {new Date(microcycle.endDate).toLocaleDateString()}
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {microcycle.description && (
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600">{microcycle.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Workouts</h2>
        <Button onClick={() => setIsModalOpen(true)}>Create Workout</Button>
      </div>

      {microcycle.workouts.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No workouts yet. Create your first workout!</p>
              <Button onClick={() => setIsModalOpen(true)}>Create Workout</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {microcycle.workouts.map((workout) => (
            <Card key={workout.id} className="hover:shadow-lg transition">
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{workout.name}</h3>
                    {workout.dayOfWeek !== undefined && workout.dayOfWeek !== null && (
                      <p className="text-sm text-gray-600">
                        {DAYS_OF_WEEK.find((d) => d.value === workout.dayOfWeek?.toString())?.label}
                      </p>
                    )}
                  </div>
                  <Link href={`/workouts/${workout.id}/log`}>
                    <Button size="sm">Start Workout</Button>
                  </Link>
                </div>

                {workout.description && (
                  <p className="text-sm text-gray-600 mb-3">{workout.description}</p>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">Exercises:</p>
                  {workout.workoutExercises.map((we) => (
                    <div key={we.id} className="text-sm text-gray-700">
                      {we.exercise.name} - {we.targetSets} sets x {we.targetReps} reps
                      {we.targetRpe && ` @ RPE ${we.targetRpe}`}
                    </div>
                  ))}
                </div>

                {workout.estimatedDuration && (
                  <p className="text-xs text-gray-500 mt-2">Duration: ~{workout.estimatedDuration} min</p>
                )}

                {workout.workoutLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-green-700">
                        Completed {new Date(workout.workoutLogs[0].completedAt).toLocaleDateString()}
                      </p>
                      <Link href={`/workout-logs/${workout.workoutLogs[0].id}`} className="text-xs text-primary-600 hover:text-primary-700">
                        View details
                      </Link>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {workout.workoutExercises.map((we) => {
                        const sets = workout.workoutLogs[0].exerciseLogs.filter(
                          (el) => el.exerciseId === we.exercise.id && !el.skipped
                        )
                        if (sets.length === 0) return null
                        return (
                          <p key={we.id} className="text-xs text-gray-600">
                            {we.exercise.name}: {sets.map((s) => `${s.weight}kg × ${s.reps}`).join(', ')}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedExercises([])
        }}
        title="Create New Workout"
        size="xl"
      >
        <form onSubmit={handleCreateWorkout} className="space-y-4">
          <Input
            label="Workout Name"
            name="name"
            required
            placeholder="e.g., Upper Body Push"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Day of Week"
              name="dayOfWeek"
              options={DAYS_OF_WEEK}
            />
            <Input
              label="Estimated Duration (minutes)"
              name="estimatedDuration"
              type="number"
              min="1"
              placeholder="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Optional workout notes"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Exercises</label>
              <Button type="button" size="sm" onClick={addExercise}>
                Add Exercise
              </Button>
            </div>

            <div className="space-y-3">
              {selectedExercises.map((selected, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={selected.exerciseId}
                      onChange={(e) => updateExercise(index, 'exerciseId', e.target.value)}
                      required
                    >
                      <option value="">Select exercise</option>
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Sets"
                    min="1"
                    value={selected.targetSets}
                    onChange={(e) => updateExercise(index, 'targetSets', parseInt(e.target.value))}
                    required
                  />
                  <input
                    type="text"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Reps"
                    value={selected.targetReps}
                    onChange={(e) => updateExercise(index, 'targetReps', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="RPE"
                    min="1"
                    max="10"
                    step="0.5"
                    value={selected.targetRpe || ''}
                    onChange={(e) =>
                      updateExercise(index, 'targetRpe', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeExercise(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setSelectedExercises([])
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
