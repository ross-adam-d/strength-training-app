'use client'

import { useEffect, useState, useRef } from 'react'

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
  skipped: boolean
}

interface ExerciseEntry {
  key: string
  exercise: Exercise
  sets: SetRow[]
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

// Rank exercises by muscle group overlap with current workout
function sortByMuscleRelevance(exercises: Exercise[], currentMuscleGroups: Set<string>): Exercise[] {
  if (currentMuscleGroups.size === 0) return exercises
  return [...exercises].sort((a, b) => {
    const aScore = a.muscleGroups.filter((g) => currentMuscleGroups.has(g)).length
    const bScore = b.muscleGroups.filter((g) => currentMuscleGroups.has(g)).length
    if (bScore !== aScore) return bScore - aScore
    return a.name.localeCompare(b.name)
  })
}

// Inline exercise picker with muscle-group sorting + custom create
function ExercisePicker({
  exercises,
  onAdd,
}: {
  exercises: Exercise[]
  onAdd: (exercise: Exercise) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), muscleGroups: [], equipment: [], isPublic: false }),
      })
      if (res.ok) {
        const created = await res.json()
        onAdd({ id: created.id, name: created.name, muscleGroups: [], isUnilateral: false, isTimed: false, isBodyweight: false })
        setCreating(false)
        setNewName('')
        setOpen(false)
        setSearch('')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition"
      >
        <span className="text-lg leading-none">+</span>
        Add Exercise
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              autoFocus
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => { onAdd(ex); setOpen(false); setSearch('') }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 transition flex items-center justify-between"
              >
                <span>{ex.name}</span>
                {ex.muscleGroups.length > 0 && (
                  <span className="text-xs text-gray-400 ml-2 shrink-0">{ex.muscleGroups[0]}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && !creating && (
              <p className="text-xs text-gray-400 px-3 py-3 text-center">No matches</p>
            )}
          </div>
          {creating ? (
            <div className="border-t p-2 flex gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !newName.trim()}
                className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded disabled:opacity-50"
              >
                {saving ? '...' : 'Create'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full border-t text-left text-xs text-primary-600 hover:bg-primary-50 px-3 py-2.5"
            >
              + Create custom exercise
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ManualWorkoutPage() {
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
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

  // Delete confirmation state: { entryKey, setId }
  const [deleteTarget, setDeleteTarget] = useState<{ entryKey: string; setId: number } | null>(null)

  useEffect(() => {
    fetch('/api/exercises?limit=500')
      .then((r) => r.json())
      .then((data) => setAllExercises(Array.isArray(data) ? data : []))
  }, [])

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

  // Collect muscle groups from all current exercises for sorting
  const currentMuscleGroups = new Set(entries.flatMap((e) => e.exercise.muscleGroups))

  // Exercises not already added, sorted by muscle group relevance
  const availableExercises = sortByMuscleRelevance(
    allExercises.filter((ex) => !entries.find((e) => e.exercise.id === ex.id)),
    currentMuscleGroups
  )

  function addExercise(exercise: Exercise) {
    const key = `${exercise.id}-${Date.now()}`
    const firstSet: SetRow = { id: nextSetId(), weight: '', reps: '', repsLeft: '', repsRight: '', rpe: '', skipped: false }
    setEntries((prev) => [...prev, { key, exercise, sets: [firstSet] }])
  }

  function removeExercise(entryKey: string) {
    setEntries((prev) => prev.filter((e) => e.key !== entryKey))
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
        skipped: false,
      }
      return { ...e, sets: [...e.sets, newSet] }
    }))
  }

  function deleteSet(entryKey: string, setId: number) {
    setEntries((prev) => prev.map((e) => {
      if (e.key !== entryKey) return e
      const newSets = e.sets.filter((s) => s.id !== setId)
      return { ...e, sets: newSets }
    }))
    setDeleteTarget(null)
  }

  function skipSet(entryKey: string, setId: number) {
    setEntries((prev) => prev.map((e) => {
      if (e.key !== entryKey) return e
      return {
        ...e,
        sets: e.sets.map((s) =>
          s.id === setId ? { ...s, skipped: !s.skipped, weight: '', reps: '', repsLeft: '', repsRight: '', rpe: '' } : s
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
        if (e.exercise.isUnilateral) {
          return {
            exerciseId: e.exercise.id,
            setNumber: idx + 1,
            reps: 0,
            repsLeft: parseInt(s.repsLeft) || 0,
            repsRight: parseInt(s.repsRight) || 0,
            weight,
            rpe,
            skipped: false,
          }
        }
        return {
          exerciseId: e.exercise.id,
          setNumber: idx + 1,
          reps: parseInt(s.reps) || 0,
          weight,
          rpe,
          skipped: false,
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
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            Finish
          </button>
        </div>
      </div>

      {/* Exercise cards */}
      {entries.map((entry) => {
        const ex = entry.exercise
        return (
          <div key={entry.key} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
            {/* Exercise header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-gray-900">{ex.name}</h2>
                {ex.muscleGroups.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{ex.muscleGroups.join(' · ')}</p>
                )}
              </div>
              <button
                onClick={() => removeExercise(entry.key)}
                className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1"
              >
                Remove
              </button>
            </div>

            {/* Column headers */}
            <div className={`grid ${ex.isUnilateral ? 'grid-cols-[2rem_1fr_0.8fr_0.8fr_0.8fr_2.5rem]' : 'grid-cols-[2rem_1fr_1fr_1fr_2.5rem]'} gap-2 px-4 pt-3 pb-1 border-b border-gray-50`}>
              <div />
              <div className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wide">kg</div>
              {ex.isUnilateral ? (
                <>
                  <div className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wide">L</div>
                  <div className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wide">R</div>
                </>
              ) : (
                <div className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wide">Reps</div>
              )}
              <div className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wide">RPE</div>
              <div />
            </div>

            {/* Set rows */}
            <div className="px-4 py-2 space-y-2">
              {entry.sets.map((s, idx) => {
                const isDeleting = deleteTarget?.entryKey === entry.key && deleteTarget?.setId === s.id
                return (
                  <div key={s.id}>
                    {isDeleting ? (
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-sm text-gray-600 flex-1">Delete set {idx + 1}?</span>
                        <button
                          onClick={() => deleteSet(entry.key, s.id)}
                          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteTarget(null)}
                          className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className={`grid ${ex.isUnilateral ? 'grid-cols-[2rem_1fr_0.8fr_0.8fr_0.8fr_2.5rem]' : 'grid-cols-[2rem_1fr_1fr_1fr_2.5rem]'} gap-2 items-center`}>
                        <span className={`text-xs font-medium text-center ${s.skipped ? 'text-gray-300 line-through' : 'text-gray-500'}`}>
                          {idx + 1}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder={s.skipped ? '—' : '0'}
                          value={s.weight}
                          disabled={s.skipped}
                          onChange={(e) => updateSet(entry.key, s.id, 'weight', e.target.value)}
                          className="w-full text-center text-sm border border-gray-200 rounded-lg px-1 py-2 focus:outline-none focus:border-primary-400 disabled:bg-gray-50 disabled:text-gray-300"
                        />
                        {ex.isUnilateral ? (
                          <>
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder={s.skipped ? '—' : '0'}
                              value={s.repsLeft}
                              disabled={s.skipped}
                              onChange={(e) => updateSet(entry.key, s.id, 'repsLeft', e.target.value)}
                              className="w-full text-center text-sm border border-gray-200 rounded-lg px-1 py-2 focus:outline-none focus:border-primary-400 disabled:bg-gray-50 disabled:text-gray-300"
                            />
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder={s.skipped ? '—' : '0'}
                              value={s.repsRight}
                              disabled={s.skipped}
                              onChange={(e) => updateSet(entry.key, s.id, 'repsRight', e.target.value)}
                              className="w-full text-center text-sm border border-gray-200 rounded-lg px-1 py-2 focus:outline-none focus:border-primary-400 disabled:bg-gray-50 disabled:text-gray-300"
                            />
                          </>
                        ) : (
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder={s.skipped ? '—' : '0'}
                            value={s.reps}
                            disabled={s.skipped}
                            onChange={(e) => updateSet(entry.key, s.id, 'reps', e.target.value)}
                            className="w-full text-center text-sm border border-gray-200 rounded-lg px-1 py-2 focus:outline-none focus:border-primary-400 disabled:bg-gray-50 disabled:text-gray-300"
                          />
                        )}
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="—"
                          step="0.5"
                          min="1"
                          max="10"
                          value={s.rpe}
                          disabled={s.skipped}
                          onChange={(e) => updateSet(entry.key, s.id, 'rpe', e.target.value)}
                          className="w-full text-center text-sm border border-gray-200 rounded-lg px-1 py-2 focus:outline-none focus:border-primary-400 disabled:bg-gray-50 disabled:text-gray-300"
                        />
                        {/* Action menu */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => skipSet(entry.key, s.id)}
                            title={s.skipped ? 'Unskip' : 'Skip'}
                            className={`text-xs px-1 py-0.5 rounded transition ${s.skipped ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {s.skipped ? '↩' : '⊘'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ entryKey: entry.key, setId: s.id })}
                            title="Delete"
                            className="text-xs px-1 py-0.5 rounded text-gray-400 hover:text-red-500 transition"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add set */}
            <div className="px-4 pb-3 pt-1">
              <button
                onClick={() => addSet(entry.key)}
                className="w-full py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                + Add Set
              </button>
            </div>
          </div>
        )
      })}

      {/* Exercise picker */}
      <div className="mt-2">
        <ExercisePicker exercises={availableExercises} onAdd={addExercise} />
      </div>

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
                <button
                  onClick={() => setShowFinish(false)}
                  className="flex-1 py-2.5 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Workout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
