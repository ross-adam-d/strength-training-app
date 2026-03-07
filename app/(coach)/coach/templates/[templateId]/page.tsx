'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const FOCUS_OPTIONS = ['hypertrophy', 'strength', 'power', 'endurance', 'deload']
const GOAL_OPTIONS = ['Hypertrophy', 'Strength', 'Power', 'Maintenance', 'Deload']
const SPLIT_OPTIONS = ['Full Body', 'Upper/Lower', 'Push/Pull/Legs', 'Push/Pull', 'Bro Split', 'Olympic Lifts', 'Custom']
const FOCUS_COLOURS: Record<string, string> = {
  hypertrophy: 'bg-blue-100 text-blue-700',
  strength:    'bg-orange-100 text-orange-700',
  power:       'bg-purple-100 text-purple-700',
  endurance:   'bg-green-100 text-green-700',
  deload:      'bg-gray-100 text-gray-600',
}

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
  orderIndex: number
  exercises: TemplateExercise[]
}

type Template = {
  id: string
  name: string
  description: string | null
  focus: string | null
  goal: string | null
  trainingSplit: string | null
  daysPerWeek: number | null
  defaultWeeks: number
  warmupNotes: string | null
  workouts: TemplateWorkout[]
}

type ExerciseOption = { id: string; name: string; muscleGroups: string[] }

