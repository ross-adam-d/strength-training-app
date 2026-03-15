'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface WorkoutLog {
  id: string
  completedAt: string
  duration: number | null
  overallRpe: number | null
  workout: { name: string } | null
  exerciseLogs: Array<{ exercise: { id: string; name: string } }>
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ClientHistoryPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [currentDate, setCurrentDate] = useState(new Date())
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/coach/clients/${clientId}/workout-logs?limit=200`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setWorkoutLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null)
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day)

  const workoutsByDate = new Map<string, WorkoutLog[]>()
  workoutLogs.forEach((log) => {
    const logDate = new Date(log.completedAt)
    if (logDate.getFullYear() === year && logDate.getMonth() === month) {
      const key = `${year}-${month}-${logDate.getDate()}`
      if (!workoutsByDate.has(key)) workoutsByDate.set(key, [])
      workoutsByDate.get(key)!.push(log)
    }
  })

  const sortedLogs = [...workoutLogs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
            {!isCurrentMonth && (
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-sm text-primary-600 hover:text-primary-700 mt-1"
              >
                Back to current month
              </button>
            )}
          </div>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-sm font-semibold text-gray-600 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className="aspect-square" />
            const key = `${year}-${month}-${day}`
            const dayLogs = workoutsByDate.get(key) || []
            const isToday = isCurrentMonth && day === todayDate
            return (
              <div
                key={day}
                className={`aspect-square border rounded-md p-2 relative flex flex-col items-center justify-center ${
                  isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                } ${dayLogs.length > 0 ? 'bg-green-50' : ''}`}
              >
                <div className="text-sm font-medium text-gray-700">{day}</div>
                {dayLogs.length > 0 && (
                  <>
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-1" />
                    {dayLogs.length > 1 && (
                      <span className="absolute top-1 right-1 text-xs bg-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                        {dayLogs.length}
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-500 bg-primary-50 rounded" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-gray-200 rounded" />
            <span>Workout completed</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">All Workouts</h2>
        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading workouts...</p>
        ) : sortedLogs.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No workouts logged yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map((log) => {
              const logDate = new Date(log.completedAt)
              const uniqueExercises = new Set(log.exerciseLogs.map((el) => el.exercise.id)).size
              return (
                <div key={log.id} className="border rounded-md p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{log.workout?.name ?? 'Manual Workout'}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {logDate.toLocaleDateString('en-AU', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                        <span>{uniqueExercises} exercises</span>
                        {log.duration && <><span>•</span><span>{log.duration} min</span></>}
                        {log.overallRpe && <><span>•</span><span>RPE {log.overallRpe.toFixed(1)}</span></>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
