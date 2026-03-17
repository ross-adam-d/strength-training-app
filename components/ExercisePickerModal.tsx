'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { SetTarget, formatSetTargets } from '@/lib/setTargets'

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  quads: 'Quads',
  hamstrings: 'Hams',
  glutes: 'Glutes',
  adductors: 'Adductors',
  abductors: 'Abductors',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  core: 'Core',
  calves: 'Calves',
}

const ALL_MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS)

export interface PickerExercise {
  id: string
  name: string
  muscleGroups: string[]
  equipment: string[]
  isUnilateral: boolean
  isTimed: boolean
  isBodyweight: boolean
  needsReview?: boolean
}

export interface ExercisePickerResult {
  exercise: PickerExercise
  targetSets: number
  targetReps: string
  targetRir: number | null
  restPeriod: number | null
  tempo: string | null
  supersetWithPrevious: boolean
  notes: string | null
  setTargets: SetTarget[] | null
}

export interface ExercisePickerInitialValues {
  exerciseId?: string
  targetSets?: string
  targetReps?: string
  targetRir?: string
  restPeriod?: string
  tempo?: string
  supersetWithPrevious?: boolean
  notes?: string
  setTargets?: SetTarget[] | null
}

interface ExercisePickerModalProps {
  open: boolean
  onClose: () => void
  /** Called when user confirms their selection. Modal closes itself after calling this. */
  onAdd: (result: ExercisePickerResult) => void
  /** Called when a brand-new custom exercise is created so the parent can update its list */
  onExerciseCreated?: (exercise: PickerExercise) => void
  /** 'plan' shows sets/reps/RIR/rest form; 'log' just selects an exercise immediately */
  mode?: 'plan' | 'log'
  /** Exercise IDs already in the workout — excluded from the list */
  existingExerciseIds?: string[]
  /** Muscle groups already in the workout — used for smart relevance sorting */
  currentMuscleGroups?: string[]
  /** Pre-populate form when editing an existing exercise */
  initialValues?: ExercisePickerInitialValues
  title?: string
  addLabel?: string
}

function sortByRelevance(exercises: PickerExercise[], priorityGroups: Set<string>): PickerExercise[] {
  if (priorityGroups.size === 0) return exercises
  return [...exercises].sort((a, b) => {
    const aScore = a.muscleGroups.filter((g) => priorityGroups.has(g)).length
    const bScore = b.muscleGroups.filter((g) => priorityGroups.has(g)).length
    if (bScore !== aScore) return bScore - aScore
    return a.name.localeCompare(b.name)
  })
}