export default function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Metadata edit state
  const [editMeta, setEditMeta] = useState(false)
  const [meta, setMeta] = useState({ name: '', description: '', focus: '', goal: '', trainingSplit: '', daysPerWeek: 4, defaultWeeks: 4 })

  // Add workout
  const [addingWorkout, setAddingWorkout] = useState(false)
  const [newWorkoutName, setNewWorkoutName] = useState('')

  // Exercise picker
  const [pickerWorkoutId, setPickerWorkoutId] = useState<string | null>(null)
  const [allExercises, setAllExercises] = useState<ExerciseOption[]>([])
  const [exerciseSearch, setExerciseSearch] = useState('')

  // Fetch template
  const fetchTemplate = useCallback(async () => {
    const res = await fetch(`/api/coach/templates/${templateId}`)
    if (!res.ok) { setError('Template not found'); setLoading(false); return }
    const data = await res.json()
    setTemplate(data)
    setMeta({
      name: data.name,
      description: data.description ?? '',
      focus: data.focus ?? '',
      goal: data.goal ?? '',
      trainingSplit: data.trainingSplit ?? '',
      daysPerWeek: data.daysPerWeek ?? 4,
      defaultWeeks: data.defaultWeeks,
    })
    setLoading(false)
  }, [templateId])

  useEffect(() => { fetchTemplate() }, [fetchTemplate])

  // Fetch exercises once for picker
  useEffect(() => {
    fetch('/api/exercises').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllExercises(data)
    })
  }, [])

  async function saveMeta() {
    setSaving(true)
    const res = await fetch(`/api/coach/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: meta.name.trim(),
        description: meta.description.trim() || null,
        focus: meta.focus || null,
        goal: meta.goal || null,
        trainingSplit: meta.trainingSplit || null,
        daysPerWeek: meta.daysPerWeek,
        defaultWeeks: meta.defaultWeeks,
      }),
    })
    if (res.ok) {
      await fetchTemplate()
      setEditMeta(false)
    }
    setSaving(false)
  }

  async function addWorkout() {
    if (!newWorkoutName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/coach/templates/${templateId}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newWorkoutName.trim() }),
    })
    if (res.ok) {
      const workout = await res.json()
      setTemplate(prev => prev ? { ...prev, workouts: [...prev.workouts, workout] } : prev)
      setNewWorkoutName('')
      setAddingWorkout(false)
    }
    setSaving(false)
  }

  async function deleteWorkout(workoutId: string) {
    if (!confirm('Remove this workout from the template?')) return
    await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}`, { method: 'DELETE' })
    setTemplate(prev => prev ? { ...prev, workouts: prev.workouts.filter(w => w.id !== workoutId) } : prev)
  }

  async function renameWorkout(workoutId: string, name: string) {
    await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  async function addExercise(workoutId: string, exerciseId: string) {
    const res = await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId, targetSets: 3, targetReps: '8-12' }),
    })
    if (res.ok) {
      const ex = await res.json()
      setTemplate(prev => {
        if (!prev) return prev
        return {
          ...prev,
          workouts: prev.workouts.map(w =>
            w.id === workoutId ? { ...w, exercises: [...w.exercises, ex] } : w
          ),
        }
      })
      setExerciseSearch('')
    }
  }

  async function deleteExercise(workoutId: string, exerciseId: string) {
    await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}/exercises/${exerciseId}`, { method: 'DELETE' })
    setTemplate(prev => {
      if (!prev) return prev
      return {
        ...prev,
        workouts: prev.workouts.map(w =>
          w.id === workoutId ? { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) } : w
        ),
      }
    })
  }

  async function updateExercise(workoutId: string, exerciseId: string, patch: Partial<TemplateExercise>) {
    const res = await fetch(`/api/coach/templates/${templateId}/workouts/${workoutId}/exercises/${exerciseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setTemplate(prev => {
        if (!prev) return prev
        return {
          ...prev,
          workouts: prev.workouts.map(w =>
            w.id === workoutId
              ? { ...w, exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, ...updated } : e) }
              : w
          ),
        }
      })
    }
  }

  async function deleteTemplate() {
    if (!confirm('Delete this template permanently? This cannot be undone.')) return
    await fetch(`/api/coach/templates/${templateId}`, { method: 'DELETE' })
    window.location.assign('/coach/templates')
  }

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  ).slice(0, 20)

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (error || !template) return <div className="text-center py-20 text-red-500">{error || 'Not found'}</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/coach/templates" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Phase Templates
        </Link>
      </div>

      {/* Metadata card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-6">
          {!editMeta ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
                  {template.focus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${FOCUS_COLOURS[template.focus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {template.focus}
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                  {template.trainingSplit && <span>Split: <strong>{template.trainingSplit}</strong></span>}
                  {template.goal && <span>Goal: <strong>{template.goal}</strong></span>}
                  {template.daysPerWeek && <span><strong>{template.daysPerWeek}</strong> days/week</span>}
                  <span><strong>{template.defaultWeeks}</strong> weeks default</span>
                </div>
              </div>
              <button
                onClick={() => setEditMeta(true)}
                className="text-sm text-gray-500 hover:text-gray-700 underline flex-shrink-0"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    value={meta.name}
                    onChange={e => setMeta(m => ({ ...m, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={meta.description}
                    onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Focus</label>
                  <select value={meta.focus} onChange={e => setMeta(m => ({ ...m, focus: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="">None</option>
                    {FOCUS_OPTIONS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Goal</label>
                  <select value={meta.goal} onChange={e => setMeta(m => ({ ...m, goal: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="">None</option>
                    {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Training Split</label>
                  <select value={meta.trainingSplit} onChange={e => setMeta(m => ({ ...m, trainingSplit: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="">None</option>
                    {SPLIT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Days/week: {meta.daysPerWeek}</label>
                  <input type="range" min={1} max={7} value={meta.daysPerWeek} onChange={e => setMeta(m => ({ ...m, daysPerWeek: parseInt(e.target.value) }))} className="w-full accent-primary-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Default weeks: {meta.defaultWeeks}</label>
                  <input type="range" min={1} max={12} value={meta.defaultWeeks} onChange={e => setMeta(m => ({ ...m, defaultWeeks: parseInt(e.target.value) }))} className="w-full accent-primary-600" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveMeta} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditMeta(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workouts */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Workouts <span className="text-gray-400 font-normal text-base">({template.workouts.length})</span>
        </h2>

        {template.workouts.map((workout, wi) => (
          <div key={workout.id} className="bg-white border border-gray-200 rounded-xl shadow-sm">
            {/* Workout header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-400 w-5 text-center">{wi + 1}</span>
              <input
                defaultValue={workout.name}
                onBlur={e => { if (e.target.value.trim() && e.target.value !== workout.name) renameWorkout(workout.id, e.target.value.trim()) }}
                className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-1"
              />
              <button
                onClick={() => setPickerWorkoutId(pickerWorkoutId === workout.id ? null : workout.id)}
                className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition font-medium"
              >
                + Add Exercise
              </button>
              <button
                onClick={() => deleteWorkout(workout.id)}
                className="text-gray-400 hover:text-red-500 transition p-1"
                title="Delete workout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Exercise picker */}
            {pickerWorkoutId === workout.id && (
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search exercises…"
                  value={exerciseSearch}
                  onChange={e => setExerciseSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 mb-2"
                />
                {exerciseSearch.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredExercises.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">No exercises found</p>
                    ) : filteredExercises.map(ex => (
                      <button
                        key={ex.id}
                        onClick={() => { addExercise(workout.id, ex.id); setPickerWorkoutId(null) }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white hover:shadow-sm transition"
                      >
                        <span className="font-medium text-gray-800">{ex.name}</span>
                        {ex.muscleGroups.length > 0 && (
                          <span className="text-gray-400 text-xs ml-2">{ex.muscleGroups.join(', ')}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Exercise list */}
            {workout.exercises.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No exercises yet — click &ldquo;Add Exercise&rdquo; above
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {workout.exercises.map((ex, ei) => (
                  <div key={ex.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-center flex-shrink-0">{ei + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ex.exercise.name}</p>
                      {ex.exercise.muscleGroups.length > 0 && (
                        <p className="text-xs text-gray-400">{ex.exercise.muscleGroups.join(', ')}</p>
                      )}
                    </div>
                    {/* Sets */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <label className="text-xs text-gray-500">Sets</label>
                      <input
                        type="number"
                        defaultValue={ex.targetSets}
                        min={1} max={20}
                        onBlur={e => updateExercise(workout.id, ex.id, { targetSets: parseInt(e.target.value) || 3 })}
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
                        onBlur={e => updateExercise(workout.id, ex.id, { targetReps: e.target.value || null })}
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
                        onBlur={e => updateExercise(workout.id, ex.id, { targetRir: e.target.value ? parseInt(e.target.value) : null })}
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
                        onBlur={e => updateExercise(workout.id, ex.id, { restPeriod: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-14 px-1.5 py-1 text-sm text-center border border-gray-200 rounded focus:ring-1 focus:ring-primary-400 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => deleteExercise(workout.id, ex.id)}
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
        ))}
      </div>

      {/* Add workout */}
      {!addingWorkout ? (
        <button
          onClick={() => { setAddingWorkout(true); setNewWorkoutName('') }}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition font-medium mb-8"
        >
          + Add Workout
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 flex gap-2">
          <input
            type="text"
            autoFocus
            value={newWorkoutName}
            onChange={e => setNewWorkoutName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addWorkout(); if (e.key === 'Escape') setAddingWorkout(false) }}
            placeholder="Workout name (e.g. Push A, Lower, Full Body)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
          <button onClick={addWorkout} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition">
            Add
          </button>
          <button onClick={() => setAddingWorkout(false)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition">
            Cancel
          </button>
        </div>
      )}

      {/* Danger zone */}
      <div className="border border-red-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Delete template</p>
          <p className="text-xs text-gray-500">Permanently removes this template. Client blocks are unaffected.</p>
        </div>
        <button
          onClick={deleteTemplate}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
