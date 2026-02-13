'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { LiftHistoryModal } from '@/components/LiftHistoryModal'

interface WorkoutExercise {
  id: string
  orderIndex: number
  targetSets: number
  targetReps: string
  targetRpe?: number
  targetRir?: number
  tempo?: string
  restPeriod?: number
  supersetWithPrevious: boolean
  notes?: string
  exercise: {
    id: string
    name: string
    description?: string
    isUnilateral: boolean
  }
}

interface Workout {
  id: string
  name: string
  description?: string
  estimatedDuration?: number
  warmupNotes?: string
  notes?: string
  microcycle: {
    id: string
    name: string
    mesocycle: {
      id: string
      name: string
      warmupNotes?: string
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
  repsLeft?: number | string  // For unilateral exercises
  repsRight?: number | string // For unilateral exercises
  weight: number | string
  rir?: number | string
  notes?: string
  skipped: boolean
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Calculate superset groups: returns Map of exercise.id -> group number (1, 2, 3...) or null
function calculateSupersetGroups(exercises: WorkoutExercise[]): Map<string, number | null> {
  const groups = new Map<string, number | null>()
  let currentGroup = 0
  let inSuperset = false

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    const nextEx = exercises[i + 1]

    if (ex.supersetWithPrevious) {
      // This exercise is part of a superset
      if (!inSuperset) {
        // Start a new superset group
        currentGroup++
        // Mark the previous exercise as part of this group too
        if (i > 0) {
          groups.set(exercises[i - 1].exercise.id, currentGroup)
        }
      }
      groups.set(ex.exercise.id, currentGroup)
      inSuperset = true
    } else {
      // Not in a superset
      if (!inSuperset) {
        groups.set(ex.exercise.id, null)
      } else {
        // Previous exercise(s) were in a superset, but this one isn't
        groups.set(ex.exercise.id, null)
        inSuperset = false
      }
    }

    // Check if next exercise continues the superset
    if (inSuperset && (!nextEx || !nextEx.supersetWithPrevious)) {
      inSuperset = false
    }
  }

  return groups
}

function formatTimer(s: number) {
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`
}

function playBeep() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.4)
  setTimeout(() => ctx.close(), 500)
}

export default function WorkoutLogPage() {
  const router = useRouter()
  const params = useParams()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(new Date())
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [overallNotes, setOverallNotes] = useState('')
  const [overallRating, setOverallRating] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)

  // Missing fields modal state
  const [showIncompleteModal, setShowIncompleteModal] = useState(false)
  const [incompleteSetsCount, setIncompleteSetsCount] = useState(0)

  // "Up Next" modal state
  const [showUpNextModal, setShowUpNextModal] = useState(false)
  const [nextWorkout, setNextWorkout] = useState<{
    id: string
    name: string
    dayOfWeek: number | null
    microcycle: {
      id: string
      weekNumber: number
      startDate: string
      endDate: string
      mesocycle: {
        id: string
        name: string
      }
    }
  } | null>(null)

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [setToDelete, setSetToDelete] = useState<{ exerciseId: string; setNumber: number } | null>(null)

  // Exercise-level notes (one note per exercise, not per set)
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})

  // Exercise-level RPE (1-5 scale: Too Easy → Too Much)
  const [exerciseRpes, setExerciseRpes] = useState<Record<string, number>>({})

  // Completed exercises tracking
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  // Lift history modal state
  const [showLiftHistory, setShowLiftHistory] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string } | null>(null)

  // Rest timer state
  const [activeTimerKey, setActiveTimerKey] = useState<string | null>(null)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0)
  const [timerFlashing, setTimerFlashing] = useState(false)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchWorkout()
  }, [])

  // Rest timer tick effect — keyed on activeTimerKey only
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (activeTimerKey === null) return

    timerIntervalRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!)
          timerIntervalRef.current = null
          playBeep()
          setTimerFlashing(true)
          setTimeout(() => {
            setTimerFlashing(false)
            setActiveTimerKey(null)
            setTimerSecondsLeft(0)
          }, 2000)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [activeTimerKey])

  async function fetchWorkout() {
    try {
      const response = await fetch(`/api/workouts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkout(data)

        // Build lookup from most recent completed workout log
        const lastLogSets = new Map<string, { setNumber: number; reps: number; weight: number }[]>()
        const lastExerciseNotes: Record<string, string> = {}
        const lastExerciseRpes: Record<string, number> = {}

        if (data.workoutLogs && data.workoutLogs.length > 0) {
          for (const el of data.workoutLogs[0].exerciseLogs) {
            if (!lastLogSets.has(el.exerciseId)) lastLogSets.set(el.exerciseId, [])
            lastLogSets.get(el.exerciseId)!.push(el)

            // Extract exercise-level notes from first set (where we store them)
            if (el.setNumber === 1 && el.notes) {
              lastExerciseNotes[el.exerciseId] = el.notes
            }

            // Extract exercise-level RPE from first set (where we store it)
            if (el.setNumber === 1 && el.exerciseRpe) {
              lastExerciseRpes[el.exerciseId] = el.exerciseRpe
            }
          }
        }

        // Set exercise notes and RPEs from history
        setExerciseNotes(lastExerciseNotes)
        setExerciseRpes(lastExerciseRpes)

        // Pre-populate sets from the workout plan, using last log values where available
        const prepopulated = data.workoutExercises.flatMap((we: WorkoutExercise) =>
          Array.from({ length: we.targetSets }, (_, i) => {
            const lastSet = lastLogSets.get(we.exercise.id)?.find((s) => s.setNumber === i + 1)
            return {
              exerciseId: we.exercise.id,
              setNumber: i + 1,
              reps: lastSet ? String(lastSet.reps) : '',
              weight: lastSet ? String(lastSet.weight) : '',
              rir: undefined,
              notes: '',
              skipped: false,
            }
          })
        )
        setExerciseLogs(prepopulated)
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
    } finally {
      setLoading(false)
    }
  }

