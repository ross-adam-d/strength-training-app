'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

type PhaseTemplate = { id: string; name: string; focus: string | null; daysPerWeek: number | null; defaultWeeks: number; _count: { workouts: number } }
type SiblingPhase = { id: string; name: string; hasWorkouts: boolean }

export default function MesocycleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const weekParam = searchParams.get('week')
  const { data: authSession } = useSession()
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [inProgressWorkouts, setInProgressWorkouts] = useState<Set<string>>(new Set())
  const [generatingWorkouts, setGeneratingWorkouts] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [templates, setTemplates] = useState<PhaseTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [showRepeatPicker, setShowRepeatPicker] = useState(false)
  const [siblingPhases, setSiblingPhases] = useState<SiblingPhase[]>([])
  const [loadingSiblings, setLoadingSiblings] = useState(false)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  async function openTemplatePicker() {
    setShowTemplatePicker(true)
    if (templates.length > 0) return
    setLoadingTemplates(true)
    try {
      const res = await fetch('/api/coach/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function applyTemplate(templateId: string) {
    setApplyingTemplate(true)
    try {
      const res = await fetch(`/api/mesocycles/${params.id}/apply-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to apply template')
        setApplyingTemplate(false)
      }
    } catch {
      alert('Network error')
      setApplyingTemplate(false)
    }
  }

  async function openRepeatPicker() {
    if (!mesocycle) return
    setShowRepeatPicker(true)
    if (siblingPhases.length > 0) return
    setLoadingSiblings(true)
    try {
      const res = await fetch(`/api/macrocycles/${mesocycle.macrocycle.id}`)
      if (res.ok) {
        const data = await res.json()
        const others: SiblingPhase[] = (data.mesocycles ?? [])
          .filter((m: any) => m.id !== params.id)
          .map((m: any) => ({
            id: m.id,
            name: m.name,
            hasWorkouts: (m.microcycles ?? []).some((mc: any) => (mc.workouts ?? []).length > 0),
          }))
        setSiblingPhases(others)
      }
    } finally {
      setLoadingSiblings(false)
    }
  }

  async function repeatPhase(sourceMesocycleId: string) {
    setGeneratingWorkouts(true)
    try {
      const res = await fetch(`/api/mesocycles/${params.id}/generate-workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'repeat-previous', sourceMesocycleId }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to repeat phase')
        setGeneratingWorkouts(false)
      }
    } catch {
      alert('Network error')
      setGeneratingWorkouts(false)
    }
  }

  async function generateWorkouts(mode: 'default' | 'manual') {
    setGeneratingWorkouts(true)
    try {
      const response = await fetch(`/api/mesocycles/${params.id}/generate-workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to generate workouts')
        return
      }

      // Refresh the page data
      window.location.reload()
    } catch (error) {
      console.error('Error generating workouts:', error)
      alert('Failed to generate workouts')
    } finally {
      setGeneratingWorkouts(false)
    }
  }

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
      <div className="animate-pulse p-4">
        {/* Header Skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
        </div>

        {/* Week Navigation Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
        </div>

        {/* Workouts Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-12 bg-gray-50 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
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

  // Check if phase has any workouts at all
  const hasAnyWorkouts = mesocycle.microcycles.some(week => week.workouts.length > 0)

  // If no workouts exist, show workout generation options
  if (!hasAnyWorkouts) {
    return (
      <div className="min-h-screen pb-20">
        <div className="mb-4 px-4 pt-4">
          <Link
            href={`/macrocycles/${mesocycle.macrocycle.id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-block"
          >
            ← {mesocycle.macrocycle.name}
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">{mesocycle.name}</h1>
        </div>

        <div className="px-4">
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Workouts Yet</h2>
                <p className="text-gray-600 mb-8">
                  This phase has no workouts. Choose how you&apos;d like to set them up:
                </p>

                <div className="max-w-2xl mx-auto space-y-4">
                  <Button
                    onClick={() => generateWorkouts('default')}
                    disabled={generatingWorkouts}
                    className="w-full py-4 text-lg"
                    size="lg"
                  >
                    {generatingWorkouts ? 'Creating...' : '🎯 Create Default Workout Structure'}
                  </Button>
                  <p className="text-sm text-gray-600 -mt-2 mb-4">
                    Auto-populate workouts with exercises based on your training split
                  </p>

                  <Button
                    onClick={() => generateWorkouts('manual')}
                    disabled={generatingWorkouts}
                    variant="secondary"
                    className="w-full py-4 text-lg"
                    size="lg"
                  >
                    {generatingWorkouts ? 'Creating...' : '✏️ Manually Create Workouts'}
                  </Button>
                  <p className="text-sm text-gray-600 -mt-2">
                    Create empty workout slots and add exercises yourself
                  </p>

                  <Button
                    onClick={openRepeatPicker}
                    disabled={generatingWorkouts}
                    variant="secondary"
                    className="w-full py-4 text-lg"
                    size="lg"
                  >
                    🔁 Repeat a Prior Phase
                  </Button>
                  <p className="text-sm text-gray-600 -mt-2">
                    Copy workouts from a previous phase in this block
                  </p>

                  {showRepeatPicker && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm text-left">
                      <div className="flex items-center justify-between px-4 py-3 border-b">
                        <p className="font-semibold text-gray-900 text-sm">Select a phase to repeat</p>
                        <button
                          onClick={() => setShowRepeatPicker(false)}
                          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                      {loadingSiblings ? (
                        <p className="text-sm text-gray-400 text-center py-6">Loading phases…</p>
                      ) : siblingPhases.filter((p) => p.hasWorkouts).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">
                          No other phases with workouts in this block yet.
                        </p>
                      ) : (
                        <div className="divide-y max-h-64 overflow-y-auto">
                          {siblingPhases
                            .filter((p) => p.hasWorkouts)
                            .map((p) => (
                              <button
                                key={p.id}
                                onClick={() => repeatPhase(p.id)}
                                disabled={generatingWorkouts}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition disabled:opacity-50"
                              >
                                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Week 1 workouts copied into all weeks · recovery weeks at 60% sets
                                </p>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {authSession?.user?.role === 'COACH' && (
                    <>
                      <Button
                        onClick={openTemplatePicker}
                        disabled={generatingWorkouts || applyingTemplate}
                        variant="secondary"
                        className="w-full py-4 text-lg"
                        size="lg"
                      >
                        📋 Use Phase Template
                      </Button>
                      <p className="text-sm text-gray-600 -mt-2">
                        Apply one of your saved phase templates to this block
                      </p>

                      {showTemplatePicker && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm text-left">
                          <div className="flex items-center justify-between px-4 py-3 border-b">
                            <p className="font-semibold text-gray-900 text-sm">Select a template</p>
                            <button
                              onClick={() => setShowTemplatePicker(false)}
                              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                            >
                              ×
                            </button>
                          </div>
                          {loadingTemplates ? (
                            <p className="text-sm text-gray-400 text-center py-6">Loading templates…</p>
                          ) : templates.length === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-sm text-gray-500 mb-2">No templates yet.</p>
                              <Link href="/coach/templates/new" className="text-sm text-primary-600 underline">
                                Create your first template →
                              </Link>
                            </div>
                          ) : (
                            <div className="divide-y max-h-64 overflow-y-auto">
                              {templates.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => applyTemplate(t.id)}
                                  disabled={applyingTemplate}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                  <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {t._count.workouts} workout{t._count.workouts !== 1 ? 's' : ''}
                                    {t.daysPerWeek ? ` · ${t.daysPerWeek} days/week` : ''}
                                    {' · '}{t.defaultWeeks} weeks
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
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

        {/* Week dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {mesocycle.microcycles.map((micro, index) => {
            const allDone = micro.workouts.length > 0 && micro.workouts.every(w => w.workoutLogs.length > 0)
            return (
              <button
                key={micro.id}
                onClick={() => setCurrentWeekIndex(index)}
                className={`w-6 h-6 rounded-full text-xs font-medium transition ${
                  index === currentWeekIndex
                    ? 'bg-primary-600 text-white'
                    : allDone
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {micro.weekNumber}
              </button>
            )
          })}
        </div>
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

    </div>
  )
}
