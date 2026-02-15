'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import Link from 'next/link'

interface Mesocycle {
  id: string
  name: string
  focus: string | null
  goal: string | null
  trainingDaysPerWeek: number | null
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

  async function handleSaveName() {
    if (!editedName.trim()) return

    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName }),
      })

      if (response.ok) {
        await fetchMacrocycle()
        setEditingName(false)
      }
    } catch (error) {
      console.error('Error updating name:', error)
    }
  }

  async function handleSaveDates() {
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: editedStartDate,
          endDate: editedEndDate,
        }),
      })

      if (response.ok) {
        await fetchMacrocycle()
        setEditingDates(false)
      }
    } catch (error) {
      console.error('Error updating dates:', error)
    }
  }

  async function handleStatusChange(newStatus: 'planned' | 'active' | 'paused' | 'completed') {
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchMacrocycle()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update status')
        // Revert the dropdown on error
        await fetchMacrocycle()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
      await fetchMacrocycle()
    }
  }

  async function handleUpdatePhaseGoal(mesocycleId: string, goal: string) {
    try {
      const response = await fetch(`/api/mesocycles/${mesocycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })

      if (response.ok) {
        await fetchMacrocycle()
      }
    } catch (error) {
      console.error('Error updating phase goal:', error)
    }
  }

  async function handleUpdateTrainingDays(mesocycleId: string, days: number) {
    try {
      const response = await fetch(`/api/mesocycles/${mesocycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingDaysPerWeek: days }),
      })

      if (response.ok) {
        await fetchMacrocycle()
      }
    } catch (error) {
      console.error('Error updating training days:', error)
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
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
        </div>

        {/* Training Block Card Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-5 bg-gray-100 rounded w-96"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 bg-gray-200 rounded w-32"></div>
              <div className="h-9 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>

        {/* Section Header Skeleton */}
        <div className="mb-4 space-y-2">
          <div className="h-7 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-100 rounded w-96"></div>
        </div>

        {/* Phases Skeleton */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-6 bg-gray-200 rounded w-6"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-64"></div>
                    <div className="h-4 bg-gray-100 rounded w-80"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-24"></div>
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
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setEditedName(macrocycle.name)
                    setEditingName(false)
                  }}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{macrocycle.name}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    ✎ Edit
                  </button>
                </div>
              )}

              {editingDates ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="date"
                    value={editedStartDate}
                    onChange={(e) => setEditedStartDate(e.target.value)}
                    className="px-2 py-1 border rounded"
                  />
                  <span>–</span>
                  <input
                    type="date"
                    value={editedEndDate}
                    onChange={(e) => setEditedEndDate(e.target.value)}
                    className="px-2 py-1 border rounded"
                  />
                  <Button size="sm" onClick={handleSaveDates}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setEditedStartDate(macrocycle.startDate.split('T')[0])
                    setEditedEndDate(macrocycle.endDate.split('T')[0])
                    setEditingDates(false)
                  }}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-gray-600">
                    {new Date(macrocycle.startDate).toLocaleDateString()} –{' '}
                    {new Date(macrocycle.endDate).toLocaleDateString()} ({duration} weeks)
                  </p>
                  <button
                    onClick={() => setEditingDates(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    ✎ Edit
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
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
          </div>
        </CardHeader>
        <CardBody>
          {macrocycle.description && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600">{macrocycle.description}</p>
            </div>
          )}
          {macrocycle.goals && (
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Goals</h3>
              <p className="text-gray-600">{macrocycle.goals}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Training Phases</h2>
        <p className="text-gray-600 text-sm mt-1">
          Configure goals and training split for each phase
        </p>
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

            return (
              <Card key={phase.id}>
                <CardBody>
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => togglePhase(phase.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Phase {index + 1}: {phase.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(phase.startDate).toLocaleDateString()} – {new Date(phase.endDate).toLocaleDateString()}
                          {' '}• {weekCount} {weekCount === 1 ? 'week' : 'weeks'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Goal
                          </label>
                          <Select
                            options={GOAL_OPTIONS}
                            value={phase.goal || ''}
                            onChange={(e) => handleUpdatePhaseGoal(phase.id, e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Days Per Week
                          </label>
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
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-gray-600">
                          {phase.goal && (
                            <span className="font-medium">Goal: {phase.goal}</span>
                          )}
                          {phase.trainingDaysPerWeek && (
                            <span className="ml-4">
                              Training {phase.trainingDaysPerWeek} days/week
                            </span>
                          )}
                        </p>
                        <Link href={`/mesocycles/${phase.id}`}>
                          <Button size="sm">
                            View Phase Details →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
