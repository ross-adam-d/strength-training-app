'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'

interface WorkoutExercise {
  id: string
  orderIndex: number
  targetSets: number
  targetReps: string
  targetRpe?: number
  targetRir?: number
  tempo?: string
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
  weight: number | string
  rir?: number | string
  notes?: string
  skipped: boolean
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
        if (data.workoutLogs && data.workoutLogs.length > 0) {
          for (const el of data.workoutLogs[0].exerciseLogs) {
            if (!lastLogSets.has(el.exerciseId)) lastLogSets.set(el.exerciseId, [])
            lastLogSets.get(el.exerciseId)!.push(el)
          }
        }

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

    const invalidLogs = nonSkipped.filter(
      (log) => log.reps === '' || log.weight === ''
    )

    if (invalidLogs.length > 0) {
      alert('Please fill in reps and weight for all non-skipped sets')
      return
    }

    setSaving(true)

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)

    const data = {
      workoutId: params.id,
      duration,
      notes: overallNotes,
      overallRating,
      exerciseLogs: exerciseLogs.map((log) => {
        if (log.skipped) {
          return {
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: 0,
            weight: 0,
            skipped: true,
            rir: undefined,
            notes: log.notes,
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
          notes: log.notes,
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
        router.push(`/microcycles/${workout.microcycle.id}`)
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
      {workout.workoutExercises.map((we) => {
        const setsForExercise = exerciseLogs.filter(
          (log) => log.exerciseId === we.exercise.id
        )

        return (
          <Card key={we.id} className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-bold">{we.exercise.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Target: {we.targetSets} sets × {we.targetReps} reps
              </p>
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
                {we.restPeriod != null && (
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                    Rest {formatTimer(we.restPeriod)}
                  </span>
                )}
              </div>
              {we.notes && (
                <p className="text-sm text-gray-600 mt-2 italic">{we.notes}</p>
              )}
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 pb-2 border-b mb-3">
                <div />
                <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Weight (kg)</div>
                <div className="text-xs md:text-sm font-semibold text-gray-500 text-center uppercase tracking-wide">Reps</div>
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
                        className="flex items-center gap-2 bg-gray-100 opacity-60 rounded-md px-3 py-3"
                      >
                        <span className="text-sm md:text-base font-semibold text-gray-600 w-[2rem]">{log.setNumber}</span>
                        <span className="text-sm md:text-base italic text-gray-500 flex-1">Skipped</span>
                        <Button variant="ghost" size="sm" className="min-h-[36px]" onClick={() => skipSet(log.exerciseId, log.setNumber)}>
                          Unskip
                        </Button>
                        <Button variant="danger" size="sm" className="min-h-[36px] min-w-[36px]" onClick={() => removeSet(log.exerciseId, log.setNumber)}>
                          ×
                        </Button>
                      </div>
                    )
                  }

                  return (
                    <div key={timerKey} className="space-y-2">
                      {/* Larger touch targets for mobile - min 44px height */}
                      <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 items-center">
                        <span className="text-sm md:text-base font-semibold text-gray-600">{log.setNumber}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9.]*"
                          placeholder="0"
                          value={log.weight}
                          onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'weight', e.target.value)}
                          onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'weight', log.weight)}
                          className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={log.reps}
                          onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'reps', e.target.value)}
                          onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'reps', log.reps)}
                          className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="—"
                          value={log.rir ?? ''}
                          onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'rir', e.target.value)}
                          onBlur={() => cleanOnBlur(log.exerciseId, log.setNumber, 'rir', log.rir ?? '')}
                          className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="ml-[2.5rem] space-y-2">
                        {/* Better spacing and larger buttons for mobile */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {we.restPeriod != null && (
                            <Button
                              variant={isFlashing ? 'danger' : isTimerActive ? 'primary' : 'secondary'}
                              size="sm"
                              className={`min-h-[36px] ${isFlashing ? 'animate-pulse' : ''}`}
                              onClick={() => startTimer(log.exerciseId, log.setNumber, we.restPeriod!)}
                            >
                              {isTimerActive ? formatTimer(timerSecondsLeft) : `Rest ${formatTimer(we.restPeriod)}`}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[36px]"
                            onClick={() => {
                              if (window.confirm('Skip this set?')) {
                                skipSet(log.exerciseId, log.setNumber)
                              }
                            }}
                          >
                            Skip
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="min-h-[36px] min-w-[36px]"
                            onClick={() => removeSet(log.exerciseId, log.setNumber)}
                          >
                            ×
                          </Button>
                        </div>
                        <input
                          type="text"
                          placeholder="Notes for this set…"
                          value={log.notes || ''}
                          onChange={(e) => updateLog(log.exerciseId, log.setNumber, 'notes', e.target.value)}
                          className="w-full px-3 py-2 text-sm md:text-base border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
                        />
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
            </CardBody>
          </Card>
        )
      })}

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
