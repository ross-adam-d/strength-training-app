'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type TemplateExercise = {
  id: string
  orderIndex: number
  targetSets: number
  targetReps: string | null
  targetRir: number | null
  restPeriod: number | null
  notes: string | null
  exercise: { id: string; name: string; muscleGroups: string[] }
}

type TemplateWorkout = {
  id: string
  name: string
  exercises: TemplateExercise[]
  template: { id: string; name: string }
}

type ExerciseOption = { id: string; name: string; muscleGroups: string[] }

const MUSCLE_GROUP_OPTIONS = [
  'chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes',
  'triceps', 'biceps', 'core', 'forearms', 'adductors', 'abductors',
]

export default function TemplateWorkoutEditPage() {
  const { templateId, workoutId } = useParams<{ templateId: string; workoutId: string }>()
  const [workout, setWorkout] = useState<TemplateWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Exercise picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [allExercises, setAllExercises] = useState<ExerciseOption[]>([])
  const [exerciseSearch, setExerciseSearch] = useState('')

  // Create new exercise inline
  const [creatingExercise, setCreatingExercise] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [newExMuscles, setNewExMuscles] = useState<string[]>([])
  const [savingNewEx, setSavingNewEx] = useState(false)

  const fetchWorkout = useCallback(async () => {
    const res = await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}`)
    if (!res.ok) { setError('Workout not found'); setLoading(false); return }
    const data = await res.json()
    setWorkout(data)
    setLoading(false)
  }, [templateId, workoutId])

  useEffect(() => { fetchWorkout() }, [fetchWorkout])

  useEffect(() => {
    fetch('/api/exercises').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllExercises(data)
    })
  }, [])

  async function renameWorkout(name: string) {
    await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setWorkout(prev => prev ? { ...prev, name } : prev)
  }

  async function addExercise(exerciseId: string) {
    const res = await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId, targetSets: 3, targetReps: '8-12' }),
    })
    if (res.ok) {
      const ex = await res.json()
      setWorkout(prev => prev ? { ...prev, exercises: [...prev.exercises, ex] } : prev)
      setExerciseSearch('')
    }
  }

  async function createAndAddExercise() {
    if (!newExName.trim()) return
    setSavingNewEx(true)
    try {
      const createRes = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newExName.trim(), muscleGroups: newExMuscles }),
      })
      if (!createRes.ok) {
        const d = await createRes.json()
        alert(d.error || 'Failed to create exercise')
        return
      }
      const newEx: ExerciseOption = await createRes.json()
      setAllExercises(prev => [...prev, newEx])
      await addExercise(newEx.id)
      setNewExName('')
      setNewExMuscles([])
      setCreatingExercise(false)
    } catch {
      alert('Network error')
    } finally {
      setSavingNewEx(false)
    }
  }

  async function deleteExercise(exerciseId: string) {
    await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}/exercises/${exerciseId}`, { method: 'DELETE' })
    setWorkout(prev => prev ? { ...prev, exercises: prev.exercises.filter(e => e.id !== exerciseId) } : prev)
  }

  async function updateExercise(exerciseId: string, patch: Partial<TemplateExercise>) {
    const res = await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}/exercises/${exerciseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setWorkout(prev => prev ? {
        ...prev,
        exercises: prev.exercises.map(e => e.id === exerciseId ? { ...e, ...updated } : e),
      } : prev)
    }
  }

  const filteredExercises = allExercises
    .filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    .slice(0, 25)

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (error || !workout) return <div className="text-center py-20 text-red-500">{error || 'Not found'}</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/coach/templates/${templateId}`} className="text-primary-600 hover:text-primary-700 text-sm">
          ← {workout.template.name}
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Workout header */}
        <div className="p-6 border-b flex items-center justify-between gap-3">
          <input
            defaultValue={workout.name}
            onBlur={e => {
              const trimmed = e.target.value.trim()
              if (trimmed && trimmed !== workout.name) renameWorkout(trimmed)
            }}
            className="text-2xl font-bold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-1 flex-1 min-w-0"
          />
          <button
            onClick={() => {
              setPickerOpen(p => !p)
              setExerciseSearch('')
              setCreatingExercise(false)
              setNewExName('')
              setNewExMuscles([])
            }}
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            + Add Exercise
          </button>
        </div>

        {/* Exercise picker */}
        {pickerOpen && (
          <div className="p-4 bg-gray-50 border-b">
            {!creatingExercise ? (
              <>
                <input
                  type="text"
                  autoFocus
                  placeholder="Search exercises…"
                  value={exerciseSearch}
                  onChange={e => setExerciseSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 mb-2"
                />
                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {filteredExercises.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 text-center">No exercises found</p>
                  ) : filteredExercises.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(ex.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white hover:shadow-sm transition"
                    >
                      <span className="font-medium text-gray-800">{ex.name}</span>
                      {ex.muscleGroups.length > 0 && (
                        <span className="text-gray-400 text-xs ml-2">{ex.muscleGroups.join(', ')}</span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setCreatingExercise(true); setNewExName(exerciseSearch) }}
                  className="mt-2 w-full text-left px-3 py-2 rounded-lg text-sm text-primary-700 hover:bg-primary-50 transition border border-dashed border-primary-300 font-medium"
                >
                  + Create new exercise{exerciseSearch ? ` "${exerciseSearch}"` : ''}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Exercise</p>
                <input
                  type="text"
                  autoFocus
                  placeholder="Exercise name"
                  value={newExName}
                  onChange={e => setNewExName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Muscle groups (optional)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSCLE_GROUP_OPTIONS.map(mg => (
                      <button
                        key={mg}
                        type="button"
                        onClick={() => setNewExMuscles(prev =>
                          prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg]
                        )}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          newExMuscles.includes(mg)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {mg}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createAndAddExercise}
                    disabled={savingNewEx || !newExName.trim()}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition"
                  >
                    {savingNewEx ? 'Creating…' : 'Create & Add'}
                  </button>
                  <button
                    onClick={() => { setCreatingExercise(false); setNewExName(''); setNewExMuscles([]) }}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exercise list */}
        {workout.exercises.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-400 text-sm">No exercises yet — click &ldquo;Add Exercise&rdquo; above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {workout.exercises.map((ex, ei) => (
              <div key={ex.id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-gray-400 w-5 text-center flex-shrink-0">{ei + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ex.exercise.name}</p>
                  {ex.exercise.muscleGroups.length > 0 && (
                    <p className="text-xs text-gray-400 truncate">{ex.exercise.muscleGroups.join(', ')}</p>
                  )}
                </div>
                {/* Sets */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <label className="text-xs text-gray-500">Sets</label>
                  <input
                    type="number"
                    defaultValue={ex.targetSets}
                    min={1} max={20}
                    onBlur={e => updateExercise(ex.id, { targetSets: parseInt(e.target.value) || 3 })}
                    className="w-12 px-1.5 py-1 text-sm text-center border border-gray-200 rounded focus:ring-1 focus:ring-primary-400 focus:outline-none"
                  />
                </div>
                {/* Reps */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <label className="text-xs text-gray-500">Reps</label>
                  <input
                    type="text"
                    defaultValue={ex.targetReps ?? ''}
                    placeholder="8-12"
                    onBlur={e => updateExercise(ex.id, { targetReps: e.target.value || null })}
                    className="w-16 px-1.5 py-1 text-sm text-center border border-gray-200 rounded focus:ring-1 focus:ring-primary-400 focus:outline-none"
                  />
                </div>
                {/* RIR */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  <label className="text-xs text-gray-500">RIR</label>
                  <input
                    type="number"
                    defaultValue={ex.targetRir ?? ''}
                    min={0} max={5}
                    placeholder="—"
                    onBlur={e => updateExercise(ex.id, { targetRir: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-12 px-1.5 py-1 text-sm text-center border border-gray-200 rounded focus:ring-1 focus:ring-primary-400 focus:outline-none"
                  />
                </div>
                {/* Rest */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  <label className="text-xs text-gray-500">Rest</label>
                  <input
                    type="number"
                    defaultValue={ex.restPeriod ?? ''}
                    min={0}
                    placeholder="s"
                    onBlur={e => updateExercise(ex.id, { restPeriod: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-14 px-1.5 py-1 text-sm text-center border border-gray-200 rounded focus:ring-1 focus:ring-primary-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => deleteExercise(ex.id)}
                  className="text-gray-300 hover:text-red-400 transition p-1 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
