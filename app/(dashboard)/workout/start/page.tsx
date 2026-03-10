'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ExercisePickerModal, ExercisePickerResult } from '@/components/ExercisePickerModal'
import { LiftHistoryModal } from '@/components/LiftHistoryModal'

interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  isUnilateral: boolean
  isTimed: boolean
  isBodyweight: boolean
}

interface SetRow {
  id: number
  weight: string
  reps: string
  repsLeft: string
  repsRight: string
  rpe: string
  rir: string
  skipped: boolean
}

interface ExerciseEntry {
  key: string
  exercise: Exercise
  sets: SetRow[]
  targetReps: string
  targetRir: number | null
  restPeriod: number | null
  tempo: string | null
}

let _setIdCounter = 1
function nextSetId() { return _setIdCounter++ }

function formatTimer(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function ManualWorkoutPage() {
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [startTime] = useState(() => new Date())
  const [elapsed, setElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(Date.now())
  const pausedAtRef = useRef<number | null>(null)

  // Finish modal state
  const [showFinish, setShowFinish] = useState(false)
  const [overallNotes, setOverallNotes] = useState('')
  const [overallRating, setOverallRating] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)

  // Exercise picker modal (add new)
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  // Swap exercise
  const [swapTarget, setSwapTarget] = useState<string | null>(null)

  // Remove exercise confirmation
  const [removeExerciseTarget, setRemoveExerciseTarget] = useState<string | null>(null)

  // Lift history modal
  const [historyExercise, setHistoryExercise] = useState<{ id: string; name: string } | null>(null)

  // Delete confirmation state: { entryKey, setId }
  const [deleteTarget, setDeleteTarget] = useState<{ entryKey: string; setId: number } | null>(null)

  // Rest timer state
  const [activeTimerKey, setActiveTimerKey] = useState<string | null>(null)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0)
  const [timerFlashing, setTimerFlashing] = useState(false)
  const timerEndTimeRef = useRef<number>(0)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Wall-clock-anchored workout timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  // Rest timer countdown
  useEffect(() => {
    if (activeTimerKey) {
      restIntervalRef.current = setInterval(() => {
        const remaining = Math.ceil((timerEndTimeRef.current - Date.now()) / 1000)
        if (remaining <= 0) {
          setTimerSecondsLeft(0)
          setTimerFlashing(true)
          if (restIntervalRef.current) clearInterval(restIntervalRef.current)
        } else {
          setTimerSecondsLeft(remaining)
        }
      }, 250)
    } else {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current) }
  }, [activeTimerKey])

  function toggleTimer() {
    if (timerRunning) {
      pausedAtRef.current = Date.now()
      setTimerRunning(false)
    } else {
      if (pausedAtRef.current) {
        startRef.current += Date.now() - pausedAtRef.current
        pausedAtRef.current = null
      }
      setTimerRunning(true)
    }
  }

  function startRestTimer(entryKey: string, setId: number, restPeriod: number) {
    const key = `${entryKey}-${setId}`
    if (activeTimerKey === key) {
      setActiveTimerKey(null)
      setTimerSecondsLeft(0)
      setTimerFlashing(false)
      return
    }
    timerEndTimeRef.current = Date.now() + restPeriod * 1000
    setActiveTimerKey(key)
    setTimerSecondsLeft(restPeriod)
    setTimerFlashing(false)
  }

  function addExercise(result: ExercisePickerResult) {
    const key = `${result.exercise.id}-${Date.now()}`
    const sets: SetRow[] = Array.from({ length: result.targetSets }, () => ({
      id: nextSetId(), weight: '', reps: '', repsLeft: '', repsRight: '', rpe: '', rir: '', skipped: false,
    }))
    setEntries((prev) => [...prev, {
      key,
      exercise: result.exercise,
      sets,
      targetReps: result.targetReps,
      targetRir: result.targetRir,
      restPeriod: result.restPeriod,
      tempo: result.tempo,
    }])
  }

  function removeExercise(entryKey: string) {
    setEntries((prev) => prev.filter((e) => e.key !== entryKey))
  }

  function moveEntry(entryKey: string, direction: 'up' | 'down') {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.key === entryKey)
      if (direction === 'up' && idx === 0) return prev
      if (direction === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  function addSet(entryKey: string) {
    setEntries((prev) => prev.map((e) => {
      if (e.key !== entryKey) return e
      const last = e.sets[e.sets.length - 1]
      const newSet: SetRow = {
        id: nextSetId(),
        weight: last ? last.weight : '',
        reps: last ? last.reps : '',
        repsLeft: last ? last.repsLeft : '',
        repsRight: last ? last.repsRight : '',
        rpe: last ? last.rpe : '',
        rir: last ? last.rir : '',
        skipped: false,
      }
      return { ...e, sets: [...e.sets, newSet] }
    }))
  }

  function deleteSet(entryKey: string, setId: number) {
    setEntries((prev) => prev.map((e) => {
      if (e.key !== entryKey) return e
      return { ...e, sets: e.sets.filter((s) => s.id !== setId) }
    }))
    setDeleteTarget(null)
    if (activeTimerKey === `${entryKey}-${setId}`) {
      setActiveTimerKey(null)
      setTimerSecondsLeft(0)
      setTimerFlashing(false)
    }
  }

  function skipSet(entryKey: string, setId: number) {
    if (activeTimerKey === `${entryKey}-${setId}`) {
      setActiveTimerKey(null)
      setTimerSecondsLeft(0)
      setTimerFlashing(false)
    }
    setEntries((prev) => prev.map((e) => {
      if (e.key !== entryKey) return e
      return {
        ...e,
        sets: e.sets.map((s) =>
          s.id === setId ? { ...s, skipped: !s.skipped, weight: '', reps: '', repsLeft: '', repsRight: '', rpe: '', rir: '' } : s
        ),
      }
    }))
  }

  function updateSet(entryKey: string, setId: number, field: keyof SetRow, value: string) {
    setEntries((prev) => prev.map((e) => {
      if (e.key !== entryKey) return e
      return { ...e, sets: e.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s) }
    }))
  }

  async function handleComplete() {
    const allSets = entries.flatMap((e) => e.sets.filter((s) => !s.skipped))
    if (allSets.length === 0) {
      alert('Please log at least one set')
      return
    }
    setShowFinish(true)
  }

  async function handleSave() {
    setSaving(true)
    const durationMinutes = Math.round(elapsed / 60)

    const exerciseLogs = entries.flatMap((e) =>
      e.sets.map((s, idx) => {
        if (s.skipped) {
          return {
            exerciseId: e.exercise.id,
            setNumber: idx + 1,
            reps: 0,
            repsLeft: e.exercise.isUnilateral ? 0 : undefined,
            repsRight: e.exercise.isUnilateral ? 0 : undefined,
            weight: 0,
            skipped: true,
          }
        }
        const weight = parseFloat(s.weight) || 0
        const rpe = s.rpe ? parseFloat(s.rpe) : undefined
        const rir = s.rir ? parseInt(s.rir) : undefined
        if (e.exercise.isUnilateral) {
          return {
            exerciseId: e.exercise.id,
            setNumber: idx + 1,
            reps: 0,
            repsLeft: parseInt(s.repsLeft) || 0,
            repsRight: parseInt(s.repsRight) || 0,
            weight, rpe, rir, skipped: false,
          }
        }
        return {
          exerciseId: e.exercise.id,
          setNumber: idx + 1,
          reps: parseInt(s.reps) || 0,
          weight, rpe, rir, skipped: false,
        }
      })
    )

    try {
      const res = await fetch('/api/workout-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: durationMinutes,
          notes: overallNotes || undefined,
          overallRating,
          exerciseLogs,
        }),
      })
      if (res.ok) {
        window.location.assign('/dashboard')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to save workout')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full text-center text-sm border border-gray-300 rounded-md px-1 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-6 md:static md:border-0 md:mx-0 md:px-0 md:py-0 md:mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Workout — {startTime.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-base font-bold text-gray-900 tabular-nums">
                {formatTimer(elapsed)}
              </span>
              <button
                onClick={toggleTimer}
                className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                {timerRunning ? '⏸' : '▶'}
              </button>
            </div>
          </div>
          <Button onClick={handleComplete} size="md">
            Finish
          </Button>
        </div>
      </div>

      {/* Exercise cards */}
      {entries.map((entry, index) => {
        const ex = entry.exercise
        const colsCls = ex.isUnilateral
          ? 'grid-cols-[2rem_1fr_0.8fr_0.8fr_1fr]'
          : 'grid-cols-[2rem_1fr_1fr_1fr]'

        return (
          <div key={entry.key} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            {/* Remove exercise confirmation */}
            {removeExerciseTarget === entry.key && (
              <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-3">
                <span className="text-sm text-gray-700 flex-1">Remove <span className="font-semibold">{ex.name}</span> from this workout?</span>
                <Button variant="danger" size="sm" onClick={() => { removeExercise(entry.key); setRemoveExerciseTarget(null) }}>Remove</Button>
                <Button variant="secondary" size="sm" onClick={() => setRemoveExerciseTarget(null)}>Cancel</Button>
              </div>
            )}
            {/* Exercise header — matches planned workout style */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">{ex.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Target: {entry.sets.length} sets × {entry.targetReps || '—'} reps
                  </p>
                </div>
                {/* Reorder + swap + history + remove */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveEntry(entry.key, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none"
                      aria-label="Move exercise up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveEntry(entry.key, 'down')}
                      disabled={index === entries.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none"
                      aria-label="Move exercise down"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    onClick={() => setSwapTarget(entry.key)}
                    className="text-xl hover:opacity-70 transition"
                    aria-label="Swap exercise"
                    title="Swap exercise"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => setHistoryExercise({ id: ex.id, name: ex.name })}
                    className="text-xl hover:opacity-70 transition"
                    aria-label="View lift history"
                    title="View lift history"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => setRemoveExerciseTarget(entry.key)}
                    className="text-xl hover:opacity-70 transition"
                    aria-label="Remove exercise"
                    title="Remove exercise"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {entry.targetRir != null && (
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                    RIR {entry.targetRir}
                  </span>
                )}
                {entry.tempo && (
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                    Tempo {entry.tempo}
                  </span>
                )}
                {entry.restPeriod != null && entry.restPeriod > 0 && (
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                    Rest {formatTimer(entry.restPeriod)}
                  </span>
                )}
              </div>
            </div>

            {/* Column headers */}
            <div className={`grid ${colsCls} gap-2 px-4 pt-3 pb-1 border-b border-gray-50`}>
              <div />
              <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">
                {ex.isBodyweight ? 'Weight' : 'Weight (kg)'}
              </div>
              {ex.isUnilateral ? (
                <>
                  <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">Left</div>
                  <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">Right</div>
                </>
              ) : (
                <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">Reps</div>
              )}
              <div className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">RIR</div>
            </div>

            {/* Set rows */}
            <div className="px-4 py-2 space-y-4">
              {entry.sets.map((s, idx) => {
                const timerKey = `${entry.key}-${s.id}`
                const isTimerActive = activeTimerKey === timerKey
                const isFlashing = isTimerActive && timerFlashing
                const isDeleting = deleteTarget?.entryKey === entry.key && deleteTarget?.setId === s.id
                const hasRest = entry.restPeriod != null && entry.restPeriod > 0

                return (
                  <div key={s.id}>
                    {isDeleting ? (
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-sm text-gray-600 flex-1">Delete set {idx + 1}?</span>
                        <Button variant="danger" size="sm" onClick={() => deleteSet(entry.key, s.id)}>Delete</Button>
                        <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                      </div>
                    ) : s.skipped ? (
                      <div className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-200 rounded-md px-3 py-3">
                        <span className="text-sm font-semibold text-gray-600 w-[2rem] line-through">{idx + 1}</span>
                        <span className="text-sm font-medium text-yellow-700 flex-1 line-through">⊘ Skipped</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[36px] text-yellow-600 hover:bg-yellow-100 border border-yellow-300"
                          onClick={() => skipSet(entry.key, s.id)}
                        >
                          Unskip
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="min-h-[36px]"
                          onClick={() => setDeleteTarget({ entryKey: entry.key, setId: s.id })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Input row */}
                        <div className={`grid ${colsCls} gap-2 items-center`}>
                          <span className="text-sm font-semibold text-gray-600 text-center">{idx + 1}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9.]*"
                            placeholder={ex.isBodyweight ? 'BW' : '0'}
                            value={s.weight}
                            onChange={(e) => updateSet(entry.key, s.id, 'weight', e.target.value)}
                            className={inputCls}
                          />
                          {ex.isUnilateral ? (
                            <>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                                value={s.repsLeft}
                                onChange={(e) => updateSet(entry.key, s.id, 'repsLeft', e.target.value)}
                                className={inputCls}
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                                value={s.repsRight}
                                onChange={(e) => updateSet(entry.key, s.id, 'repsRight', e.target.value)}
                                className={inputCls}
                              />
                            </>
                          ) : (
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              value={s.reps}
                              onChange={(e) => updateSet(entry.key, s.id, 'reps', e.target.value)}
                              className={inputCls}
                            />
                          )}
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="—"
                            value={s.rir}
                            onChange={(e) => updateSet(entry.key, s.id, 'rir', e.target.value)}
                            className={inputCls}
                          />
                        </div>

                        {/* Action row */}
                        <div className="ml-[2.5rem] flex items-center gap-2">
                          {hasRest && (
                            <Button
                              variant={isFlashing ? 'danger' : isTimerActive ? 'primary' : 'secondary'}
                              size="sm"
                              className={`min-h-[36px] ${isFlashing ? 'animate-pulse' : ''}`}
                              onClick={() => startRestTimer(entry.key, s.id, entry.restPeriod!)}
                            >
                              {isTimerActive ? formatTimer(timerSecondsLeft) : `Rest ${formatTimer(entry.restPeriod!)}`}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[36px] text-yellow-600 hover:bg-yellow-50 border border-yellow-300"
                            onClick={() => skipSet(entry.key, s.id)}
                          >
                            Skip
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="min-h-[36px]"
                            onClick={() => setDeleteTarget({ entryKey: entry.key, setId: s.id })}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add set */}
            <div className="px-4 pb-4 pt-1">
              <Button variant="secondary" size="sm" className="min-h-[40px] w-full" onClick={() => addSet(entry.key)}>
                + Add Set
              </Button>
            </div>
          </div>
        )
      })}

      {/* Add exercise button */}
      <div className="mt-2">
        <Button size="md" className="w-full py-3" onClick={() => setShowExercisePicker(true)}>
          + Add Exercise
        </Button>
      </div>

      {/* Add exercise picker */}
      <ExercisePickerModal
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onAdd={(result) => { addExercise(result); setShowExercisePicker(false) }}
        mode="plan"
        existingExerciseIds={entries.map((e) => e.exercise.id)}
        currentMuscleGroups={Array.from(new Set(entries.flatMap((e) => e.exercise.muscleGroups)))}
      />

      {/* Swap exercise picker */}
      <ExercisePickerModal
        open={swapTarget !== null}
        onClose={() => setSwapTarget(null)}
        onAdd={(result) => {
          setEntries((prev) => prev.map((e) =>
            e.key === swapTarget ? { ...e, exercise: result.exercise } : e
          ))
          setSwapTarget(null)
        }}
        mode="log"
        existingExerciseIds={entries.filter((e) => e.key !== swapTarget).map((e) => e.exercise.id)}
        title="Swap Exercise"
      />

      {/* Lift history modal */}
      {historyExercise && (
        <LiftHistoryModal
          exerciseId={historyExercise.id}
          exerciseName={historyExercise.name}
          onClose={() => setHistoryExercise(null)}
        />
      )}

      {/* Finish workout modal */}
      {showFinish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Finish Workout</h2>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Duration</span>
                <span className="font-semibold text-gray-900">{formatTimer(elapsed)}</span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setOverallRating(overallRating === r ? undefined : r)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                        overallRating === r
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="How did it go?"
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowFinish(false)}>
                  Back
                </Button>
                <Button size="md" className="flex-1" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving...' : 'Save Workout'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
