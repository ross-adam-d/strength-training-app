'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface WorkoutExercise {
  id: string
  orderIndex: number
  targetSets: number
  targetReps: string
  targetRpe?: number
  restPeriod?: number
  notes?: string
  exercise: {
    id: string
    name: string
    description?: string
  }
}

interface Workout {
  id: string
  name: string
  description?: string
  estimatedDuration?: number
  notes?: string
  microcycle: {
    id: string
    name: string
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

interface ExerciseLog {
  exerciseId: string
  setNumber: number
  reps: number | string
  weight: number | string
  rpe?: number | string
  notes?: string
}

export default function WorkoutLogPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(new Date())
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [overallNotes, setOverallNotes] = useState('')
  const [overallRating, setOverallRating] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchWorkout()
  }, [])

  async function fetchWorkout() {
    try {
      const response = await fetch(`/api/workouts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkout(data)
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
    } finally {
      setLoading(false)
    }
  }

  function addSet(exerciseId: string) {
    const exerciseSets = exerciseLogs.filter((log) => log.exerciseId === exerciseId)
    const setNumber = exerciseSets.length + 1

    setExerciseLogs([
      ...exerciseLogs,
      {
        exerciseId,
        setNumber,
        reps: '',
        weight: '',
        rpe: undefined,
        notes: '',
      },
    ])
  }

  function updateLog(exerciseId: string, setNumber: number, field: string, value: any) {
    setExerciseLogs(
      exerciseLogs.map((log) =>
        log.exerciseId === exerciseId && log.setNumber === setNumber
          ? { ...log, [field]: value }
          : log
      )
    )
  }

  function removeSet(exerciseId: string, setNumber: number) {
    setExerciseLogs(
      exerciseLogs
        .filter((log) => !(log.exerciseId === exerciseId && log.setNumber === setNumber))
        .map((log) => {
          if (log.exerciseId === exerciseId && log.setNumber > setNumber) {
            return { ...log, setNumber: log.setNumber - 1 }
          }
          return log
        })
    )
  }

  async function handleComplete() {
    if (exerciseLogs.length === 0) {
      alert('Please log at least one set before completing the workout')
      return
    }

    // Validate all logs have required fields
    const invalidLogs = exerciseLogs.filter(
      (log) => !log.reps || !log.weight || log.reps === '' || log.weight === ''
    )

    if (invalidLogs.length > 0) {
      alert('Please fill in reps and weight for all sets')
      return
    }

    setSaving(true)

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60) // minutes

    const data = {
      workoutId: params.id,
      duration,
      notes: overallNotes,
      overallRating,
      exerciseLogs: exerciseLogs.map((log) => ({
        exerciseId: log.exerciseId,
        setNumber: log.setNumber,
        reps: parseInt(log.reps.toString()),
        weight: parseFloat(log.weight.toString()),
        rpe: log.rpe ? parseFloat(log.rpe.toString()) : undefined,
        notes: log.notes,
      })),
    }

    try {
      const response = await fetch('/api/workout-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok && workout) {
        router.push(`/microcycles/${workout.microcycle.id}`)
      } else {
        alert('Failed to save workout log')
      }
    } catch (error) {
      console.error('Error saving workout log:', error)
      alert('Failed to save workout log')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!workout) {
    return <div className="text-center py-8">Workout not found</div>
  }

  const currentExercise = workout.workoutExercises[currentExerciseIndex]
  const currentExerciseLogs = exerciseLogs.filter(
    (log) => log.exerciseId === currentExercise?.exercise.id
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/microcycles/${workout.microcycle.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          ← Back to {workout.microcycle.name}
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Started {startTime.toLocaleTimeString()}
              </p>
            </div>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Workout'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Exercise Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {workout.workoutExercises.map((we, index) => (
          <button
            key={we.id}
            onClick={() => setCurrentExerciseIndex(index)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition ${
              index === currentExerciseIndex
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {index + 1}. {we.exercise.name}
          </button>
        ))}
      </div>

      {currentExercise && (
        <Card className="mb-6">
          <CardHeader>
            <div>
              <h2 className="text-xl font-bold">{currentExercise.exercise.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Target: {currentExercise.targetSets} sets × {currentExercise.targetReps} reps
                {currentExercise.targetRpe && ` @ RPE ${currentExercise.targetRpe}`}
              </p>
              {currentExercise.notes && (
                <p className="text-sm text-gray-600 mt-1">{currentExercise.notes}</p>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {currentExerciseLogs.map((log) => (
                <div
                  key={`${log.exerciseId}-${log.setNumber}`}
                  className="flex gap-2 items-center"
                >
                  <span className="text-sm font-medium w-12">Set {log.setNumber}</span>
                  <Input
                    type="number"
                    placeholder="Weight"
                    value={log.weight}
                    onChange={(e) =>
                      updateLog(log.exerciseId, log.setNumber, 'weight', e.target.value)
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">kg ×</span>
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={log.reps}
                    onChange={(e) =>
                      updateLog(log.exerciseId, log.setNumber, 'reps', e.target.value)
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">reps</span>
                  <Input
                    type="number"
                    placeholder="RPE"
                    min="1"
                    max="10"
                    step="0.5"
                    value={log.rpe || ''}
                    onChange={(e) =>
                      updateLog(log.exerciseId, log.setNumber, 'rpe', e.target.value)
                    }
                    className="w-20"
                  />
                  <Input
                    type="text"
                    placeholder="Notes"
                    value={log.notes || ''}
                    onChange={(e) =>
                      updateLog(log.exerciseId, log.setNumber, 'notes', e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeSet(log.exerciseId, log.setNumber)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <Button
                onClick={() => addSet(currentExercise.exercise.id)}
                variant="secondary"
                size="sm"
              >
                Add Set
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-semibold">Workout Summary</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Rating (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setOverallRating(rating)}
                  className={`px-4 py-2 rounded-md font-medium transition ${
                    overallRating === rating
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="How did the workout feel? Any observations?"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Total Sets Logged: {exerciseLogs.length}
            </p>
            <p className="text-sm text-gray-600">
              Duration: {Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60)} minutes
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3 mb-8">
        <Button
          variant="secondary"
          onClick={() => router.push(`/microcycles/${workout.microcycle.id}`)}
        >
          Cancel
        </Button>
        <Button onClick={handleComplete} disabled={saving}>
          {saving ? 'Saving...' : 'Complete Workout'}
        </Button>
      </div>
    </div>
  )
}
