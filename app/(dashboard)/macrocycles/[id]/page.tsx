'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import Link from 'next/link'
import { getSplitsForDays } from '@/lib/splitTemplates'

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
    workouts: { id: string }[]
  }[]
}

interface MacrocycleData {
  id: string
  userId: string
  name: string
  status: string
  startDate: string
  endDate: string
  description: string | null
  goals: string | null
  createdByCoachId: string | null
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

function getSplitOptions(days: number | null) {
  const placeholder = { value: '', label: 'Select split...' }
  const custom = { value: 'Custom', label: 'Custom' }
  if (!days) return [placeholder, custom]
  const splits = getSplitsForDays(days).map((s) => ({ value: s.label, label: s.label }))
  return [placeholder, ...splits, custom]
}

export default function MacrocycleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: authSession } = useSession()
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<Record<string, { templateId: string; name: string } | 'saving' | 'error'>>({})
  const [resizeModal, setResizeModal] = useState<{ phase: Mesocycle; newWeekCount: number; phaseIndex: number } | null>(null)
  const [endPhaseModal, setEndPhaseModal] = useState<{ phase: Mesocycle; phaseIndex: number } | null>(null)
  const [resizing, setResizing] = useState<string | null>(null)
  const [endingPhase, setEndingPhase] = useState<string | null>(null)

  async function handleResize(phaseId: string, newWeekCount: number) {
    setResizeModal(null)
    setResizing(phaseId)
    try {
      const res = await fetch(`/api/mesocycles/${phaseId}/resize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekCount: newWeekCount }),
      })
      if (res.ok) {
        await fetchMacrocycle()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to resize phase')
      }
    } catch {
      alert('Failed to resize phase')
    } finally {
      setResizing(null)
    }
  }

  async function handleEndPhase(phaseId: string) {
    setEndPhaseModal(null)
    setEndingPhase(phaseId)
    try {
      const res = await fetch(`/api/mesocycles/${phaseId}/end-early`, { method: 'POST' })
      if (res.ok) {
        await fetchMacrocycle()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to end phase')
      }
    } catch {
      alert('Failed to end phase')
    } finally {
      setEndingPhase(null)
    }
  }

  async function handleSaveAsTemplate(phaseId: string) {
    setSavedTemplates((prev) => ({ ...prev, [phaseId]: 'saving' }))
    try {
      const res = await fetch(`/api/mesocycles/${phaseId}/save-as-template`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSavedTemplates((prev) => ({ ...prev, [phaseId]: { templateId: data.id, name: data.name } }))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save template')
        setSavedTemplates((prev) => ({ ...prev, [phaseId]: 'error' }))
      }
    } catch {
      alert('Network error')
      setSavedTemplates((prev) => ({ ...prev, [phaseId]: 'error' }))
    }
  }

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
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // If a coach is deleting a client's block, go back to the client's blocks page
        if (macrocycle?.createdByCoachId && authSession?.user?.id === macrocycle.createdByCoachId) {
          router.push(`/coach/clients/${macrocycle.userId}/blocks`)
        } else {
          router.push('/macrocycles')
        }
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

  async function handleActivatePhase(mesocycleId: string) {
    optimisticPhaseUpdate(mesocycleId, { status: 'active' })
    try {
      const res = await fetch(`/api/mesocycles/${mesocycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (!res.ok) {
        optimisticPhaseUpdate(mesocycleId, { status: 'planned' })
        alert('Failed to activate phase')
      }
    } catch {
      optimisticPhaseUpdate(mesocycleId, { status: 'planned' })
      alert('Failed to activate phase')
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

  async function confirmRebuild(mode: 'default' | 'manual' | 'repeat-previous') {
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
  const isCoachCreated = !!macrocycle.createdByCoachId
  // Coach who created this block should have full edit access; client gets read-only view
  const isViewingAsCoach = isCoachCreated && macrocycle.createdByCoachId === authSession?.user?.id
  const isReadOnly = isCoachCreated && !isViewingAsCoach

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link
        href={isViewingAsCoach ? `/coach/clients/${macrocycle.userId}/blocks` : '/macrocycles'}
        className="text-primary-500 hover:text-primary-400 text-xs font-medium inline-block"
      >
        {isViewingAsCoach ? '← Back to Client Blocks' : '← Back to Training Blocks'}
      </Link>

      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-700">This block was created by your coach. You can log workouts but editing the structure is disabled.</p>
        </div>
      )}

      {/* Block header — dark tile */}
      <div className="bg-gray-900 rounded-2xl shadow-md px-6 py-5">
        {/* Title */}
        {!isReadOnly && editingName ? (
          <div className="flex items-center gap-2 mb-3">
            <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} autoFocus className="flex-1" />
            <Button size="sm" onClick={handleSaveName}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => { setEditedName(macrocycle.name); setEditingName(false) }}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-semibold text-white flex-1">{macrocycle.name}</h1>
            {!isReadOnly && (
              <button onClick={() => setEditingName(true)} className="text-gray-500 hover:text-gray-300 text-lg leading-none" title="Edit name">✎</button>
            )}
          </div>
        )}

        {/* Dates */}
        {!isReadOnly && editingDates ? (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input type="date" value={editedStartDate} onChange={(e) => setEditedStartDate(e.target.value)} className="px-2 py-1 border border-gray-600 bg-gray-800 text-white rounded text-xs" />
            <span className="text-gray-500">–</span>
            <input type="date" value={editedEndDate} onChange={(e) => setEditedEndDate(e.target.value)} className="px-2 py-1 border border-gray-600 bg-gray-800 text-white rounded text-xs" />
            <Button size="sm" onClick={handleSaveDates}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => { setEditedStartDate(macrocycle.startDate.split('T')[0]); setEditedEndDate(macrocycle.endDate.split('T')[0]); setEditingDates(false) }}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-gray-400">
              {new Date(macrocycle.startDate).toLocaleDateString('en-AU')} – {new Date(macrocycle.endDate).toLocaleDateString('en-AU')} · {duration} weeks
            </p>
            {!isReadOnly && (
              <button onClick={() => setEditingDates(true)} className="text-gray-500 hover:text-gray-300 text-base leading-none" title="Edit dates">✎</button>
            )}
          </div>
        )}

        {/* Status + Delete */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
          <select
            value={macrocycle.status}
            onChange={(e) => handleStatusChange(e.target.value as 'planned' | 'active' | 'paused' | 'completed')}
            className="px-3 py-1.5 text-sm font-medium bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          {!isReadOnly && (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>Delete</Button>
          )}
        </div>

        {macrocycle.description && (
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">{macrocycle.description}</p>
        )}
      </div>

      {/* Training Phases */}
      <p className="text-sm font-medium text-gray-700 pt-2">Training Phases</p>

      {macrocycle.mesocycles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md px-6 py-12 text-center">
          <p className="text-sm text-gray-500">No phases in this block yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {macrocycle.mesocycles.map((phase, index) => {
            const isExpanded = expandedPhases.has(phase.id)
            const weekCount = phase.microcycles.length
            const phaseHasStarted = new Date(phase.startDate) <= new Date()
            const isLocked = phaseHasStarted && (phase.status === 'active' || phase.status === 'completed')
            const isEditable = !(isLocked && !isViewingAsCoach) && !isReadOnly

            return (
              <div key={phase.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Orange header — clickable */}
                <div
                  className="bg-primary-600 px-5 py-4 cursor-pointer"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">Phase {index + 1}</h3>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isLocked && <span className="text-primary-200 text-xs">🔒</span>}
                      {phase.status && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/20 text-white">
                          {phase.status}
                        </span>
                      )}
                      {isViewingAsCoach && phase.status === 'planned' && (
                        <button
                          type="button"
                          onClick={() => handleActivatePhase(phase.id)}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-white text-primary-700 hover:bg-primary-50 transition"
                        >
                          Activate
                        </button>
                      )}
                      <span className="text-primary-200 text-xs ml-1">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-primary-200">
                      {new Date(phase.startDate).toLocaleDateString('en-AU')} – {new Date(phase.endDate).toLocaleDateString('en-AU')}
                    </p>
                    <p className="text-xs text-primary-200 font-medium">{weekCount} {weekCount === 1 ? 'week' : 'weeks'}</p>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 py-4 space-y-4">
                    {phase.status === 'completed' ? (
                      <>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <span className="text-gray-400 text-base">✓</span>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Phase complete</p>
                            {phase.goal && <p className="text-xs text-gray-400 mt-0.5">{phase.goal} · {weekCount} {weekCount === 1 ? 'week' : 'weeks'}</p>}
                          </div>
                        </div>
                        <Link
                          href={`/mesocycles/${phase.id}`}
                          className="block w-full text-center text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl py-2.5 transition"
                        >
                          View Phase Details →
                        </Link>
                      </>
                    ) : (
                    <>
                    {!isLocked && !isCoachCreated && dirtyStructure.has(phase.id) && (
                      <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                        Days/split updated. Click &quot;Update Workouts&quot; below to apply the new structure.
                      </p>
                    )}

                    {/* Side-by-side config rows */}
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-xs font-medium text-gray-500">Training Goal</p>
                        {isEditable ? (
                          <select
                            value={phase.goal || ''}
                            onChange={(e) => handleUpdatePhaseGoal(phase.id, e.target.value)}
                            className="text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 w-36"
                          >
                            {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <p className="text-xs font-medium text-gray-900">{phase.goal || '—'}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-xs font-medium text-gray-500">Days Per Week</p>
                        {isEditable ? (
                          <select
                            value={phase.trainingDaysPerWeek?.toString() || ''}
                            onChange={(e) => handleUpdateTrainingDays(phase.id, parseInt(e.target.value))}
                            className="text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 w-36"
                          >
                            <option value="">Select days...</option>
                            {['2','3','4','5','6','7'].map((d) => <option key={d} value={d}>{d} days/week</option>)}
                          </select>
                        ) : (
                          <p className="text-xs font-medium text-gray-900">{phase.trainingDaysPerWeek ? `${phase.trainingDaysPerWeek} days/week` : '—'}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-xs font-medium text-gray-500">Training Split</p>
                        {isEditable ? (
                          <select
                            value={phase.trainingSplit || ''}
                            onChange={(e) => handleUpdateTrainingSplit(phase.id, e.target.value)}
                            className="text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 w-36"
                          >
                            {getSplitOptions(phase.trainingDaysPerWeek ?? null).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <p className="text-xs font-medium text-gray-900">{phase.trainingSplit || '—'}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-xs font-medium text-gray-500">Phase Length</p>
                        {phase.status !== 'completed' && !isReadOnly ? (
                          <select
                            value={phase.microcycles.length}
                            onChange={(e) => {
                              const n = parseInt(e.target.value)
                              if (n !== phase.microcycles.length) {
                                setResizeModal({ phase, newWeekCount: n, phaseIndex: index + 1 })
                              }
                            }}
                            disabled={resizing === phase.id}
                            className="text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 w-36 disabled:opacity-50"
                          >
                            {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                              <option key={w} value={w}>{w} {w === 1 ? 'week' : 'weeks'}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs font-medium text-gray-900">
                            {phase.microcycles.length} {phase.microcycles.length === 1 ? 'week' : 'weeks'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      {!isLocked && !isCoachCreated && phase.trainingDaysPerWeek && phase.trainingSplit && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStructure(phase)}
                          disabled={updatingStructure === phase.id}
                          className={`block w-full text-center text-xs font-medium rounded-xl py-2.5 transition border ${
                            dirtyStructure.has(phase.id)
                              ? 'text-white bg-primary-600 hover:bg-primary-700 border-primary-700'
                              : 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200'
                          } disabled:opacity-50`}
                        >
                          {updatingStructure === phase.id ? 'Updating...' : dirtyStructure.has(phase.id) ? '↻ Update Workouts' : '↻ Rebuild Workouts'}
                        </button>
                      )}
                      <Link
                        href={`/mesocycles/${phase.id}`}
                        className="block w-full text-center text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl py-2.5 transition"
                      >
                        View Phase Details →
                      </Link>
                      {authSession?.user?.role === 'COACH' && phase.microcycles.some((mc) => mc.workouts.length > 0) && (() => {
                        const ts = savedTemplates[phase.id]
                        if (ts && ts !== 'saving' && ts !== 'error') {
                          return (
                            <p className="text-center text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl py-2.5">
                              Saved as &ldquo;{ts.name}&rdquo;{' '}
                              <a href={`/coach/templates/${ts.templateId}`} className="underline font-medium text-primary-600">View template →</a>
                            </p>
                          )
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => handleSaveAsTemplate(phase.id)}
                            disabled={ts === 'saving'}
                            className="block w-full text-center text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl py-2.5 transition disabled:opacity-50"
                          >
                            {ts === 'saving' ? 'Saving…' : '📋 Save Phase as Template'}
                          </button>
                        )
                      })()}
                      {phase.status !== 'completed' && !isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setEndPhaseModal({ phase, phaseIndex: index + 1 })}
                          disabled={endingPhase === phase.id}
                          className="block w-full text-center text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl py-2.5 transition disabled:opacity-50"
                        >
                          {endingPhase === phase.id ? 'Ending phase...' : '⏹ End Phase Early'}
                        </button>
                      )}
                    </div>
                    </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Rebuild workouts modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Training Block"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{macrocycle.name}</span>? This will permanently delete all phases, weeks, and workouts.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { setShowDeleteModal(false); handleDelete() }}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {rebuildModal && (() => {
        const phaseIndex = macrocycle!.mesocycles.indexOf(rebuildModal) + 1
        const prevPhase = phaseIndex > 1 ? macrocycle!.mesocycles[phaseIndex - 2] : null
        const prevPhaseHasWorkouts = prevPhase?.microcycles.some((mc) => mc.workouts.length > 0) ?? false
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-5 border-b">
                <h2 className="text-lg font-bold text-gray-900">Rebuild Phase {phaseIndex} Workouts</h2>
                <p className="text-sm text-gray-500 mt-1">
                  This will replace the current workout structure. Choose how to set up the new workouts:
                </p>
              </div>

              <div className="p-5">
                <div className="space-y-3">
                  {rebuildModal.trainingSplit !== 'Custom' && (
                    <button
                      type="button"
                      onClick={() => confirmRebuild('default')}
                      className="w-full text-left p-4 rounded-lg border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 transition"
                    >
                      <p className="font-semibold text-primary-800 text-sm">🎯 Create Default Workout Structure</p>
                      <p className="text-xs text-primary-600 mt-0.5">Auto-populate exercises based on your split, training goal, and recovery weeks</p>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => confirmRebuild('manual')}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <p className="font-semibold text-gray-800 text-sm">✏️ Manually Create Workouts</p>
                    <p className="text-xs text-gray-500 mt-0.5">Create empty workout slots and add exercises yourself</p>
                  </button>

                  {phaseIndex > 1 && (
                    <button
                      type="button"
                      onClick={() => prevPhaseHasWorkouts ? confirmRebuild('repeat-previous') : undefined}
                      disabled={!prevPhaseHasWorkouts}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        prevPhaseHasWorkouts
                          ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer'
                          : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <p className={`font-semibold text-sm ${prevPhaseHasWorkouts ? 'text-purple-800' : 'text-gray-500'}`}>
                        📋 Repeat Phase {phaseIndex - 1}
                      </p>
                      <p className={`text-xs mt-0.5 ${prevPhaseHasWorkouts ? 'text-purple-600' : 'text-gray-400'}`}>
                        {prevPhaseHasWorkouts
                          ? `Copy all exercises, sets, reps, rest times and RIR targets from Phase ${phaseIndex - 1}`
                          : `Generate workouts in Phase ${phaseIndex - 1} first`}
                      </p>
                    </button>
                  )}
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

      {/* Resize phase modal */}
      {resizeModal && (() => {
        const { phase, newWeekCount, phaseIndex } = resizeModal
        const currentCount = phase.microcycles.length
        const diff = Math.abs(newWeekCount - currentCount)
        const isAdding = newWeekCount > currentCount
        const daysDiff = diff * 7
        const hasLaterPhases = macrocycle!.mesocycles.indexOf(phase) < macrocycle!.mesocycles.length - 1
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-5 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  {isAdding ? `Add ${diff} Week${diff > 1 ? 's' : ''}` : `Remove ${diff} Week${diff > 1 ? 's' : ''}`}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Phase {phaseIndex} · {currentCount} → {newWeekCount} {newWeekCount === 1 ? 'week' : 'weeks'}</p>
              </div>
              <div className="p-5">
                {isAdding ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
                    <p className="text-sm text-blue-800">
                      {diff} week{diff > 1 ? 's' : ''} will be added to this phase. Workouts will be copied from week 1 of this phase.
                    </p>
                    {hasLaterPhases && (
                      <p className="text-sm text-blue-700">All subsequent phases will shift {daysDiff} days later.</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
                    <p className="text-sm text-amber-800">
                      The last {diff} week{diff > 1 ? 's' : ''} will be removed from this phase. Any workouts in those weeks will be permanently deleted.
                    </p>
                    {hasLaterPhases && (
                      <p className="text-sm text-amber-700">All subsequent phases will shift {daysDiff} days earlier.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="px-5 pb-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setResizeModal(null)}
                  className="flex-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl py-2.5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResize(phase.id, newWeekCount)}
                  className={`flex-1 text-sm font-medium text-white rounded-xl py-2.5 transition ${
                    isAdding ? 'bg-primary-600 hover:bg-primary-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* End phase early modal */}
      {endPhaseModal && (() => {
        const { phase, phaseIndex } = endPhaseModal
        const savedDays = Math.max(0, Math.round((new Date(phase.endDate).getTime() - Date.now()) / 86400000))
        const hasLaterPhases = macrocycle!.mesocycles.indexOf(phase) < macrocycle!.mesocycles.length - 1
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-5 border-b">
                <h2 className="text-lg font-bold text-gray-900">End Phase {phaseIndex} Early</h2>
                <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
              </div>
              <div className="p-5">
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-2">
                  <p className="text-sm text-red-800">All remaining incomplete workouts in this phase will be marked as skipped, and the phase will close today.</p>
                  {savedDays > 0 && (
                    <p className="text-sm text-red-700">
                      {hasLaterPhases
                        ? `All subsequent phases will shift ${savedDays} day${savedDays !== 1 ? 's' : ''} earlier.`
                        : `The training block end date will move ${savedDays} day${savedDays !== 1 ? 's' : ''} earlier.`}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-5 pb-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEndPhaseModal(null)}
                  className="flex-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl py-2.5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleEndPhase(phase.id)}
                  className="flex-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl py-2.5 transition"
                >
                  End Phase
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
