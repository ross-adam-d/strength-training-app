'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'

interface Exercise {
  id: string
  name: string
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

export default function MesocycleDetailPage() {
  const params = useParams()
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    fetchMesocycle()
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
            currentMicrocycle.workouts
              .sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0))
              .map((workout) => {
                const isExpanded = expandedWorkouts.has(workout.id)
                const isCompleted = workout.workoutLogs.length > 0
                const lastLog = isCompleted ? workout.workoutLogs[0] : null

                return (
                  <Card key={workout.id}>
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
                            <p className="text-sm text-gray-600">
                              {workout.dayOfWeek !== null ? DAYS_OF_WEEK[workout.dayOfWeek] : 'Not scheduled'}
                              {workout.estimatedDuration && ` • ${workout.estimatedDuration} min`}
                            </p>
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
                          <h4 className="font-medium text-gray-900 mb-3">Exercises</h4>
                          <div className="space-y-2">
                            {workout.workoutExercises
                              .sort((a, b) => a.orderIndex - b.orderIndex)
                              .map((we, index) => (
                                <div
                                  key={we.id}
                                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                >
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
                                </div>
                              ))}
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
                )
              })
          )}
        </div>
      )}
    </div>
  )
}
