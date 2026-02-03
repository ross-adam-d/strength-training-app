'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Exercise {
  id: string
  name: string
}

interface ExerciseLog {
  id: string
  setNumber: number
  reps: number
  weight: number
  rpe?: number
  createdAt: string
  workoutLog: {
    completedAt: string
  }
}

interface WorkoutLog {
  id: string
  completedAt: string
  duration?: number
  overallRating?: number
  workout: {
    name: string
  }
  exerciseLogs: Array<{
    exercise: {
      name: string
    }
    weight: number
    reps: number
  }>
}

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExercises()
    fetchRecentWorkouts()
  }, [])

  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseLogs(selectedExercise)
    }
  }, [selectedExercise])

  async function fetchExercises() {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data)
        if (data.length > 0) {
          setSelectedExercise(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchExerciseLogs(exerciseId: string) {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/logs`)
      if (response.ok) {
        const data = await response.json()
        setExerciseLogs(data)
      }
    } catch (error) {
      console.error('Error fetching exercise logs:', error)
    }
  }

  async function fetchRecentWorkouts() {
    try {
      const response = await fetch('/api/workout-logs?limit=10')
      if (response.ok) {
        const data = await response.json()
        setRecentWorkouts(data)
      }
    } catch (error) {
      console.error('Error fetching recent workouts:', error)
    }
  }

  // Calculate 1RM using Epley formula: weight * (1 + reps/30)
  function calculate1RM(weight: number, reps: number): number {
    return Math.round(weight * (1 + reps / 30))
  }

  // Process exercise logs for charts
  const weightProgressData = exerciseLogs
    .reduce((acc: any[], log) => {
      const date = new Date(log.workoutLog.completedAt).toLocaleDateString()
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        existing.maxWeight = Math.max(existing.maxWeight, log.weight)
      } else {
        acc.push({
          date,
          maxWeight: log.weight,
          estimated1RM: calculate1RM(log.weight, log.reps),
        })
      }

      return acc
    }, [])
    .slice(-10) // Last 10 data points

  const volumeData = exerciseLogs
    .reduce((acc: any[], log) => {
      const date = new Date(log.workoutLog.completedAt).toLocaleDateString()
      const existing = acc.find((item) => item.date === date)
      const volume = log.weight * log.reps

      if (existing) {
        existing.volume += volume
        existing.sets += 1
      } else {
        acc.push({
          date,
          volume,
          sets: 1,
        })
      }

      return acc
    }, [])
    .slice(-10)

  // Calculate statistics
  const totalWorkouts = recentWorkouts.length
  const totalVolume = recentWorkouts.reduce((sum, workout) => {
    return (
      sum +
      workout.exerciseLogs.reduce(
        (exerciseSum, log) => exerciseSum + log.weight * log.reps,
        0
      )
    )
  }, 0)
  const avgDuration =
    recentWorkouts.length > 0
      ? Math.round(
          recentWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) /
            recentWorkouts.filter((w) => w.duration).length
        )
      : 0

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
        <p className="text-gray-600 mt-2">Monitor your training progress and performance</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Workouts (Last 10)</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">{totalWorkouts}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Volume (kg)</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">
                {totalVolume.toLocaleString()}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Workout Duration</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">{avgDuration} min</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Exercise Progress Charts */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Exercise Progress</h2>
            <div className="w-64">
              <Select
                options={[
                  { value: '', label: 'Select an exercise' },
                  ...exercises.map((ex) => ({ value: ex.id, label: ex.name })),
                ]}
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {weightProgressData.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No data available for this exercise yet. Start logging workouts to see progress!
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Weight Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#0ea5e9"
                      name="Max Weight (kg)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimated1RM"
                      stroke="#8b5cf6"
                      name="Estimated 1RM (kg)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Volume Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="volume" fill="#0ea5e9" name="Total Volume (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Recent Workouts</h2>
        </CardHeader>
        <CardBody>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No workouts logged yet</div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition"
                >
                  <div>
                    <h3 className="font-medium">{workout.workout.name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(workout.completedAt).toLocaleDateString()} •{' '}
                      {workout.exerciseLogs.length} exercises
                    </p>
                  </div>
                  <div className="text-right">
                    {workout.duration && (
                      <p className="text-sm text-gray-600">{workout.duration} min</p>
                    )}
                    {workout.overallRating && (
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: workout.overallRating }).map((_, i) => (
                          <span key={i} className="text-yellow-500">
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
