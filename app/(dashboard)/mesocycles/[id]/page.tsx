'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'

interface Workout {
  id: string
  name: string
  dayOfWeek: number | null
  workoutLogs: {
    id: string
    completedAt: string
  }[]
}

interface Microcycle {
  id: string
  weekNumber: number
  startDate: string
  endDate: string
  workouts: Workout[]
}

interface Mesocycle {
  id: string
  name: string
  macrocycle: {
    id: string
    name: string
  }
  microcycles: Microcycle[]
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MesocycleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const weekParam = searchParams.get('week')
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [inProgressWorkouts, setInProgressWorkouts] = useState<Set<string>>(new Set())

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  useEffect(() => {
    async function fetchMesocycle() {
      try {
        const response = await fetch(`/api/mesocycles/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setMesocycle(data)

          // Check for in-progress workouts in localStorage
          const inProgress = new Set<string>()
          data.microcycles.forEach((microcycle: Microcycle) => {
            microcycle.workouts.forEach((workout: Workout) => {
              const draftKey = `workout-draft-${workout.id}`
              if (localStorage.getItem(draftKey)) {
                inProgress.add(workout.id)
              }
            })
          })
          setInProgressWorkouts(inProgress)

          // Set initial week from URL parameter
          if (weekParam) {
            const weekIndex = parseInt(weekParam)
            if (weekIndex >= 0 && weekIndex < data.microcycles.length) {
              setCurrentWeekIndex(weekIndex)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching mesocycle:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMesocycle()
  }, [params.id, weekParam])

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && canGoNext) {
      handleNextWeek()
    } else if (isRightSwipe && canGoPrevious) {
      handlePreviousWeek()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!mesocycle) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Phase not found</p>
      </div>
    )
  }

  const currentWeek = mesocycle.microcycles[currentWeekIndex]
  const canGoPrevious = currentWeekIndex > 0
  const canGoNext = currentWeekIndex < mesocycle.microcycles.length - 1

  function handlePreviousWeek() {
    if (canGoPrevious && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentWeekIndex(currentWeekIndex - 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  function handleNextWeek() {
    if (canGoNext && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentWeekIndex(currentWeekIndex + 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  function handleStartWorkout(workoutId: string) {
    router.push(`/workouts/${workoutId}/log`)
  }

  function handleEditWorkout(workoutId: string) {
    router.push(`/workouts/${workoutId}/edit`)
  }

  function handleViewCompleted(workoutLogId: string) {
    router.push(`/workout-logs/${workoutLogId}`)
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Clean Header */}
      <div className="mb-4 px-4 pt-4">
        <Link
          href={`/macrocycles/${mesocycle.macrocycle.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-block"
        >
          ← {mesocycle.macrocycle.name}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">{mesocycle.name}</h1>
      </div>

      {/* Week Navigation */}
      <div className="mb-6 px-4">
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <button
            onClick={handlePreviousWeek}
            disabled={!canGoPrevious}
            className={`px-3 py-2 rounded-md font-medium transition min-w-[80px] ${
              canGoPrevious
                ? 'text-primary-600 hover:bg-white'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            ← Prev
          </button>

          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-gray-900">Week {currentWeek.weekNumber}</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {new Date(currentWeek.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              -{' '}
              {new Date(currentWeek.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          <button
            onClick={handleNextWeek}
            disabled={!canGoNext}
            className={`px-3 py-2 rounded-md font-medium transition min-w-[80px] ${
              canGoNext
                ? 'text-primary-600 hover:bg-white'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            Next →
          </button>
        </div>

        {/* Swipe Hint */}
        <p className="text-center text-xs text-gray-500 mt-2">
          Swipe left/right to navigate weeks
        </p>
      </div>

      {/* Compact Workout Grid */}
      <div
        className="px-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Swipeable content area with smooth transition */}
        <div
          className={`transition-opacity duration-300 ${
            isTransitioning ? 'opacity-50' : 'opacity-100'
          }`}
        >
          {currentWeek.workouts.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No workouts for this week</p>
                  <p className="text-sm mt-1">Add workouts from the workout template</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {currentWeek.workouts
              .sort((a, b) => {
                // Sort by orderIndex if available, otherwise by dayOfWeek
                return (a.dayOfWeek ?? 999) - (b.dayOfWeek ?? 999)
              })
              .map((workout) => {
                const isCompleted = workout.workoutLogs.length > 0
                const dayLabel =
                  workout.dayOfWeek !== null ? DAYS_OF_WEEK[workout.dayOfWeek] : 'Unscheduled'

                return (
                  <Card key={workout.id}>
                    <CardBody className="py-4">
                      <div className="space-y-3">
                        {/* Workout Info */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base truncate">
                              {workout.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">{dayLabel}</p>
                          </div>
                          {isCompleted && (
                            <span className="px-2.5 py-1 text-xs bg-green-100 text-green-800 rounded-md font-medium whitespace-nowrap flex-shrink-0">
                              ✓ Completed
                            </span>
                          )}
                          {!isCompleted && inProgressWorkouts.has(workout.id) && (
                            <span className="px-2.5 py-1 text-xs bg-blue-100 text-blue-800 rounded-md font-medium whitespace-nowrap flex-shrink-0">
                              ⏳ In Progress
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {isCompleted ? (
                            <>
                              <button
                                onClick={() => handleViewCompleted(workout.workoutLogs[0].id)}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                              >
                                View Details
                              </button>
                              <button
                                disabled
                                className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed opacity-50"
                              >
                                Edit
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartWorkout(workout.id)}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                              >
                                Start Workout
                              </button>
                              <button
                                onClick={() => handleEditWorkout(workout.id)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Week Progress Indicator */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2">
          <div className="flex items-center justify-center gap-1.5">
            {mesocycle.microcycles.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index === currentWeekIndex ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-1.5">
            Week {currentWeekIndex + 1} of {mesocycle.microcycles.length}
          </p>
        </div>
      </div>
    </div>
  )
}
