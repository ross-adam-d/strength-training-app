'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface WorkoutLog {
  id: string
  completedAt: string
  duration: number | null
  overallRpe: number | null
  workout: {
    name: string
  } | null
  exerciseLogs: Array<{
    exercise: {
      id: string
      name: string
    }
  }>
}

export default function WorkoutHistoryPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkoutLogs()
  }, [currentDate])

  const fetchWorkoutLogs = async () => {
    setLoading(true)
    try {
      // Fetch a large set of recent workouts (we'll filter client-side)
      const res = await fetch('/api/workout-logs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setWorkoutLogs(data)
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calendar helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  // Create calendar grid
  const calendarDays: (number | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Group workouts by date
  const workoutsByDate = new Map<string, WorkoutLog[]>()
  workoutLogs.forEach((log) => {
    const logDate = new Date(log.completedAt)
    if (logDate.getFullYear() === year && logDate.getMonth() === month) {
      const dateKey = `${year}-${month}-${logDate.getDate()}`
      if (!workoutsByDate.has(dateKey)) {
        workoutsByDate.set(dateKey, [])
      }
      workoutsByDate.get(dateKey)!.push(log)
    }
  })

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToCurrentMonth = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // All workouts sorted by most recent
  const sortedWorkouts = [...workoutLogs].sort((a, b) =>
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Workout History</h1>
        <p className="text-gray-600 mt-2">Track your completed workouts and progress</p>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Previous month"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="text-sm text-primary-600 hover:text-primary-700 mt-1"
              >
                Back to current month
              </button>
            )}
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Next month"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const dateKey = `${year}-${month}-${day}`
            const dayWorkouts = workoutsByDate.get(dateKey) || []
            const isToday = isCurrentMonth && day === todayDate
            const hasWorkouts = dayWorkouts.length > 0

            return (
              <div
                key={day}
                className={`aspect-square border rounded-md p-2 relative flex flex-col items-center justify-center ${
                  isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                } ${hasWorkouts ? 'bg-green-50' : ''}`}
              >
                <div className="text-sm font-medium text-gray-700">{day}</div>
                {hasWorkouts && (
                  <>
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-1" aria-label="Workout completed" />
                    {dayWorkouts.length > 1 && (
                      <span className="absolute top-1 right-1 text-xs bg-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                        {dayWorkouts.length}
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-500 bg-primary-50 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-gray-200 rounded"></div>
            <span>Workout completed</span>
          </div>
        </div>
      </div>

      {/* Workout History List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">All Workouts</h2>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading workouts...</p>
          </div>
        ) : sortedWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No workouts logged yet</p>
            <Link
              href="/workout/start"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              Log Your First Workout
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedWorkouts.map((log) => {
              const logDate = new Date(log.completedAt)
              const uniqueExercises = new Set(log.exerciseLogs.map((el) => el.exercise.id)).size

              return (
                <Link
                  key={log.id}
                  href={`/workout-logs/${log.id}`}
                  className="block p-4 border rounded-md hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {log.workout?.name ?? 'Manual Workout'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {logDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                        <span>{uniqueExercises} exercises</span>
                        {log.duration && (
                          <>
                            <span>•</span>
                            <span>{log.duration} min</span>
                          </>
                        )}
                        {log.overallRpe && (
                          <>
                            <span>•</span>
                            <span>RPE {log.overallRpe.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
