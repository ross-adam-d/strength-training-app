'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SkipWorkoutButton from '@/components/SkipWorkoutButton'
import UndoSkipButton from '@/components/UndoSkipButton'

interface Workout {
  id: string
  name: string
  dayOfWeek: number | null
  workoutLogs: {
    id: string
    completedAt: string
    skipped?: boolean
  }[]
}

interface Microcycle {
  id: string
  weekNumber: number
  startDate: string
  endDate: string
  isRecovery: boolean
  workouts: Workout[]
}

interface Mesocycle {
  id: string
  name: string
  trainingSplit: string | null
  macrocycle: {
    id: string
    name: string
  }
  microcycles: Microcycle[]
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type PhaseTemplate = { id: string; name: string; focus: string | null; daysPerWeek: number | null; defaultWeeks: number; _count: { workouts: number } }
type SiblingPhase = { id: string; name: string; macycleName: string }

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
  const [repeatStep, setRepeatStep] = useState<'pick' | 'confirm'>('pick')
  const [selectedRepeatPhase, setSelectedRepeatPhase] = useState<SiblingPhase | null>(null)
  const [repeatDestName, setRepeatDestName] = useState('')
  const [deloadConfirmWeek, setDeloadConfirmWeek] = useState<Microcycle | null>(null)
  const [applyingDeload, setApplyingDeload] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)

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
    setShowRepeatPicker(true)
    setRepeatStep('pick')
    setSelectedRepeatPhase(null)
    if (siblingPhases.length > 0) return
    setLoadingSiblings(true)
    try {
      const res = await fetch(`/api/mesocycles/all-with-workouts?exclude=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setSiblingPhases(data)
      }
    } finally {
      setLoadingSiblings(false)
    }
  }

  async function repeatPhase(sourceMesocycleId: string, newName: string) {
    setGeneratingWorkouts(true)
    try {
      if (newName.trim()) {
        const patchRes = await fetch(`/api/mesocycles/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim() }),
        })
        if (!patchRes.ok) {
          const data = await patchRes.json()
          alert(data.error || 'Failed to rename phase')
          setGeneratingWorkouts(false)
          return
        }
      }
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

  async function savePhaseName() {
    if (!editedName.trim() || !mesocycle) return
    setSavingName(true)
    try {
      const res = await fetch(`/api/mesocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() }),
      })
      if (res.ok) {
        setMesocycle((m) => m ? { ...m, name: editedName.trim() } : m)
        setEditingName(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to rename phase')
      }
    } finally {
      setSavingName(false)
    }
  }

  async function fetchMesocycle(preserveWeekIndex?: boolean) {
    try {
      const response = await fetch(`/api/mesocycles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMesocycle(data)

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

        if (!preserveWeekIndex && weekParam) {
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

  useEffect(() => {
    fetchMesocycle()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, weekParam])

  async function handleToggleDeload(microcycleId: string, isRecovery: boolean) {
    setDeloadConfirmWeek(null)
    setApplyingDeload(microcycleId)
    try {
      const res = await fetch(`/api/microcycles/${microcycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRecovery }),
      })
      if (res.ok) {
        await fetchMesocycle(true)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update week')
      }
    } catch {
      alert('Failed to update week')
    } finally {
      setApplyingDeload(null)
    }
  }

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
          {editingName ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                autoFocus
                className="text-xl font-bold text-gray-900 border-b-2 border-primary-500 outline-none bg-transparent flex-1 min-w-0"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') savePhaseName(); if (e.key === 'Escape') setEditingName(false) }}
              />
              <button onClick={savePhaseName} disabled={savingName} className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 flex-shrink-0">{savingName ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <h1 className="text-xl font-bold text-gray-900">{mesocycle.name}</h1>
              <button onClick={() => { setEditedName(mesocycle.name); setEditingName(true) }} className="text-gray-400 hover:text-gray-600 flex-shrink-0" title="Rename phase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            </div>
          )}
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
                  {mesocycle.trainingSplit !== 'Custom' && (
                    <>
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
                    </>
                  )}

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
                    Copy workouts from any previous phase across all your blocks
                  </p>

                  {showRepeatPicker && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm text-left">
                      {repeatStep === 'pick' ? (
                        <>
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
                          ) : siblingPhases.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">
                              No phases with workouts found.
                            </p>
                          ) : (
                            <div className="max-h-64 overflow-y-auto">
                              {Object.entries(
                                siblingPhases.reduce<Record<string, SiblingPhase[]>>((acc, p) => {
                                  if (!acc[p.macycleName]) acc[p.macycleName] = []
                                  acc[p.macycleName].push(p)
                                  return acc
                                }, {})
                              ).map(([blockName, phases]) => (
                                <div key={blockName}>
                                  <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-y border-gray-100">
                                    {blockName}
                                  </p>
                                  {phases.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => {
                                        setSelectedRepeatPhase(p)
                                        setRepeatDestName(`${p.macycleName} – ${p.name}`)
                                        setRepeatStep('confirm')
                                      }}
                                      disabled={generatingWorkouts}
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0 disabled:opacity-50"
                                    >
                                      <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between px-4 py-3 border-b">
                            <button
                              onClick={() => setRepeatStep('pick')}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              ← Back
                            </button>
                            <p className="font-semibold text-gray-900 text-sm">Confirm repeat</p>
                            <button
                              onClick={() => setShowRepeatPicker(false)}
                              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                            >
                              ×
                            </button>
                          </div>
                          <div className="px-4 py-4 space-y-3">
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-1">Phase name</label>
                              <input
                                type="text"
                                value={repeatDestName}
                                onChange={(e) => setRepeatDestName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              Week 1 workouts copied into all weeks · recovery weeks at 60% sets
                            </p>
                            <button
                              onClick={() => repeatPhase(selectedRepeatPhase!.id, repeatDestName)}
                              disabled={generatingWorkouts || !repeatDestName.trim()}
                              className="w-full py-2.5 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                            >
                              {generatingWorkouts ? 'Applying…' : 'Apply Phase'}
                            </button>
                          </div>
                        </>
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
    <div className="min-h-screen pb-20 max-w-4xl mx-auto">

      {/* Phase header tile — dark card matching dashboard */}
      <div className="px-4 pt-4 mb-4">
        <Link
          href={`/macrocycles/${mesocycle.macrocycle.id}`}
          className="text-primary-500 hover:text-primary-400 text-xs font-medium inline-block mb-3"
        >
          ← {mesocycle.macrocycle.name}
        </Link>
        <div className="bg-gray-900 rounded-2xl shadow-md px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                <input
                  autoFocus
                  className="text-base font-semibold text-white bg-transparent border-b border-gray-500 outline-none flex-1 min-w-0"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') savePhaseName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button onClick={savePhaseName} disabled={savingName} className="text-xs font-medium text-primary-400 hover:text-primary-300 disabled:opacity-50 flex-shrink-0">{savingName ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditingName(false)} className="text-xs text-gray-500 hover:text-gray-300 flex-shrink-0">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base font-semibold text-white truncate">{mesocycle.name}</h1>
                <button onClick={() => { setEditedName(mesocycle.name); setEditingName(true) }} className="text-gray-500 hover:text-gray-300 flex-shrink-0" title="Rename phase">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            )}
            <span className="text-xs text-gray-400 flex-shrink-0">{mesocycle.microcycles.length} weeks</span>
          </div>
          {/* Week dots */}
          <div className="flex gap-1.5 flex-wrap">
            {mesocycle.microcycles.map((micro, index) => {
              const allDone = micro.workouts.length > 0 && micro.workouts.every(w => w.workoutLogs.length > 0)
              return (
                <button
                  key={micro.id}
                  onClick={() => setCurrentWeekIndex(index)}
                  className={`w-7 h-7 rounded-full text-xs font-medium transition flex items-center justify-center ${
                    index === currentWeekIndex
                      ? 'bg-primary-600 text-white'
                      : allDone
                      ? 'bg-gray-400 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {micro.weekNumber}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Week navigation */}
      <div className="px-4 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            disabled={!canGoPrevious}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              canGoPrevious ? 'text-primary-600 hover:bg-primary-50' : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            ← Prev
          </button>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900">Week {currentWeek.weekNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(currentWeek.startDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(currentWeek.endDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleNextWeek}
            disabled={!canGoNext}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              canGoNext ? 'text-primary-600 hover:bg-primary-50' : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            Next →
          </button>
        </div>

        {/* Deload toggle */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentWeek.isRecovery}
              onChange={(e) => {
                if (e.target.checked) {
                  setDeloadConfirmWeek(currentWeek)
                } else {
                  handleToggleDeload(currentWeek.id, false)
                }
              }}
              disabled={applyingDeload === currentWeek.id}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
            />
            <div>
              <p className="text-xs font-medium text-gray-700">Deload week</p>
              <p className="text-xs text-gray-400">Reduces all sets to ~60%</p>
            </div>
          </label>
          {applyingDeload === currentWeek.id && (
            <span className="text-xs text-gray-400">Saving…</span>
          )}
          {currentWeek.isRecovery && applyingDeload !== currentWeek.id && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Deload</span>
          )}
        </div>
      </div>

      {/* Workout cards */}
      <div
        className={`px-4 space-y-3 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentWeek.workouts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-500">No workouts for this week</p>
          </div>
        ) : (
          currentWeek.workouts
            .sort((a, b) => (a.dayOfWeek ?? 999) - (b.dayOfWeek ?? 999))
            .map((workout) => {
              const hasLog = workout.workoutLogs.length > 0
              const isSkipped = workout.workoutLogs[0]?.skipped === true
              const isCompleted = hasLog && !isSkipped
              const isInProgress = !hasLog && inProgressWorkouts.has(workout.id)
              const dayLabel = workout.dayOfWeek !== null ? DAYS_OF_WEEK[workout.dayOfWeek] : 'Unscheduled'

              const accentColor = isCompleted
                ? 'bg-gray-300'
                : isSkipped
                ? 'bg-gray-300'
                : isInProgress
                ? 'bg-blue-500'
                : 'bg-primary-500'

              return (
                <div key={workout.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex">
                  {/* Left accent strip */}
                  <div className={`w-1.5 flex-shrink-0 ${accentColor}`} />

                  {/* Card content */}
                  <div className="flex-1 px-5 py-4">
                    {/* Row 1: name + status badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{workout.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{dayLabel}</p>
                      </div>
                      {isCompleted && (
                        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                          ✓ Done
                        </span>
                      )}
                      {isSkipped && (
                        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                          Skipped
                        </span>
                      )}
                      {isInProgress && (
                        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>

                    {/* Row 2: action buttons */}
                    <div className="flex gap-2">
                      {isSkipped ? (
                        <>
                          <UndoSkipButton
                            workoutLogId={workout.workoutLogs[0].id}
                            variant="mesocycle"
                            onUndone={() => window.location.reload()}
                          />
                          <button
                            onClick={() => handleEditWorkout(workout.id)}
                            className="px-4 py-1.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
                            disabled
                          >
                            Edit
                          </button>
                        </>
                      ) : isCompleted ? (
                        <>
                          <button
                            onClick={() => handleViewCompleted(workout.workoutLogs[0].id)}
                            className="flex-1 px-4 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                          >
                            View Details
                          </button>
                          <button
                            disabled
                            className="px-4 py-1.5 text-xs font-medium bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed opacity-50"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartWorkout(workout.id)}
                            className="flex-1 px-4 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                          >
                            {isInProgress ? 'Resume' : 'Start Workout'}
                          </button>
                          <SkipWorkoutButton
                            workoutId={workout.id}
                            variant="mesocycle"
                            onSkipped={() => window.location.reload()}
                          />
                          <button
                            onClick={() => handleEditWorkout(workout.id)}
                            className="px-4 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
        )}
      </div>

      {/* Deload confirmation modal */}
      {deloadConfirmWeek && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Mark Week {deloadConfirmWeek.weekNumber} as Deload</h2>
              <p className="text-sm text-gray-500 mt-1">This action cannot be automatically reversed</p>
            </div>
            <div className="p-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800">All sets in this week will be immediately reduced to approximately 60% of their current values (minimum 1 set per exercise).</p>
                <p className="text-sm text-amber-700 mt-2">To restore original volumes, rebuild the phase workouts.</p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeloadConfirmWeek(null)}
                className="flex-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl py-2.5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleDeload(deloadConfirmWeek.id, true)}
                className="flex-1 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl py-2.5 transition"
              >
                Apply Deload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
