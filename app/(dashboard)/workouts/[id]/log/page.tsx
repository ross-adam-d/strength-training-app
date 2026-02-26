'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { LiftHistoryModal } from '@/components/LiftHistoryModal'
import { getSuggestion, estimate1RM } from '@/lib/progressiveOverload'

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
    isTimed: boolean
    isBodyweight: boolean
    equipment: string[]
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
  duration?: number | string  // For timed exercises (in seconds)
  rir?: number | string
  notes?: string
  skipped: boolean
}

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

  // Exercise swap state
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [exerciseToSwap, setExerciseToSwap] = useState<{ workoutExerciseId: string; exerciseId: string; name: string } | null>(null)
  const [allExercises, setAllExercises] = useState<Array<{ id: string; name: string }>>([])
  const [selectedNewExercise, setSelectedNewExercise] = useState('')

  // Rest timer state
  const [activeTimerKey, setActiveTimerKey] = useState<string | null>(null)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0)
  const [timerFlashing, setTimerFlashing] = useState(false)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timed exercise timer state (counts DOWN from target duration)
  const [activeTimedTimerKey, setActiveTimedTimerKey] = useState<string | null>(null)
  const [timedTimerSeconds, setTimedTimerSeconds] = useState(0)
  const [timedTimerFlashing, setTimedTimerFlashing] = useState(false)
  const timedTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Draft state
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // Progressive overload suggestions and all-time PR bests
  const [suggestions, setSuggestions] = useState<Map<string, Map<number, { weight: string; reps: string; duration?: string }>>>(new Map())
  const [allTimeBests, setAllTimeBests] = useState<Record<string, number>>({})

  // Add exercise modal state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [addExerciseForm, setAddExerciseForm] = useState({
    exerciseId: '',
    targetSets: '3',
    targetReps: '8-12',
    targetRir: '2',
    tempo: '',
    restPeriod: '90',
    supersetWithPrevious: false,
    notes: '',
  })
  const [addExerciseValidationErrors, setAddExerciseValidationErrors] = useState<Record<string, string>>({})
  const draftKey = `workout-draft-${params.id}`
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (!saved) return null
      return JSON.parse(saved)
    } catch (error) {
      console.error('Error loading draft:', error)
      return null
    }
  }, [draftKey])

  const fetchWorkout = useCallback(async () => {
    try {
      const response = await fetch(`/api/workouts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkout(data)

        // Check for draft before populating from history
        const draft = loadDraft()
        if (draft) {
          setHasDraft(true)
          setShowDraftModal(true)
          // Don't populate yet - wait for user to choose resume or start fresh
          setLoading(false)
          return
        }

        // Build lookup from most recent completed workout log
        const lastLogSets = new Map<string, { setNumber: number; reps: number; weight: number; rir?: number | null; duration?: number | null }[]>()
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

        // Compute progressive overload suggestions per exercise × set
        const newSuggestions = new Map<string, Map<number, { weight: string; reps: string; duration?: string }>>()
        for (const we of data.workoutExercises) {
          const setMap = new Map<number, { weight: string; reps: string; duration?: string }>()
          for (let i = 0; i < we.targetSets; i++) {
            const lastSet = lastLogSets.get(we.exercise.id)?.find((s) => s.setNumber === i + 1)
            if (we.exercise.isTimed) {
              setMap.set(i + 1, {
                weight: lastSet?.weight ? String(lastSet.weight) : '',
                reps: '',
                duration: lastSet?.duration ? String(lastSet.duration) : '',
              })
            } else {
              const suggestion = getSuggestion(
                lastSet,
                we.targetReps,
                we.exercise.equipment ?? [],
                we.exercise.isBodyweight
              )
              setMap.set(i + 1, suggestion)
            }
          }
          newSuggestions.set(we.exercise.id, setMap)
        }
        setSuggestions(newSuggestions)

        // Initialise empty sets (ghost placeholders handle the suggestions)
        const prepopulated = data.workoutExercises.flatMap((we: WorkoutExercise) =>
          Array.from({ length: we.targetSets }, (_, i) => ({
            exerciseId: we.exercise.id,
            setNumber: i + 1,
            reps: '',
            weight: '',
            rir: undefined,
            notes: '',
            skipped: false,
          }))
        )
        setExerciseLogs(prepopulated)

        // Fetch all-time PR bests for PR detection
        const exerciseIds = data.workoutExercises.map((we: WorkoutExercise) => we.exercise.id)
        if (exerciseIds.length > 0) {
          const bestsRes = await fetch(`/api/exercises/bests?ids=${exerciseIds.join(',')}`)
          if (bestsRes.ok) setAllTimeBests(await bestsRes.json())
        }
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, loadDraft])

  const fetchExercises = useCallback(async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setAllExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }, [])

  // Compute which sets are PRs (new all-time best estimated 1RM)
  const prSets = useMemo(() => {
    const result = new Set<string>()
    for (const log of exerciseLogs) {
      if (log.skipped) continue
      const weight = parseFloat(String(log.weight))
      const reps = parseInt(String(log.reps))
      if (!weight || !reps || weight <= 0 || reps <= 0) continue
      const oneRM = estimate1RM(weight, reps)
      const best = allTimeBests[log.exerciseId]
      if (best !== undefined && oneRM > best) {
        result.add(`${log.exerciseId}-${log.setNumber}`)
      }
    }
    return result
  }, [exerciseLogs, allTimeBests])

  const saveDraft = useCallback(() => {
    if (!workout) return

    const draft = {
      exerciseLogs,
      exerciseNotes,
      exerciseRpes,
      completedExercises: Array.from(completedExercises),
      overallNotes,
      overallRating,
      startTime: startTime.toISOString(),
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem(draftKey, JSON.stringify(draft))
    setLastSavedAt(new Date())
  }, [workout, exerciseLogs, exerciseNotes, exerciseRpes, completedExercises, overallNotes, overallRating, startTime, draftKey])

  useEffect(() => {
    fetchWorkout()
    fetchExercises()
  }, [fetchWorkout, fetchExercises])

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

  // Timed exercise timer tick effect (counts DOWN from target duration)
  useEffect(() => {
    if (timedTimerIntervalRef.current) {
      clearInterval(timedTimerIntervalRef.current)
      timedTimerIntervalRef.current = null
    }

    if (activeTimedTimerKey === null) return

    timedTimerIntervalRef.current = setInterval(() => {
      setTimedTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timedTimerIntervalRef.current!)
          timedTimerIntervalRef.current = null
          playBeep()
          setTimedTimerFlashing(true)
          setTimeout(() => {
            setTimedTimerFlashing(false)
            setActiveTimedTimerKey(null)
            setTimedTimerSeconds(0)
          }, 2000)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timedTimerIntervalRef.current) {
        clearInterval(timedTimerIntervalRef.current)
        timedTimerIntervalRef.current = null
      }
    }
  }, [activeTimedTimerKey])

  // Auto-save draft with debouncing
  useEffect(() => {
    if (!workout || loading || hasDraft) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout to save after 2 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft()
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [exerciseLogs, exerciseNotes, exerciseRpes, completedExercises, overallNotes, overallRating, workout, loading, hasDraft, saveDraft])

  function resumeDraft() {
    const draft = loadDraft()
    if (!draft) return

    // Deduplicate sets by exerciseId and setNumber (in case of corrupted draft)
    const uniqueSets = new Map<string, ExerciseLog>()
    draft.exerciseLogs.forEach((log: ExerciseLog) => {
      const key = `${log.exerciseId}-${log.setNumber}`
      uniqueSets.set(key, log)
    })

    setExerciseLogs(Array.from(uniqueSets.values()))
    setExerciseNotes(draft.exerciseNotes)
    setExerciseRpes(draft.exerciseRpes)
    setCompletedExercises(new Set(draft.completedExercises))
    setOverallNotes(draft.overallNotes)
    setOverallRating(draft.overallRating)
    setLastSavedAt(new Date(draft.savedAt))
    setShowDraftModal(false)
    setHasDraft(false)
  }

  function clearDraft() {
    localStorage.removeItem(draftKey)
    setLastSavedAt(null)
  }

  function handleSwapExercise(workoutExerciseId: string, exerciseId: string, name: string) {
    setExerciseToSwap({ workoutExerciseId, exerciseId, name })
    setSelectedNewExercise('')
    setShowSwapModal(true)
  }

  async function confirmSwap() {
    if (!exerciseToSwap || !selectedNewExercise) return

    try {
      const payload = {
        exerciseId: selectedNewExercise,
      }

      const response = await fetch(`/api/workout-exercises/${exerciseToSwap.workoutExerciseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Refresh workout data to show the new exercise
        await fetchWorkout()
        setShowSwapModal(false)
        setExerciseToSwap(null)
        setSelectedNewExercise('')
      }
    } catch (error) {
      console.error('Error swapping exercise:', error)
      alert('Failed to swap exercise')
    }
  }

  async function proceedWithSwap() {
    if (!selectedNewExercise) {
      alert('Please select an exercise')
      return
    }
    await confirmSwap()
  }

  function validateAddExerciseForm(): boolean {
    const errors: Record<string, string> = {}

    // Validate required fields
    if (!addExerciseForm.exerciseId) {
      errors.exerciseId = 'Please select an exercise'
    }

    const targetSets = parseInt(addExerciseForm.targetSets)
    if (!addExerciseForm.targetSets || isNaN(targetSets) || targetSets <= 0) {
      errors.targetSets = 'Target sets must be at least 1'
    }

    setAddExerciseValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleAddExercise() {
    if (!validateAddExerciseForm()) {
      return
    }

    try {
      const payload = {
        workoutId: params.id,
        exerciseId: addExerciseForm.exerciseId,
        targetSets: parseInt(addExerciseForm.targetSets),
        targetReps: addExerciseForm.targetReps || null,
        targetRir: addExerciseForm.targetRir ? parseInt(addExerciseForm.targetRir) : null,
        tempo: addExerciseForm.tempo || null,
        restPeriod: addExerciseForm.restPeriod ? parseInt(addExerciseForm.restPeriod) : null,
        supersetWithPrevious: addExerciseForm.supersetWithPrevious,
        notes: addExerciseForm.notes || null,
        orderIndex: workout?.workoutExercises.length || 0,
      }

      const response = await fetch('/api/workout-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Show validation details if available
        if (errorData.details) {
          const fieldErrors: Record<string, string> = {}
          errorData.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              fieldErrors[err.path[0]] = err.message
            }
          })
          setAddExerciseValidationErrors(fieldErrors)
          alert(`Validation error: ${errorData.details.map((e: any) => e.message).join(', ')}`)
        } else {
          alert(errorData.error || 'Failed to add exercise')
        }
        return
      }

      // Get the newly created exercise data
      const newWorkoutExercise = await response.json()

      // Update workout state directly — avoids triggering the draft modal via fetchWorkout()
      setWorkout(prev => {
        if (!prev) return prev
        return { ...prev, workoutExercises: [...prev.workoutExercises, newWorkoutExercise] }
      })

      // Create empty sets for the new exercise
      const newSets = Array.from({ length: parseInt(addExerciseForm.targetSets) }, (_, i) => ({
        exerciseId: addExerciseForm.exerciseId,
        setNumber: i + 1,
        reps: '',
        weight: '',
        rir: undefined,
        notes: '',
        skipped: false,
      }))

      // Add new sets to existing exerciseLogs
      setExerciseLogs((prevLogs) => [...prevLogs, ...newSets])

      // Close modal and reset form
      setShowAddExerciseModal(false)
      setAddExerciseForm({
        exerciseId: '',
        targetSets: '3',
        targetReps: '8-12',
        targetRir: '2',
        tempo: '',
        restPeriod: '90',
        supersetWithPrevious: false,
        notes: '',
      })
      setAddExerciseValidationErrors({})
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Network error. Please try again.')
    }
  }

  function startFresh() {
    clearDraft()
    setShowDraftModal(false)
    setHasDraft(false)
    // Reset all state before fetching
    setExerciseLogs([])
    setExerciseNotes({})
    setExerciseRpes({})
    setCompletedExercises(new Set())
    setOverallNotes('')
    setOverallRating(undefined)
    // Trigger normal fetch workflow
    fetchWorkout()
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

  function startTimedTimer(exerciseId: string, setNumber: number) {
    const key = `${exerciseId}-${setNumber}`
    if (activeTimedTimerKey === key) {
      // Stop timer early (before completion)
      setActiveTimedTimerKey(null)
      setTimedTimerSeconds(0)
      setTimedTimerFlashing(false)
      return
    }
    // Start countdown from target duration
    const log = exerciseLogs.find(l => l.exerciseId === exerciseId && l.setNumber === setNumber)
    const targetDuration = log?.duration ? parseInt(String(log.duration)) : 0

    if (targetDuration <= 0) {
      // No target set, do nothing
      return
    }

    setTimedTimerSeconds(targetDuration)
    setActiveTimedTimerKey(key)
  }

  function adjustDuration(exerciseId: string, setNumber: number, adjustment: number) {
    const log = exerciseLogs.find(l => l.exerciseId === exerciseId && l.setNumber === setNumber)
    const currentDuration = log?.duration ? parseInt(String(log.duration)) : 0
    const newDuration = Math.max(0, (isNaN(currentDuration) ? 0 : currentDuration) + adjustment)
    updateLog(exerciseId, setNumber, 'duration', newDuration.toString())
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
    setExerciseLogs((prev) => {
      const exerciseSets = prev.filter((log) => log.exerciseId === exerciseId)
      const setNumber = exerciseSets.length + 1
      return [
        ...prev,
        {
          exerciseId,
          setNumber,
          reps: '',
          weight: '',
          rir: undefined,
          notes: '',
          skipped: false,
        },
      ]
    })
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
    setExerciseLogs((prev) =>
      prev.map((log) =>
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
    setExerciseLogs((prev) =>
      prev
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

    // Check for incomplete sets (handle unilateral vs timed vs regular exercises)
    const invalidLogs = nonSkipped.filter((log) => {
      // Check if exercise is unilateral or timed
      const workoutExercise = workout?.workoutExercises.find(we => we.exercise.id === log.exerciseId)
      const isUnilateral = workoutExercise?.exercise.isUnilateral || false
      const isTimed = workoutExercise?.exercise.isTimed || false

      if (isUnilateral) {
        // For unilateral: check repsLeft, repsRight, and weight
        return log.repsLeft === '' || log.repsLeft === undefined ||
               log.repsRight === '' || log.repsRight === undefined ||
               log.weight === ''
      } else if (isTimed) {
        // For timed: check duration and weight
        return log.duration === '' || log.duration === undefined || log.weight === ''
      } else {
        // For regular: check reps and weight
        return log.reps === '' || log.weight === ''
      }
    })

    if (invalidLogs.length > 0) {
      // Show modal instead of alert
      setIncompleteSetsCount(invalidLogs.length)
      setShowIncompleteModal(true)
      return
    }

    // All sets are valid, proceed with save
    await saveWorkout()
  }

  async function handleCompleteWithAutoSkip() {
    // Compute auto-skipped logs synchronously so we can pass them directly to saveWorkout,
    // avoiding any stale-closure timing issues with React state updates.
    const autoSkippedLogs = exerciseLogs.map((log) => {
      if (log.skipped) return log

      const workoutExercise = workout?.workoutExercises.find(we => we.exercise.id === log.exerciseId)
      const isUnilateral = workoutExercise?.exercise.isUnilateral || false
      const isTimed = workoutExercise?.exercise.isTimed || false

      const isIncomplete = isTimed
        ? (log.duration === '' || log.duration === undefined || log.weight === '')
        : isUnilateral
          ? (log.repsLeft === '' || log.repsLeft === undefined || log.repsRight === '' || log.repsRight === undefined || log.weight === '')
          : (log.reps === '' || log.weight === '')

      if (isIncomplete) {
        return { ...log, skipped: true, reps: '', duration: undefined, weight: '', rir: undefined, notes: '' }
      }
      return log
    })

    setExerciseLogs(autoSkippedLogs)
    setShowIncompleteModal(false)
    await saveWorkout(autoSkippedLogs)
  }

  async function saveWorkout(logsOverride?: ExerciseLog[]) {
    setSaving(true)

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)

    // Calculate overall workout RPE (average of exercise RPEs)
    const rpeValues = Object.values(exerciseRpes).filter(rpe => rpe !== undefined && rpe > 0)
    const overallRpe = rpeValues.length > 0
      ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
      : undefined

    const logsToSave = logsOverride ?? exerciseLogs

    const data = {
      workoutId: params.id,
      duration,
      notes: overallNotes,
      overallRating,
      overallRpe,
      exerciseLogs: logsToSave.map((log) => {
        if (log.skipped) {
          // Check if exercise is unilateral or timed
          const workoutExercise = workout?.workoutExercises.find(we => we.exercise.id === log.exerciseId)
          const isUnilateral = workoutExercise?.exercise.isUnilateral || false
          const isTimed = workoutExercise?.exercise.isTimed || false

          return {
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: 0,
            repsLeft: isUnilateral ? 0 : undefined,
            repsRight: isUnilateral ? 0 : undefined,
            weight: 0,
            duration: isTimed ? 0 : undefined,
            skipped: true,
            rir: undefined,
            notes: log.setNumber === 1 ? (exerciseNotes[log.exerciseId] || undefined) : undefined,
            exerciseRpe: log.setNumber === 1 ? (exerciseRpes[log.exerciseId] || undefined) : undefined,
          }
        }

        // Clean and validate numeric values before submission
        const weightStr = String(log.weight ?? '').trim()
        const weightValue = weightStr === '' ? 0 : parseFloat(weightStr)
        const rirStr = String(log.rir ?? '').trim()
        const rirValue = rirStr === '' ? undefined : parseInt(rirStr, 10)

        // Validate weight and RIR (weight should have been caught by incomplete check, but be defensive)
        if (isNaN(weightValue) || (rirValue !== undefined && isNaN(rirValue))) {
          console.error('Invalid numeric value:', { weight: log.weight, rir: log.rir, weightValue, rirValue })
          throw new Error('Invalid numeric value in exercise log')
        }

        // Handle unilateral vs timed vs regular exercises
        const workoutExercise = workout?.workoutExercises.find(we => we.exercise.id === log.exerciseId)
        const isUnilateral = workoutExercise?.exercise.isUnilateral || false
        const isTimed = workoutExercise?.exercise.isTimed || false

        if (isUnilateral) {
          // For unilateral exercises, send repsLeft and repsRight
          const repsLeftStr = String(log.repsLeft ?? '').trim()
          const repsRightStr = String(log.repsRight ?? '').trim()
          const repsLeftValue = repsLeftStr === '' ? 0 : parseInt(repsLeftStr, 10)
          const repsRightValue = repsRightStr === '' ? 0 : parseInt(repsRightStr, 10)

          if (isNaN(repsLeftValue) || isNaN(repsRightValue)) {
            console.error('Invalid reps for unilateral:', { repsLeft: log.repsLeft, repsRight: log.repsRight, repsLeftValue, repsRightValue })
            throw new Error('Invalid reps value for unilateral exercise')
          }

          return {
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: 0, // Required field, but not used for unilateral
            repsLeft: repsLeftValue,
            repsRight: repsRightValue,
            weight: weightValue,
            rir: rirValue,
            skipped: false,
            notes: log.setNumber === 1 ? (exerciseNotes[log.exerciseId] || undefined) : undefined,
            exerciseRpe: log.setNumber === 1 ? (exerciseRpes[log.exerciseId] || undefined) : undefined,
          }
        } else if (isTimed) {
          // For timed exercises, send duration
          const durationStr = String(log.duration ?? '').trim()
          const durationValue = durationStr === '' ? 0 : parseInt(durationStr, 10)

          if (isNaN(durationValue)) {
            console.error('Invalid duration:', { duration: log.duration, durationValue })
            throw new Error('Invalid duration value in exercise log')
          }

          return {
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: 0, // Required field but not used for timed exercises
            duration: durationValue,
            weight: weightValue,
            rir: rirValue,
            skipped: false,
            notes: log.setNumber === 1 ? (exerciseNotes[log.exerciseId] || undefined) : undefined,
            exerciseRpe: log.setNumber === 1 ? (exerciseRpes[log.exerciseId] || undefined) : undefined,
          }
        } else {
          // For regular exercises, send reps
          const repsStr = String(log.reps ?? '').trim()
          const repsValue = repsStr === '' ? 0 : parseInt(repsStr, 10)

          if (isNaN(repsValue)) {
            console.error('Invalid reps:', { reps: log.reps, repsValue })
            throw new Error('Invalid reps value in exercise log')
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
        }
      }),
    }

    try {
      console.log('Saving workout with data:', JSON.stringify(data, null, 2))

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/workout-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok && workout) {
        // Clear draft on successful save
        clearDraft()
        setSaving(false)
        // Redirect to dashboard
        window.location.assign('/dashboard')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Server error:', errorData)
        console.error('Full error details:', JSON.stringify(errorData, null, 2))
        alert(`Failed to save workout log: ${JSON.stringify(errorData.details || errorData.error || 'Unknown error')}`)
        setSaving(false)
      }
    } catch (error) {
      console.error('Error saving workout log:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        alert('Request timed out after 30 seconds. Please check your connection and try again.')
      } else {
        alert(`Failed to save workout log: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
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
        <a
          href="/dashboard"
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          ← Back to Dashboard
        </a>
      </div>

      {/* Sticky header on mobile */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-6 md:static md:border-0 md:mx-0 md:px-0 md:py-0 md:mb-6">
        <Card className="md:mb-0">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{workout.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs md:text-sm text-gray-600">
                    Started {startTime.toLocaleTimeString()}
                  </p>
                  {lastSavedAt && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ In progress
                    </p>
                  )}
                </div>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSwapExercise(we.id, we.exercise.id, we.exercise.name)}
                      className="text-xl hover:opacity-70 transition"
                      aria-label="Swap exercise"
                      title="Swap exercise"
                    >
                      🔄
                    </button>
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
                <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">{we.exercise.isBodyweight ? 'Weight' : 'Weight (kg)'}</div>
                {we.exercise.isUnilateral ? (
                  <>
                    <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Left</div>
                    <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Right</div>
                  </>
                ) : we.exercise.isTimed ? (
                  <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Duration (sec)</div>
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
                  const isTimedTimerActive = activeTimedTimerKey === timerKey
                  const isTimedFlashing = isTimedTimerActive && timedTimerFlashing

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
                          placeholder={we.exercise.isBodyweight ? 'BW' : (suggestions.get(we.exercise.id)?.get(log.setNumber)?.weight || '')}
                          value={log.weight}
                          onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'weight', e.target.value)}
                          onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'weight', log.weight)}
                          className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-300 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
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
                        ) : we.exercise.isTimed ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={suggestions.get(we.exercise.id)?.get(log.setNumber)?.duration || ''}
                            value={log.duration ?? ''}
                            onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'duration', e.target.value)}
                            onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'duration', log.duration ?? '')}
                            className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-300 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
                          />
                        ) : (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={suggestions.get(we.exercise.id)?.get(log.setNumber)?.reps || ''}
                            value={log.reps}
                            onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'reps', e.target.value)}
                            onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'reps', log.reps)}
                            className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-300 ${completedExercises.has(we.exercise.id) ? 'bg-gray-100 opacity-60' : ''}`}
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
                      {prSets.has(`${log.exerciseId}-${log.setNumber}`) && (
                        <p className="text-xs text-yellow-600 font-semibold ml-[2.5rem]">New PR!</p>
                      )}
                      <div className="ml-[2.5rem] space-y-2">
                        {/* Row 1: Timed exercise timer controls (only for timed exercises) */}
                        {we.exercise.isTimed && (
                          <div className={`flex items-center gap-2 ${completedExercises.has(we.exercise.id) ? 'opacity-60' : ''}`}>
                            <Button
                              variant={isTimedFlashing ? 'danger' : isTimedTimerActive ? 'primary' : 'secondary'}
                              size="sm"
                              className="min-h-[36px]"
                              onClick={() => startTimedTimer(log.exerciseId, log.setNumber)}
                              disabled={completedExercises.has(we.exercise.id)}
                            >
                              {isTimedFlashing ? '✓ Done!' : isTimedTimerActive ? `⏱ ${formatTimer(timedTimerSeconds)}` : '▶ Start Timer'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-[36px] text-gray-600 hover:bg-gray-100"
                              onClick={() => adjustDuration(log.exerciseId, log.setNumber, -5)}
                              disabled={isTimedTimerActive || completedExercises.has(we.exercise.id)}
                            >
                              -5s
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-[36px] text-gray-600 hover:bg-gray-100"
                              onClick={() => adjustDuration(log.exerciseId, log.setNumber, 5)}
                              disabled={isTimedTimerActive || completedExercises.has(we.exercise.id)}
                            >
                              +5s
                            </Button>
                          </div>
                        )}

                        {/* Row 2: Rest timer, Skip, Remove (always visible, fixed layout) */}
                        <div className={`flex items-center gap-2 ${completedExercises.has(we.exercise.id) ? 'opacity-60' : ''}`}>
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

      {/* Add Exercise Button */}
      <div className="mb-4">
        <Button
          onClick={() => setShowAddExerciseModal(true)}
          variant="secondary"
          size="md"
          className="w-full"
        >
          + Add Exercise
        </Button>
      </div>

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
          onClick={() => window.location.assign('/dashboard')}
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

      {/* In-Progress Resume Modal */}
      <Modal
        isOpen={showDraftModal}
        onClose={() => {}} // Prevent closing without choosing
        title="Resume Workout?"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You have an in-progress workout. Would you like to resume where you left off or start fresh?
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={resumeDraft} className="w-full">
              Resume Workout
            </Button>
            <Button variant="secondary" onClick={startFresh} className="w-full">
              Start Fresh
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exercise Swap Modal - Exercise Picker */}
      {showSwapModal && exerciseToSwap && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowSwapModal(false)
            setExerciseToSwap(null)
            setSelectedNewExercise('')
          }}
          title={`Swap ${exerciseToSwap.name}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a replacement exercise for this workout:
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Exercise
              </label>
              <select
                value={selectedNewExercise}
                onChange={(e) => setSelectedNewExercise(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select an exercise...</option>
                {allExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={proceedWithSwap} disabled={!selectedNewExercise} className="flex-1">
                Swap Exercise
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSwapModal(false)
                  setExerciseToSwap(null)
                  setSelectedNewExercise('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowAddExerciseModal(false)
            setAddExerciseForm({
              exerciseId: '',
              targetSets: '3',
              targetReps: '8-12',
              targetRir: '2',
              tempo: '',
              restPeriod: '90',
              supersetWithPrevious: false,
              notes: '',
            })
            setAddExerciseValidationErrors({})
          }}
          title="Add Exercise"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercise {addExerciseValidationErrors.exerciseId && <span className="text-red-600 text-xs ml-1">*</span>}
              </label>
              <select
                value={addExerciseForm.exerciseId}
                onChange={(e) => {
                  setAddExerciseForm({ ...addExerciseForm, exerciseId: e.target.value })
                  // Clear error on change
                  if (addExerciseValidationErrors.exerciseId) {
                    setAddExerciseValidationErrors({ ...addExerciseValidationErrors, exerciseId: '' })
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  addExerciseValidationErrors.exerciseId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select Exercise --</option>
                {allExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              {addExerciseValidationErrors.exerciseId && (
                <p className="text-red-600 text-xs mt-1">{addExerciseValidationErrors.exerciseId}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Sets {addExerciseValidationErrors.targetSets && <span className="text-red-600 text-xs ml-1">*</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  value={addExerciseForm.targetSets}
                  onChange={(e) => {
                    setAddExerciseForm({ ...addExerciseForm, targetSets: e.target.value })
                    // Clear error on change
                    const numValue = parseInt(e.target.value)
                    if (addExerciseValidationErrors.targetSets && !isNaN(numValue) && numValue > 0) {
                      setAddExerciseValidationErrors({ ...addExerciseValidationErrors, targetSets: '' })
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    addExerciseValidationErrors.targetSets ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {addExerciseValidationErrors.targetSets && (
                  <p className="text-red-600 text-xs mt-1">{addExerciseValidationErrors.targetSets}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Reps</label>
                <input
                  type="text"
                  value={addExerciseForm.targetReps}
                  onChange={(e) => setAddExerciseForm({ ...addExerciseForm, targetReps: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="8-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target RIR</label>
                <input
                  type="number"
                  min="0"
                  value={addExerciseForm.targetRir}
                  onChange={(e) => setAddExerciseForm({ ...addExerciseForm, targetRir: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rest Period (s)</label>
                <input
                  type="number"
                  min="0"
                  value={addExerciseForm.restPeriod}
                  onChange={(e) => setAddExerciseForm({ ...addExerciseForm, restPeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addExerciseSuperset"
                checked={addExerciseForm.supersetWithPrevious}
                onChange={(e) => setAddExerciseForm({ ...addExerciseForm, supersetWithPrevious: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="addExerciseSuperset" className="text-sm text-gray-700">
                Superset with previous exercise
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo (optional)</label>
              <input
                type="text"
                value={addExerciseForm.tempo}
                onChange={(e) => setAddExerciseForm({ ...addExerciseForm, tempo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="3-0-1-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={addExerciseForm.notes}
                onChange={(e) => setAddExerciseForm({ ...addExerciseForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddExercise} className="flex-1">
                Add Exercise
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddExerciseModal(false)
                  setAddExerciseForm({
                    exerciseId: '',
                    targetSets: '3',
                    targetReps: '8-12',
                    targetRir: '2',
                    tempo: '',
                    restPeriod: '90',
                    supersetWithPrevious: false,
                    notes: '',
                  })
                  setAddExerciseValidationErrors({})
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