export function ExercisePickerModal({
  open,
  onClose,
  onAdd,
  onExerciseCreated,
  mode = 'plan',
  existingExerciseIds = [],
  currentMuscleGroups = [],
  initialValues,
  title,
  addLabel = 'Add',
}: ExercisePickerModalProps) {
  // Exercise data
  const [allExercises, setAllExercises] = useState<PickerExercise[]>([])
  const [fetched, setFetched] = useState(false)
  const [loading, setLoading] = useState(false)

  // Search view state
  const [search, setSearch] = useState('')
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createSaving, setCreateSaving] = useState(false)

  // View: 'search' or 'form' (plan mode only)
  const [view, setView] = useState<'search' | 'form'>('search')
  const [selectedExercise, setSelectedExercise] = useState<PickerExercise | null>(null)

  // Form state (plan mode)
  const [form, setForm] = useState({
    targetSets: '3',
    targetReps: '8-12',
    targetRir: '2',
    restPeriod: '90',
    tempo: '',
    supersetWithPrevious: false,
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Prescribed mode state
  const [prescribedMode, setPrescribedMode] = useState(false)
  const [setTargetRows, setSetTargetRows] = useState<SetTarget[]>([{ sets: 1, reps: '', weight: undefined }])

  // Fetch exercises once on first open
  useEffect(() => {
    if (open && !fetched) {
      setLoading(true)
      fetch('/api/exercises')
        .then((r) => r.json())
        .then((data) => { setAllExercises(data); setFetched(true) })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, fetched])

  // Reset / initialise state whenever modal opens
  useEffect(() => {
    if (!open) return
    setSearch('')
    setActiveChip(null)
    setCreating(false)
    setNewName('')
    setFormErrors({})
    const hasPrescribed = !!(initialValues?.setTargets && initialValues.setTargets.length > 0)
    setPrescribedMode(hasPrescribed)
    setSetTargetRows(hasPrescribed ? initialValues!.setTargets! : [{ sets: 1, reps: '', weight: undefined }])
    setForm({
      targetSets: initialValues?.targetSets ?? '3',
      targetReps: initialValues?.targetReps ?? '8-12',
      targetRir: initialValues?.targetRir ?? '2',
      restPeriod: initialValues?.restPeriod ?? '90',
      tempo: initialValues?.tempo ?? '',
      supersetWithPrevious: initialValues?.supersetWithPrevious ?? false,
      notes: initialValues?.notes ?? '',
    })
    // If editing (exerciseId provided), jump straight to form view
    if (initialValues?.exerciseId && allExercises.length > 0) {
      const ex = allExercises.find((e) => e.id === initialValues.exerciseId)
      if (ex) { setSelectedExercise(ex); setView('form'); return }
    }
    setSelectedExercise(null)
    setView('search')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Once exercises load, resolve the pre-selected exercise for edit mode
  useEffect(() => {
    if (open && initialValues?.exerciseId && allExercises.length > 0 && !selectedExercise) {
      const ex = allExercises.find((e) => e.id === initialValues.exerciseId)
      if (ex) { setSelectedExercise(ex); setView('form') }
    }
  }, [allExercises]) // eslint-disable-line react-hooks/exhaustive-deps

  const priorityGroups = new Set(currentMuscleGroups)
  const available = allExercises.filter((ex) => !existingExerciseIds.includes(ex.id))
  const filtered = sortByRelevance(
    available.filter((ex) => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchChip = !activeChip || ex.muscleGroups.includes(activeChip)
      return matchSearch && matchChip
    }),
    priorityGroups
  )

  function handleSelect(exercise: PickerExercise) {
    if (mode === 'log') {
      onAdd({ exercise, targetSets: 3, targetReps: '', targetRir: null, restPeriod: null, tempo: null, supersetWithPrevious: false, notes: null, setTargets: null })
      handleClose()
    } else {
      setSelectedExercise(exercise)
      setView('form')
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreateSaving(true)
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), muscleGroups: [], equipment: [], isPublic: false, needsReview: true }),
      })
      if (res.ok) {
        const created: PickerExercise = await res.json()
        setAllExercises((prev) => [...prev, created])
        onExerciseCreated?.(created)
        setCreating(false)
        setNewName('')
        handleSelect(created)
      }
    } finally {
      setCreateSaving(false)
    }
  }

  function handleSubmit() {
    if (!selectedExercise) return
    const errors: Record<string, string> = {}

    if (prescribedMode) {
      if (setTargetRows.length === 0) {
        errors.setTargets = 'Add at least one row'
      } else {
        for (const row of setTargetRows) {
          if (!row.sets || row.sets < 1) { errors.setTargets = 'Sets must be at least 1'; break }
          if (!row.reps.trim()) { errors.setTargets = 'Reps required for each row'; break }
        }
      }
      setFormErrors(errors)
      if (Object.keys(errors).length > 0) return

      const totalSets = setTargetRows.reduce((sum, g) => sum + g.sets, 0)
      onAdd({
        exercise: selectedExercise,
        targetSets: totalSets,
        targetReps: '',
        targetRir: null,
        restPeriod: form.restPeriod !== '' ? parseInt(form.restPeriod) : null,
        tempo: form.tempo || null,
        supersetWithPrevious: form.supersetWithPrevious,
        notes: form.notes || null,
        setTargets: setTargetRows,
      })
    } else {
      const sets = parseInt(form.targetSets)
      if (!form.targetSets || isNaN(sets) || sets < 1) errors.targetSets = 'Required'
      setFormErrors(errors)
      if (Object.keys(errors).length > 0) return

      onAdd({
        exercise: selectedExercise,
        targetSets: sets,
        targetReps: form.targetReps || '',
        targetRir: form.targetRir !== '' ? parseInt(form.targetRir) : null,
        restPeriod: form.restPeriod !== '' ? parseInt(form.restPeriod) : null,
        tempo: form.tempo || null,
        supersetWithPrevious: form.supersetWithPrevious,
        notes: form.notes || null,
        setTargets: null,
      })
    }
    handleClose()
  }

  function handleClose() {
    onClose()
    // Defer reset so animation plays first
    setTimeout(() => {
      setSearch('')
      setActiveChip(null)
      setCreating(false)
      setNewName('')
      setSelectedExercise(null)
      setView('search')
      setFormErrors({})
      setPrescribedMode(false)
      setSetTargetRows([{ sets: 1, reps: '', weight: undefined }])
    }, 150)
  }

  function updateSetTargetRow(index: number, field: keyof SetTarget, value: string) {
    setSetTargetRows((prev) => prev.map((row, i) => {
      if (i !== index) return row
      if (field === 'sets') return { ...row, sets: parseInt(value) || 0 }
      if (field === 'reps') return { ...row, reps: value }
      if (field === 'weight') return { ...row, weight: value === '' ? undefined : parseFloat(value) }
      return row
    }))
  }

  function addSetTargetRow() {
    setSetTargetRows((prev) => [...prev, { sets: 1, reps: '', weight: undefined }])
  }

  function removeSetTargetRow(index: number) {
    setSetTargetRows((prev) => prev.filter((_, i) => i !== index))
  }

  const modalTitle = title ?? (view === 'form' && mode === 'plan' ? (initialValues?.exerciseId ? 'Edit Exercise' : 'Configure Exercise') : 'Add Exercise')

  return (
    <Modal isOpen={open} onClose={handleClose} title={modalTitle}>
      {view === 'search' ? (
        <div className="space-y-3">
          {/* Search */}
          <input
            type="text"
            autoFocus
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
          />

          {/* Muscle group filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden">
            {ALL_MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveChip(activeChip === group ? null : group)}
                className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full font-medium transition ${
                  activeChip === group
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {MUSCLE_GROUP_LABELS[group]}
              </button>
            ))}
          </div>

          {/* Exercise list */}
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelect(ex)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 transition flex items-center justify-between"
                >
                  <span className="font-medium text-gray-800">{ex.name}</span>
                  {ex.muscleGroups.length > 0 && (
                    <span className="text-xs text-gray-400 ml-2 shrink-0 capitalize">{ex.muscleGroups[0]}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  {search ? `No results for "${search}"` : 'No exercises available'}
                </div>
              )}
            </div>
          )}

          {/* Create custom */}
          {creating ? (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={createSaving || !newName.trim()}
                className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg disabled:opacity-50 transition"
              >
                {createSaving ? '...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setNewName('') }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-sm text-primary-600 hover:text-primary-700 py-0.5"
            >
              + Create custom exercise
            </button>
          )}

          <div className="flex justify-end pt-1">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Form view — plan mode */
        <div className="space-y-4">
          {/* Selected exercise */}
          <div className="flex items-start justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-base leading-snug">{selectedExercise?.name}</p>
              {selectedExercise && selectedExercise.muscleGroups.length > 0 && (
                <p className="text-xs text-gray-500 capitalize mt-0.5">{selectedExercise.muscleGroups.join(', ')}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSelectedExercise(null); setView('search') }}
              className="text-sm text-primary-600 hover:text-primary-700 ml-3 flex-shrink-0 font-medium"
            >
              Change
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => { setPrescribedMode(false); setFormErrors({}) }}
              className={`flex-1 py-2.5 px-3 text-sm font-medium text-left transition ${!prescribedMode ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Standard
              <span className={`block text-xs font-normal mt-0.5 ${!prescribedMode ? 'text-orange-100' : 'text-gray-400'}`}>Sets, reps &amp; RIR</span>
            </button>
            <button
              type="button"
              onClick={() => { setPrescribedMode(true); setFormErrors({}) }}
              className={`flex-1 py-2.5 px-3 text-sm font-medium text-left border-l border-gray-200 transition ${prescribedMode ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Prescribed
              <span className={`block text-xs font-normal mt-0.5 ${prescribedMode ? 'text-orange-100' : 'text-gray-400'}`}>Exact per-set weights</span>
            </button>
          </div>

          {prescribedMode ? (
            /* Prescribed: 2-line rows — sets×reps on line 1, weight on line 2 */
            <div className="space-y-3">
              {formErrors.setTargets && <p className="text-sm text-red-500">{formErrors.setTargets}</p>}
              <div className="space-y-2">
                {setTargetRows.map((row, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg px-3 py-2.5 space-y-2">
                    {/* Line 1: sets × reps + remove */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={row.sets || ''}
                        onChange={(e) => updateSetTargetRow(idx, 'sets', e.target.value)}
                        placeholder="3"
                        className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="text-sm text-gray-500 font-medium">sets ×</span>
                      <input
                        type="text"
                        placeholder="5 or 4-6"
                        value={row.reps}
                        onChange={(e) => updateSetTargetRow(idx, 'reps', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="text-sm text-gray-500">reps</span>
                      {setTargetRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSetTargetRow(idx)}
                          className="text-gray-400 hover:text-red-500 text-xs font-medium transition ml-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {/* Line 2: weight */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">@</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="weight"
                        value={row.weight ?? ''}
                        onChange={(e) => updateSetTargetRow(idx, 'weight', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="text-sm text-gray-500">kg <span className="text-gray-400">(optional)</span></span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSetTargetRow}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition"
              >
                + Add row
              </button>
            </div>
          ) : (
            /* Standard: sets / reps / RIR / rest */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sets {formErrors.targetSets && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.targetSets}
                    onChange={(e) => { setForm({ ...form, targetSets: e.target.value }); setFormErrors({ ...formErrors, targetSets: '' }) }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.targetSets ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                  <input
                    type="text"
                    placeholder="8-12"
                    value={form.targetReps}
                    onChange={(e) => setForm({ ...form, targetReps: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RIR</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="2"
                    value={form.targetRir}
                    onChange={(e) => setForm({ ...form, targetRir: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rest (s)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="90"
                    value={form.restPeriod}
                    onChange={(e) => setForm({ ...form, restPeriod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Superset */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ep-superset"
              checked={form.supersetWithPrevious}
              onChange={(e) => setForm({ ...form, supersetWithPrevious: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="ep-superset" className="text-sm text-gray-700">
              Superset with previous exercise
            </label>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tempo (optional)</label>
            <input
              type="text"
              placeholder="3-0-1-0"
              value={form.tempo}
              onChange={(e) => setForm({ ...form, tempo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium text-sm rounded-lg hover:bg-primary-700 transition"
            >
              {addLabel}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
