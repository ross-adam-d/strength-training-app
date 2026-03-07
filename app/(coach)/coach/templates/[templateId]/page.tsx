'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const FOCUS_OPTIONS = ['hypertrophy', 'strength', 'power', 'endurance', 'deload']
const SPLIT_OPTIONS = ['Full Body', 'Upper/Lower', 'Push/Pull', 'Push/Pull/Legs', 'Bro Split', 'Olympic Lifts', 'Custom']
const FOCUS_COLOURS: Record<string, string> = {
  hypertrophy: 'bg-blue-100 text-blue-700',
  strength:    'bg-orange-100 text-orange-700',
  power:       'bg-purple-100 text-purple-700',
  endurance:   'bg-green-100 text-green-700',
  deload:      'bg-gray-100 text-gray-600',
}

type TemplateWorkout = {
  id: string
  name: string
  weekNumber: number
  orderIndex: number
  exercises: { id: string }[]
}

type Template = {
  id: string
  name: string
  description: string | null
  focus: string | null
  trainingSplit: string | null
  daysPerWeek: number | null
  defaultWeeks: number
  workouts: TemplateWorkout[]
}

export default function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editMeta, setEditMeta] = useState(false)
  const [meta, setMeta] = useState({ name: '', description: '', focus: '', trainingSplit: '', daysPerWeek: 4, defaultWeeks: 4 })

  const [currentWeek, setCurrentWeek] = useState(1)
  const [addingWorkout, setAddingWorkout] = useState(false)
  const [newWorkoutName, setNewWorkoutName] = useState('')

  const [copyingWeek, setCopyingWeek] = useState(false)
  const [copyTarget, setCopyTarget] = useState<'all' | number>('all')

  const fetchTemplate = useCallback(async () => {
    const res = await fetch(`/api/coach/templates/${templateId}`)
    if (!res.ok) { setError('Template not found'); setLoading(false); return }
    const data = await res.json()
    setTemplate(data)
    setMeta({
      name: data.name,
      description: data.description ?? '',
      focus: data.focus ?? '',
      trainingSplit: data.trainingSplit ?? '',
      daysPerWeek: data.daysPerWeek ?? 4,
      defaultWeeks: data.defaultWeeks,
    })
    setLoading(false)
  }, [templateId])

  useEffect(() => { fetchTemplate() }, [fetchTemplate])

  // Clamp currentWeek when defaultWeeks changes
  useEffect(() => {
    if (template && currentWeek > template.defaultWeeks) {
      setCurrentWeek(template.defaultWeeks)
    }
  }, [template, currentWeek])

  async function saveMeta() {
    setSaving(true)
    const res = await fetch(`/api/coach/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: meta.name.trim(),
        description: meta.description.trim() || null,
        focus: meta.focus || null,
        trainingSplit: meta.trainingSplit || null,
        daysPerWeek: meta.daysPerWeek,
        defaultWeeks: meta.defaultWeeks,
      }),
    })
    if (res.ok) { await fetchTemplate(); setEditMeta(false) }
    setSaving(false)
  }

  async function addWorkout() {
    if (!newWorkoutName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/coach/templates/${templateId}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newWorkoutName.trim(), weekNumber: currentWeek }),
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

  async function deleteTemplate() {
    if (!confirm('Delete this template permanently? This cannot be undone.')) return
    await fetch(`/api/coach/templates/${templateId}`, { method: 'DELETE' })
    window.location.assign('/coach/templates')
  }

  async function copyWeek() {
    if (!template) return
    setCopyingWeek(true)
    const toWeeks = copyTarget === 'all'
      ? Array.from({ length: template.defaultWeeks }, (_, i) => i + 1).filter(w => w !== currentWeek)
      : [copyTarget as number]
    const res = await fetch(`/api/coach/templates/${templateId}/copy-week`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromWeek: currentWeek, toWeeks }),
    })
    if (res.ok) {
      await fetchTemplate()
    } else {
      const d = await res.json()
      alert(d.error || 'Failed to copy week')
    }
    setCopyingWeek(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (error || !template) return <div className="text-center py-20 text-red-500">{error || 'Not found'}</div>

  const weeks = Array.from({ length: template.defaultWeeks }, (_, i) => i + 1)
  const weekWorkouts = template.workouts
    .filter(w => w.weekNumber === currentWeek)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/coach/templates" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Phase Templates
        </Link>
      </div>

      {/* Metadata card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-6 border-b">
          {!editMeta ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
                  {template.focus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${FOCUS_COLOURS[template.focus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {template.focus}
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {template.trainingSplit && <span>Split: <strong>{template.trainingSplit}</strong></span>}
                  {template.daysPerWeek && <span><strong>{template.daysPerWeek}</strong> days/week</span>}
                  <span><strong>{template.defaultWeeks}</strong> weeks</span>
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
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={meta.name}
                  onChange={e => setMeta(m => ({ ...m, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={meta.description}
                  onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
                <select
                  value={meta.focus}
                  onChange={e => setMeta(m => ({ ...m, focus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">None</option>
                  {FOCUS_OPTIONS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Split</label>
                <select
                  value={meta.trainingSplit}
                  onChange={e => setMeta(m => ({ ...m, trainingSplit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">None</option>
                  {SPLIT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days per week: <span className="text-primary-600 font-bold">{meta.daysPerWeek}</span>
                  </label>
                  <input
                    type="range" min={1} max={7} value={meta.daysPerWeek}
                    onChange={e => setMeta(m => ({ ...m, daysPerWeek: parseInt(e.target.value) }))}
                    className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>7</span></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration: <span className="text-primary-600 font-bold">{meta.defaultWeeks} weeks</span>
                  </label>
                  <input
                    type="range" min={1} max={12} value={meta.defaultWeeks}
                    onChange={e => setMeta(m => ({ ...m, defaultWeeks: parseInt(e.target.value) }))}
                    className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>12</span></div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveMeta}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditMeta(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div className="mb-5">
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-3">
          <button
            onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
            disabled={currentWeek === 1}
            className={`px-3 py-2 rounded-lg font-medium transition min-w-[72px] text-sm ${
              currentWeek === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-primary-600 hover:bg-white'
            }`}
          >
            ← Prev
          </button>
          <div className="text-center flex-1">
            <h2 className="text-base font-bold text-gray-900">Week {currentWeek}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{weekWorkouts.length} workout{weekWorkouts.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setCurrentWeek(w => Math.min(template.defaultWeeks, w + 1))}
            disabled={currentWeek === template.defaultWeeks}
            className={`px-3 py-2 rounded-lg font-medium transition min-w-[72px] text-sm ${
              currentWeek === template.defaultWeeks ? 'text-gray-300 cursor-not-allowed' : 'text-primary-600 hover:bg-white'
            }`}
          >
            Next →
          </button>
        </div>

        {/* Week dots */}
        <div className="flex justify-center gap-1.5">
          {weeks.map(w => {
            const hasWorkouts = template.workouts.some(wo => wo.weekNumber === w)
            return (
              <button
                key={w}
                onClick={() => setCurrentWeek(w)}
                className={`w-6 h-6 rounded-full text-xs font-medium transition ${
                  w === currentWeek
                    ? 'bg-primary-600 text-white'
                    : hasWorkouts
                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {w}
              </button>
            )
          })}
        </div>
      </div>

      {/* Workouts for current week */}
      <div className="space-y-3 mb-4">
        {weekWorkouts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm mb-1">No workouts in Week {currentWeek}</p>
            <p className="text-gray-400 text-xs">Add a workout below, or copy from another week.</p>
          </div>
        ) : (
          weekWorkouts.map((workout) => (
            <div key={workout.id} className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{workout.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/coach/templates/${templateId}/workouts/${workout.id}`}
                    className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition"
                    title="Remove workout"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add workout */}
      {!addingWorkout ? (
        <button
          onClick={() => { setAddingWorkout(true); setNewWorkoutName('') }}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition font-medium mb-4"
        >
          + Add Workout to Week {currentWeek}
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex gap-2">
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

      {/* Copy week */}
      {template.defaultWeeks > 1 && weekWorkouts.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Copy Week {currentWeek} to:</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={copyTarget === 'all' ? 'all' : String(copyTarget)}
              onChange={e => setCopyTarget(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All other weeks</option>
              {weeks.filter(w => w !== currentWeek).map(w => (
                <option key={w} value={String(w)}>Week {w} only</option>
              ))}
            </select>
            <button
              onClick={copyWeek}
              disabled={copyingWeek}
              className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition"
            >
              {copyingWeek ? 'Copying…' : 'Copy'}
            </button>
            <p className="text-xs text-gray-400 w-full mt-1">This will overwrite existing workouts in the target week(s)</p>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4 mb-8">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">Delete template</p>
          <p className="text-xs text-gray-500">Permanently removes this template. Client blocks are unaffected.</p>
        </div>
        <button
          onClick={deleteTemplate}
          className="flex-shrink-0 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