  function startTimer(exerciseId: string, setNumber: number, restPeriod: number) {
    const key = `${exerciseId}-${setNumber}`
    if (activeTimerKey === key) {
      // Cancel
      setActiveTimerKey(null)
      setTimerSecondsLeft(0)
      setTimerFlashing(false)
      return
    }
    setActiveTimerKey(key)
    setTimerSecondsLeft(restPeriod)
    setTimerFlashing(false)
  }

  function skipSet(exerciseId: string, setNumber: number) {
    if (activeTimerKey === `${exerciseId}-${setNumber}`) {
      setActiveTimerKey(null)
      setTimerSecondsLeft(0)
      setTimerFlashing(false)
    }
    setExerciseLogs((prev) =>
      prev.map((log) =>
        log.exerciseId === exerciseId && log.setNumber === setNumber
          ? { ...log, skipped: !log.skipped, reps: '', weight: '', rir: undefined, notes: '' }
          : log
      )
    )
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
        rir: undefined,
        notes: '',
        skipped: false,
      },
    ])
  }

  function completeExercise(exerciseId: string) {
    // Find the exercise to check if it's unilateral
    const workoutExercise = workout?.workoutExercises.find((we) => we.exercise.id === exerciseId)
    if (!workoutExercise) return

    // Validate that all sets are either completed or skipped
    const exerciseSets = exerciseLogs.filter((log) => log.exerciseId === exerciseId)

    const incompleteSets = exerciseSets.filter((log) => {
      if (log.skipped) return false

      // Check weight (common to all exercises)
      const weightEmpty = log.weight === '' || log.weight === undefined || log.weight === null
      if (weightEmpty) return true

      // Check reps based on exercise type
      if (workoutExercise.exercise.isUnilateral) {
        // For unilateral: check repsLeft and repsRight
        const leftEmpty = log.repsLeft === '' || log.repsLeft === undefined || log.repsLeft === null
        const rightEmpty = log.repsRight === '' || log.repsRight === undefined || log.repsRight === null
        return leftEmpty || rightEmpty
      } else {
        // For regular: check reps
        const repsEmpty = log.reps === '' || log.reps === undefined || log.reps === null
        return repsEmpty
      }
    })

    if (incompleteSets.length > 0) {
      alert(`Please complete or skip all sets before marking this exercise as done (${incompleteSets.length} incomplete sets)`)
      return
    }

    // Mark exercise as complete
    setCompletedExercises(new Set([...completedExercises, exerciseId]))
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
    if (activeTimerKey === `${exerciseId}-${setNumber}`) {
      setActiveTimerKey(null)
      setTimerSecondsLeft(0)
      setTimerFlashing(false)
    }
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

  function cleanOnBlur(exerciseId: string, setNumber: number, field: string, value: number | string | undefined) {
    const str = String(value ?? '')
    if (str === '') return
    const cleanedValue = field === 'weight'
      ? (isNaN(parseFloat(str)) ? '' : String(parseFloat(str)))
      : (isNaN(parseInt(str, 10)) ? '' : String(parseInt(str, 10)))

    setExerciseLogs((prev) =>
      prev.map((log) => {
        if (log.exerciseId === exerciseId && log.setNumber === setNumber) {
          return { ...log, [field]: cleanedValue }
        }
        // Auto-populate weight from set 1 to remaining empty sets
        if (field === 'weight' && setNumber === 1 && log.exerciseId === exerciseId && log.setNumber > 1 && log.weight === '') {
          return { ...log, weight: cleanedValue }
        }
        return log
      })
    )
  }

  async function handleComplete() {
    const nonSkipped = exerciseLogs.filter((log) => !log.skipped)

    if (nonSkipped.length === 0) {
      alert('Please log at least one set before completing the workout')
      return
    }

    // Check for incomplete sets
    const invalidLogs = nonSkipped.filter(
      (log) => log.reps === '' || log.weight === ''
    )

    if (invalidLogs.length > 0) {
      // Show modal instead of alert
      setIncompleteSetsCount(invalidLogs.length)
      setShowIncompleteModal(true)
      return
    }

    // All sets are valid, proceed with save
    await saveWorkout()
  }

  async function fetchNextWorkout() {
    if (!workout) return

    try {
      // Fetch the mesocycle with all workouts to find the next one
      const response = await fetch(`/api/mesocycles/${workout.microcycle.mesocycle.id}`)
      if (!response.ok) {
        // If fetch fails, just show modal with no next workout
        setShowUpNextModal(true)
        return
      }

      const mesocycleData = await response.json()

      // Find all uncompleted workouts in the phase
      const allWorkouts: any[] = []
      for (const microcycle of mesocycleData.microcycles) {
        for (const w of microcycle.workouts) {
          allWorkouts.push({
            ...w,
            microcycle: {
              id: microcycle.id,
              weekNumber: microcycle.weekNumber,
              startDate: microcycle.startDate,
              endDate: microcycle.endDate,
              mesocycle: {
                id: mesocycleData.id,
                name: mesocycleData.name,
              },
            },
          })
        }
      }

      // Find current workout index and get next uncompleted workout
      const currentIndex = allWorkouts.findIndex((w) => w.id === workout.id)
      if (currentIndex >= 0) {
        for (let i = currentIndex + 1; i < allWorkouts.length; i++) {
          const w = allWorkouts[i]
          if (!w.workoutLogs || w.workoutLogs.length === 0) {
            // Found next uncompleted workout
            setNextWorkout(w)
            setShowUpNextModal(true)
            return
          }
        }
      }

      // No next workout found (phase complete)
      setNextWorkout(null)
      setShowUpNextModal(true)
    } catch (error) {
      console.error('Error fetching next workout:', error)
      // Show modal anyway
      setShowUpNextModal(true)
    }
  }

  async function handleCompleteWithAutoSkip() {
    // Auto-skip incomplete sets
    setExerciseLogs((prev) =>
      prev.map((log) => {
        if (log.skipped) return log
        if (log.reps === '' || log.weight === '') {
          return { ...log, skipped: true, reps: '', weight: '', rir: undefined, notes: '' }
        }
        return log
      })
    )

    // Close modal and proceed
    setShowIncompleteModal(false)

    // Use setTimeout to ensure state update completes
    setTimeout(() => {
      saveWorkout()
    }, 0)
  }

  async function saveWorkout() {
    setSaving(true)

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)

    // Calculate overall workout RPE (average of exercise RPEs)
    const rpeValues = Object.values(exerciseRpes).filter(rpe => rpe !== undefined && rpe > 0)
    const overallRpe = rpeValues.length > 0
      ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
      : undefined

    const data = {
      workoutId: params.id,
      duration,
      notes: overallNotes,
      overallRating,
      overallRpe,
      exerciseLogs: exerciseLogs.map((log) => {
        if (log.skipped) {
          return {
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: 0,
            weight: 0,
            skipped: true,
            rir: undefined,
            notes: log.setNumber === 1 ? (exerciseNotes[log.exerciseId] || undefined) : undefined,
            exerciseRpe: log.setNumber === 1 ? (exerciseRpes[log.exerciseId] || undefined) : undefined,
          }
        }

        // Clean and validate numeric values before submission
        const repsValue = parseInt(log.reps.toString(), 10)
        const weightValue = parseFloat(log.weight.toString())
        const rirStr = String(log.rir ?? '').trim()
        const rirValue = rirStr === '' ? undefined : parseInt(rirStr, 10)

        // Validate cleaned values
        if (isNaN(repsValue) || isNaN(weightValue) || (rirValue !== undefined && isNaN(rirValue))) {
          throw new Error('Invalid numeric value in exercise log')
        }

        return {
          exerciseId: log.exerciseId,
          setNumber: log.setNumber,
          reps: repsValue,
          weight: weightValue,
          rir: rirValue,
          skipped: false,
          notes: log.setNumber === 1 ? (exerciseNotes[log.exerciseId] || undefined) : undefined,
          exerciseRpe: log.setNumber === 1 ? (exerciseRpes[log.exerciseId] || undefined) : undefined,
        }
      }),
    }

    try {
      const response = await fetch('/api/workout-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok && workout) {
        // Fetch next workout after successful save
        await fetchNextWorkout()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Server error:', errorData)
        alert(`Failed to save workout log: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving workout log:', error)
      alert(`Failed to save workout log: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

      {/* Sticky header on mobile */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-6 md:static md:border-0 md:mx-0 md:px-0 md:py-0 md:mb-6">
        <Card className="md:mb-0">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{workout.name}</h1>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Started {startTime.toLocaleTimeString()}
                </p>
              </div>
              <Button onClick={handleComplete} disabled={saving} className="shrink-0">
                {saving ? 'Saving...' : 'Complete'}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Warmup Section */}
      {(workout.warmupNotes || workout.microcycle.mesocycle.warmupNotes) && (
        <Card className="mb-6 bg-gray-900 border-gray-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">🔥 Warmup</h2>
          </CardHeader>
          <CardBody>
            {workout.warmupNotes && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-300 mb-1">Workout Warmup:</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{workout.warmupNotes}</p>
              </div>
            )}
            {!workout.warmupNotes && workout.microcycle.mesocycle.warmupNotes && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">Phase Warmup:</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{workout.microcycle.mesocycle.warmupNotes}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Vertical exercise cards */}
      {(() => {
        const supersetGroups = calculateSupersetGroups(workout.workoutExercises)

        return workout.workoutExercises.map((we, index) => {
          const setsForExercise = exerciseLogs.filter(
            (log) => log.exerciseId === we.exercise.id
          )

          const supersetGroup = supersetGroups.get(we.exercise.id)
          const isInSuperset = supersetGroup !== null

          // Check if next exercise is also part of this superset
          const nextExercise = workout.workoutExercises[index + 1]
          const isLastInSuperset = !nextExercise || !nextExercise.supersetWithPrevious
          const showRestTimer = we.restPeriod != null && (!we.supersetWithPrevious || isLastInSuperset)

          return (
            <Card
              key={we.id}
              className={`${isInSuperset ? 'mb-2 border-l-4 border-l-primary-500 bg-primary-50' : 'mb-6'}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{we.exercise.name}</h2>
                      {isInSuperset && (
                        <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded">
                          SS{supersetGroup}
                        </span>
                      )}
                      {completedExercises.has(we.exercise.id) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Target: {we.targetSets} sets × {we.targetReps} reps
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExercise({ id: we.exercise.id, name: we.exercise.name })
                      setShowLiftHistory(true)
                    }}
                    className="text-xl hover:opacity-70 transition"
                    aria-label="View lift history"
                  >
                    📊
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {we.targetRir != null && (
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                      RIR {we.targetRir}
                    </span>
                  )}
                  {we.tempo != null && (
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                      Tempo {we.tempo}
                    </span>
                  )}
                  {showRestTimer && (
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                      Rest {formatTimer(we.restPeriod!)}
                    </span>
                  )}
                </div>
              {we.notes && (
                <p className="text-sm text-gray-600 mt-2 italic">{we.notes}</p>
              )}
            </CardHeader>
            <CardBody>
              <div className={`grid ${we.exercise.isUnilateral ? 'grid-cols-[2rem_1fr_0.8fr_0.8fr_0.8fr]' : 'grid-cols-[2rem_1fr_1fr_1fr]'} gap-2 pb-2 border-b mb-3`}>
                <div />
                <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Weight (kg)</div>
                {we.exercise.isUnilateral ? (
                  <>
                    <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Left</div>
                    <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Right</div>
                  </>
                ) : (
                  <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Reps</div>
                )}
                <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">RIR</div>
              </div>

              <div className="space-y-4">
                {setsForExercise.map((log) => {
                  const timerKey = `${log.exerciseId}-${log.setNumber}`
                  const isTimerActive = activeTimerKey === timerKey
                  const isFlashing = isTimerActive && timerFlashing

                  if (log.skipped) {
                    return (
                      <div
                        key={timerKey}
                        className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-200 rounded-md px-3 py-3"
                      >
                        <span className="text-sm md:text-base font-semibold text-gray-600 w-[2rem] line-through">{log.setNumber}</span>
                        <span className="text-sm md:text-base font-medium text-yellow-700 flex-1 line-through">⊘ Skipped</span>
                        <Button variant="ghost" size="sm" className="min-h-[36px] text-yellow-700 hover:bg-yellow-100" onClick={() => skipSet(log.exerciseId, log.setNumber)}>
                          Unskip
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="min-h-[36px]"
                          onClick={() => {
                            setSetToDelete({ exerciseId: log.exerciseId, setNumber: log.setNumber })
                            setShowDeleteModal(true)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )
                  }

                  return (
                    <div key={timerKey} className="space-y-2">
                      {/* Larger touch targets for mobile - min 44px height */}
                      <div className={`grid ${we.exercise.isUnilateral ? 'grid-cols-[2rem_1fr_0.8fr_0.8fr_0.8fr]' : 'grid-cols-[2rem_1fr_1fr_1fr]'} gap-2 items-center`}>
                        <span className={`text-sm md:text-base font-semibold ${completedExercises.has(we.exercise.id) ? 'text-gray-400' : 'text-gray-600'}`}>{log.setNumber}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9.]*"
                          placeholder="0"
                          value={log.weight}
                          onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'weight', e.target.value)}
                          onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'weight', log.weight)}
                          className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
                        />
                        {we.exercise.isUnilateral ? (
                          <>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              value={log.repsLeft ?? ''}
                              onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'repsLeft', e.target.value)}
                              onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'repsLeft', log.repsLeft ?? '')}
                              className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              value={log.repsRight ?? ''}
                              onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'repsRight', e.target.value)}
                              onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'repsRight', log.repsRight ?? '')}
                              className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
                            />
                          </>
                        ) : (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={log.reps}
                            onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'reps', e.target.value)}
                            onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'reps', log.reps)}
                            className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
                          />
                        )}
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="—"
                          value={log.rir ?? ''}
                          onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'rir', e.target.value)}
                          onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'rir', log.rir ?? '')}
                          className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
                        />
                      </div>
                      <div className="ml-[2.5rem] space-y-2">
                        {/* Better spacing and larger buttons for mobile */}
                        <div className={`flex items-center gap-2 flex-wrap ${completedExercises.has(we.exercise.id) ? 'opacity-60' : ''}`}>
                          {showRestTimer && (
                            <Button
                              variant={isFlashing ? 'danger' : isTimerActive ? 'primary' : 'secondary'}
                              size="sm"
                              className={`min-h-[36px] ${isFlashing ? 'animate-pulse' : ''}`}
                              onClick={() => startTimer(log.exerciseId, log.setNumber, we.restPeriod!)}
                            >
                              {isTimerActive ? formatTimer(timerSecondsLeft) : `Rest ${formatTimer(we.restPeriod!)}`}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[36px] text-yellow-600 hover:bg-yellow-50 border border-yellow-300"
                            onClick={() => skipSet(log.exerciseId, log.setNumber)}
                          >
                            Skip
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="min-h-[36px]"
                            onClick={() => {
                              setSetToDelete({ exerciseId: log.exerciseId, setNumber: log.setNumber })
                              setShowDeleteModal(true)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4">
                <Button
                  onClick={() => addSet(we.exercise.id)}
                  variant="secondary"
                  size="sm"
                  className="min-h-[40px] w-full md:w-auto"
                >
                  + Add Set
                </Button>
              </div>

              {/* Exercise-level RPE (1-5 scale) */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How hard was this exercise?
                </label>
                <select
                  value={exerciseRpes[we.exercise.id] || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined
                    if (value) {
                      setExerciseRpes({
                        ...exerciseRpes,
                        [we.exercise.id]: value,
                      })
                    } else {
                      const newRpes = { ...exerciseRpes }
                      delete newRpes[we.exercise.id]
                      setExerciseRpes(newRpes)
                    }
                  }}
                  className="w-full px-3 py-3 md:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select RPE (optional)</option>
                  <option value="1">1 - Too Easy</option>
                  <option value="2">2 - Easy</option>
                  <option value="3">3 - Just Right</option>
                  <option value="4">4 - Hard</option>
                  <option value="5">5 - Too Much</option>
                </select>
              </div>

              {/* Exercise-level notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercise Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for this exercise…"
                  value={exerciseNotes[we.exercise.id] || ''}
                  onChange={(e) => {
                    setExerciseNotes({
                      ...exerciseNotes,
                      [we.exercise.id]: e.target.value,
                    })
                  }}
                  className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
                />
              </div>

              {/* Complete Exercise button */}
              {completedExercises.has(we.exercise.id) ? (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 font-medium">Exercise Completed</span>
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    onClick={() => completeExercise(we.exercise.id)}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    ✓ Complete Exercise
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
          )
        })
      })()}

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
              Total Sets Logged: {exerciseLogs.filter((l) => !l.skipped).length}
              {exerciseLogs.some((l) => l.skipped) && (
                <span className="text-gray-400"> ({exerciseLogs.filter((l) => l.skipped).length} skipped)</span>
              )}
            </p>
            <p className="text-sm text-gray-600">
              Duration: {Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60)} minutes
            </p>
            {Object.values(exerciseRpes).filter(rpe => rpe !== undefined && rpe > 0).length > 0 && (
              <p className="text-sm text-gray-600">
                Overall RPE: {
                  (() => {
                    const rpeValues = Object.values(exerciseRpes).filter(rpe => rpe !== undefined && rpe > 0)
                    const avg = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
                    return avg.toFixed(1)
                  })()
                } / 5
              </p>
            )}
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

      {/* Incomplete Sets Warning Modal */}
      <Modal
        isOpen={showIncompleteModal}
        onClose={() => setShowIncompleteModal(false)}
        title="Incomplete Sets"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {incompleteSetsCount} {incompleteSetsCount === 1 ? 'set is' : 'sets are'} incomplete (missing weight or reps).
          </p>
          <p className="text-gray-700">
            Incomplete sets will be marked as skipped. Do you want to continue?
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowIncompleteModal(false)}
            >
              Continue Editing
            </Button>
            <Button
              onClick={handleCompleteWithAutoSkip}
            >
              Complete Workout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Up Next Modal */}
      <Modal
        isOpen={showUpNextModal}
        onClose={() => {
          setShowUpNextModal(false)
          if (workout) {
            router.push(`/microcycles/${workout.microcycle.id}`)
          }
        }}
        title="Workout Complete!"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-lg font-semibold text-green-600">
            ✓ Great work! Workout logged successfully.
          </p>

          {nextWorkout ? (
            <div className="mt-4">
              <p className="text-gray-700 font-medium mb-3">Up Next:</p>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {nextWorkout.name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Week:</span> {nextWorkout.microcycle.weekNumber}
                  </p>
                  {nextWorkout.dayOfWeek !== null && (
                    <p>
                      <span className="font-medium">Day:</span> {DAYS_OF_WEEK[nextWorkout.dayOfWeek]}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Phase:</span> {nextWorkout.microcycle.mesocycle.name}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-700">
                🎉 You&apos;ve completed all workouts in this phase!
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button
              onClick={() => {
                setShowUpNextModal(false)
                if (workout) {
                  router.push(`/microcycles/${workout.microcycle.id}`)
                }
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Set Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSetToDelete(null)
        }}
        title="Remove Set?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to remove this set? This action cannot be undone.
          </p>
          <p className="text-sm text-gray-600">
            Tip: If you didn&apos;t complete this set, consider using <span className="font-semibold text-yellow-600">Skip</span> instead. Skipped sets are preserved in your log.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false)
                setSetToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (setToDelete) {
                  removeSet(setToDelete.exerciseId, setToDelete.setNumber)
                }
                setShowDeleteModal(false)
                setSetToDelete(null)
              }}
            >
              Remove Set
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lift History Modal */}
      {showLiftHistory && selectedExercise && (
        <LiftHistoryModal
          exerciseId={selectedExercise.id}
          exerciseName={selectedExercise.name}
          onClose={() => {
            setShowLiftHistory(false)
            setSelectedExercise(null)
          }}
        />
      )}
    </div>
  )
}
