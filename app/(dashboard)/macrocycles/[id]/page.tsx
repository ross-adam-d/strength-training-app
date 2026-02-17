'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import Link from 'next/link'

interface Mesocycle {
  id: string
  name: string
  focus: string | null
  goal: string | null
  trainingDaysPerWeek: number | null
  trainingSplit: string | null
  status?: string
  startDate: string
  endDate: string
  microcycles: {
    id: string
    weekNumber: number
  }[]
}

interface MacrocycleData {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  description: string | null
  goals: string | null
  mesocycles: Mesocycle[]
}

const GOAL_OPTIONS = [
  { value: '', label: 'Select goal...' },
  { value: 'Hypertrophy', label: 'Hypertrophy' },
  { value: 'Strength', label: 'Strength' },
  { value: 'Power', label: 'Power' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Deload', label: 'Deload' },
]

const TRAINING_SPLIT_OPTIONS = [
  { value: '', label: 'Select split...' },
  { value: 'Full Body', label: 'Full Body' },
  { value: 'Upper/Lower', label: 'Upper/Lower' },
  { value: 'Push/Pull/Legs', label: 'Push/Pull/Legs' },
  { value: 'Bro Split', label: 'Bro Split (Chest/Back/Legs/Shoulders/Arms)' },
  { value: 'Custom', label: 'Custom' },
]

export default function MacrocycleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [macrocycle, setMacrocycle] = useState<MacrocycleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [editingDates, setEditingDates] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedStartDate, setEditedStartDate] = useState('')
  const [editedEndDate, setEditedEndDate] = useState('')
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [dirtyStructure, setDirtyStructure] = useState<Set<string>>(new Set())
  const [updatingStructure, setUpdatingStructure] = useState<string | null>(null)
  const [rebuildModal, setRebuildModal] = useState<Mesocycle | null>(null)

  // Refs for batching phase config saves
  const pendingPhaseUpdates = useRef<Map<string, Record<string, unknown>>>(new Map())
  const phaseUpdateTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const fetchMacrocycle = useCallback(async () => {
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMacrocycle(data)
        setEditedName(data.name)
        setEditedStartDate(data.startDate.split('T')[0])
        setEditedEndDate(data.endDate.split('T')[0])
        // Expand all phases by default
        setExpandedPhases(new Set(data.mesocycles.map((m: Mesocycle) => m.id)))
      }
    } catch (error) {
      console.error('Error fetching macrocycle:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchMacrocycle()
  }, [fetchMacrocycle])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this training block? This will delete all associated data.')) {
      return
    }

    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/macrocycles')
      }
    } catch (error) {
      console.error('Error deleting macrocycle:', error)
    }
  }

  // Optimistically update a single phase's fields in local state
  function optimisticPhaseUpdate(mesocycleId: string, fields: Partial<Mesocycle>) {
    setMacrocycle((prev) =>
      prev
        ? { ...prev, mesocycles: prev.mesocycles.map((m) => (m.id === mesocycleId ? { ...m, ...fields } : m)) }
        : null
    )
  }

  // Debounce-batch phase config saves: accumulate changes for 600ms then send one PATCH
  function schedulePhaseSave(mesocycleId: string, fields: Record<string, unknown>) {
    const current = pendingPhaseUpdates.current.get(mesocycleId) || {}
    pendingPhaseUpdates.current.set(mesocycleId, { ...current, ...fields })

    const existing = phaseUpdateTimers.current.get(mesocycleId)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(async () => {
      const updates = pendingPhaseUpdates.current.get(mesocycleId)
      pendingPhaseUpdates.current.delete(mesocycleId)
      phaseUpdateTimers.current.delete(mesocycleId)
      if (!updates) return

      try {
        const res = await fetch(`/api/mesocycles/${mesocycleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!res.ok) await fetchMacrocycle() // rollback on error
      } catch {
        await fetchMacrocycle()
      }
    }, 600)

    phaseUpdateTimers.current.set(mesocycleId, timer)
  }

  async function handleSaveName() {
    if (!editedName.trim()) return
    const prev = macrocycle!.name
    // Optimistic: update UI immediately, close editor
    setMacrocycle((m) => (m ? { ...m, name: editedName } : null))
    setEditingName(false)
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName }),
      })
      if (!response.ok) {
        // Rollback
        setMacrocycle((m) => (m ? { ...m, name: prev } : null))
        setEditedName(prev)
        setEditingName(true)
      }
    } catch {
      setMacrocycle((m) => (m ? { ...m, name: prev } : null))
      setEditedName(prev)
      setEditingName(true)
    }
  }

  async function handleSaveDates() {
    const prevStart = macrocycle!.startDate
    const prevEnd = macrocycle!.endDate
    // Optimistic: close editor, show new dates
    setMacrocycle((m) =>
      m ? { ...m, startDate: editedStartDate + 'T00:00:00.000Z', endDate: editedEndDate + 'T00:00:00.000Z' } : null
    )
    setEditingDates(false)
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: editedStartDate, endDate: editedEndDate }),
      })
      if (!response.ok) {
        setMacrocycle((m) => (m ? { ...m, startDate: prevStart, endDate: prevEnd } : null))
        setEditedStartDate(prevStart.split('T')[0])
        setEditedEndDate(prevEnd.split('T')[0])
        setEditingDates(true)
      }
    } catch {
      setMacrocycle((m) => (m ? { ...m, startDate: prevStart, endDate: prevEnd } : null))
      setEditedStartDate(prevStart.split('T')[0])
      setEditedEndDate(prevEnd.split('T')[0])
      setEditingDates(true)
    }
  }

  async function handleStatusChange(newStatus: 'planned' | 'active' | 'paused' | 'completed') {
    const prevStatus = macrocycle!.status
    setMacrocycle((m) => (m ? { ...m, status: newStatus } : null))
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        setMacrocycle((m) => (m ? { ...m, status: prevStatus } : null))
        const data = await response.json()
        alert(data.error || 'Failed to update status')
      }
    } catch {
      setMacrocycle((m) => (m ? { ...m, status: prevStatus } : null))
      alert('Failed to update status')
    }
  }

  function handleUpdatePhaseGoal(mesocycleId: string, goal: string) {
    optimisticPhaseUpdate(mesocycleId, { goal })
    schedulePhaseSave(mesocycleId, { goal })
  }

  function handleUpdateTrainingDays(mesocycleId: string, days: number) {
    optimisticPhaseUpdate(mesocycleId, { trainingDaysPerWeek: days })
    setDirtyStructure((prev) => new Set([...prev, mesocycleId]))
    schedulePhaseSave(mesocycleId, { trainingDaysPerWeek: days })
  }

  function handleUpdateTrainingSplit(mesocycleId: string, split: string) {
    optimisticPhaseUpdate(mesocycleId, { trainingSplit: split })
    setDirtyStructure((prev) => new Set([...prev, mesocycleId]))
    schedulePhaseSave(mesocycleId, { trainingSplit: split })
  }

  function handleUpdateStructure(phase: Mesocycle) {
    if (!phase.trainingDaysPerWeek || !phase.trainingSplit) {
      alert('Please set both training days and training split before updating the structure.')
      return
    }
    setRebuildModal(phase)
  }

  async function confirmRebuild(mode: 'default' | 'manual') {
    if (!rebuildModal) return
    const phase = rebuildModal
    setRebuildModal(null)
    setUpdatingStructure(phase.id)
    try {
      const res = await fetch(`/api/mesocycles/${phase.id}/generate-workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, regenerate: true }),
      })

      if (res.ok) {
        setDirtyStructure((prev) => {
          const next = new Set(prev)
          next.delete(phase.id)
          return next
        })
        await fetchMacrocycle()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update structure')
      }
    } catch (error) {
      console.error('Error updating structure:', error)
      alert('Failed to update structure')
    } finally {
      setUpdatingStructure(null)
    }
  }

  function togglePhase(phaseId: string) {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  function calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-5 bg-gray-100 rounded w-96"></div>
            <div className="flex gap-2 mt-2">
              <div className="h-9 bg-gray-200 rounded w-32"></div>
              <div className="h-9 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
        <div className="mb-4 space-y-2">
          <div className="h-7 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="h-6 bg-gray-200 rounded w-6"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-64"></div>
                  <div className="h-4 bg-gray-100 rounded w-80"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!macrocycle) {
    return <div className="text-center py-8">Training block not found</div>
  }

  const duration = calculateDuration(macrocycle.startDate, macrocycle.endDate)

  return (
    <div>
      <div className="mb-6">
        <Link href="/macrocycles" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Training Blocks
        </Link>
      </div>

      <Card className="mb-8">
        <CardBody>
          {/* Title row */}
          {editingName ? (
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => {
                setEditedName(macrocycle.name)
                setEditingName(false)
              }}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 flex-1">{macrocycle.name}</h1>
              <button
                onClick={() => setEditingName(true)}
                className="text-gray-400 hover:text-primary-600 text-lg leading-none"
                title="Edit name"
              >
                ✎
              </button>
            </div>
          )}

          {/* Dates row */}
          {editingDates ? (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="date"
                value={editedStartDate}
                onChange={(e) => setEditedStartDate(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={editedEndDate}
                onChange={(e) => setEditedEndDate(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
              <Button size="sm" onClick={handleSaveDates}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => {
                setEditedStartDate(macrocycle.startDate.split('T')[0])
                setEditedEndDate(macrocycle.endDate.split('T')[0])
                setEditingDates(false)
              }}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm text-gray-500">
                {new Date(macrocycle.startDate).toLocaleDateString()} –{' '}
                {new Date(macrocycle.endDate).toLocaleDateString()} ({duration} weeks)
              </p>
              <button
                onClick={() => setEditingDates(true)}
                className="text-gray-400 hover:text-primary-600 text-lg leading-none"
                title="Edit dates"
              >
                ✎
              </button>
            </div>
          )}

          {/* Status + Delete row */}
          <div className="flex items-center gap-2 pt-1 border-t">
            <Select
              options={[
                { value: 'planned', label: 'Planned' },
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={macrocycle.status}
              onChange={(e) => handleStatusChange(e.target.value as 'planned' | 'active' | 'paused' | 'completed')}
            />
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>

          {macrocycle.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-600 text-sm">{macrocycle.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Training Phases</h2>
      </div>

      {macrocycle.mesocycles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600">No phases in this block yet.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {macrocycle.mesocycles.map((phase, index) => {
            const isExpanded = expandedPhases.has(phase.id)
            const weekCount = phase.microcycles.length
            // Only lock phases that have actually started AND have been activated/completed.
            // Future phases (startDate > today) are always editable regardless of status.
            const phaseHasStarted = new Date(phase.startDate) <= new Date()
            const isLocked = phaseHasStarted && (phase.status === 'active' || phase.status === 'completed')

            return (
              <Card key={phase.id}>
                <CardBody>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => togglePhase(phase.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Phase {index + 1}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(phase.startDate).toLocaleDateString()} – {new Date(phase.endDate).toLocaleDateString()}
                          {' '}· {weekCount} {weekCount === 1 ? 'week' : 'weeks'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked && (
                        <span className="text-xs text-gray-400">🔒</span>
                      )}
                      {phase.status && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            phase.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : phase.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {phase.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {isLocked && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                          Phase has started — configuration is locked.
                        </p>
                      )}
                      {!isLocked && dirtyStructure.has(phase.id) && (
                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                          Days/split updated. Click &quot;Update Workouts&quot; below to apply the new structure.
                        </p>
                      )}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Goal
                          </label>
                          {isLocked ? (
                            <p className="text-sm text-gray-600 py-2">{phase.goal || '—'}</p>
                          ) : (
                            <Select
                              options={GOAL_OPTIONS}
                              value={phase.goal || ''}
                              onChange={(e) => handleUpdatePhaseGoal(phase.id, e.target.value)}
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Days Per Week
                          </label>
                          {isLocked ? (
                            <p className="text-sm text-gray-600 py-2">
                              {phase.trainingDaysPerWeek ? `${phase.trainingDaysPerWeek} days/week` : '—'}
                            </p>
                          ) : (
                            <Select
                              options={[
                                { value: '', label: 'Select days...' },
                                { value: '2', label: '2 days/week' },
                                { value: '3', label: '3 days/week' },
                                { value: '4', label: '4 days/week' },
                                { value: '5', label: '5 days/week' },
                                { value: '6', label: '6 days/week' },
                                { value: '7', label: '7 days/week' },
                              ]}
                              value={phase.trainingDaysPerWeek?.toString() || ''}
                              onChange={(e) => handleUpdateTrainingDays(phase.id, parseInt(e.target.value))}
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Split
                          </label>
                          {isLocked ? (
                            <p className="text-sm text-gray-600 py-2">{phase.trainingSplit || '—'}</p>
                          ) : (
                            <Select
                              options={TRAINING_SPLIT_OPTIONS}
                              value={phase.trainingSplit || ''}
                              onChange={(e) => handleUpdateTrainingSplit(phase.id, e.target.value)}
                            />
                          )}
                        </div>
                      </div>

                      {!isLocked && phase.trainingDaysPerWeek && phase.trainingSplit && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStructure(phase)}
                          disabled={updatingStructure === phase.id}
                          className={`block w-full text-center text-sm font-medium rounded-lg py-2 transition border ${
                            dirtyStructure.has(phase.id)
                              ? 'text-white bg-blue-600 hover:bg-blue-700 border-blue-700'
                              : 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200'
                          } disabled:opacity-50`}
                        >
                          {updatingStructure === phase.id ? 'Updating...' : dirtyStructure.has(phase.id) ? '↻ Update Workouts' : '↻ Rebuild Workouts'}
                        </button>
                      )}
                      <Link
                        href={`/mesocycles/${phase.id}`}
                        className="block w-full text-center text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg py-2 transition"
                      >
                        View Phase Details →
                      </Link>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Rebuild workouts modal */}
      {rebuildModal && (() => {
        const phaseIndex = macrocycle!.mesocycles.indexOf(rebuildModal) + 1
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-5 border-b">
                <h2 className="text-lg font-bold text-gray-900">Rebuild Phase {phaseIndex} Workouts</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {rebuildModal.trainingDaysPerWeek} days/week · {rebuildModal.trainingSplit}
                </p>
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-600 mb-5">
                  This will replace the current workout structure. Choose how to set up the new workouts:
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => confirmRebuild('default')}
                    className="w-full text-left p-4 rounded-lg border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 transition"
                  >
                    <p className="font-semibold text-primary-800 text-sm">🎯 Create Default Workout Structure</p>
                    <p className="text-xs text-primary-600 mt-0.5">Auto-populate workouts with exercises based on your training split</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => confirmRebuild('manual')}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <p className="font-semibold text-gray-800 text-sm">✏️ Manually Create Workouts</p>
                    <p className="text-xs text-gray-500 mt-0.5">Create empty workout slots and add exercises yourself</p>
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setRebuildModal(null)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
