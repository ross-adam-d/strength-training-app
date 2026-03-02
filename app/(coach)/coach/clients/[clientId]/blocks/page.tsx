'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Mesocycle {
  id: string
  name: string
  status: string
}

interface Macrocycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  description: string | null
  goals: string | null
  createdByCoachId: string | null
  mesocycles: Mesocycle[]
}

export default function ClientBlocksPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'planned' as 'planned' | 'active' })

  const loadBlocks = useCallback(() => {
    setLoading(true)
    fetch(`/api/coach/clients/${clientId}/macrocycles`)
      .then((r) => r.json())
      .then(setMacrocycles)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setCreateError('Please fill in all fields.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`/api/coach/clients/${clientId}/macrocycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create block')
        return
      }
      setShowCreateModal(false)
      setForm({ name: '', startDate: '', endDate: '', status: 'planned' })
      loadBlocks()
    } catch {
      setCreateError('Failed to create block')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading blocks...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{macrocycles.length} block{macrocycles.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
        >
          + Create Block
        </button>
      </div>

      {macrocycles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No training blocks yet</p>
          <p className="text-gray-400 text-xs mt-1">Create a block to start building this client&apos;s programme</p>
        </div>
      ) : (
        <div className="space-y-3">
          {macrocycles.map((macro) => (
            <div key={macro.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{macro.name}</p>
                    {macro.createdByCoachId && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                        Coach-created
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(macro.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(macro.endDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      macro.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : macro.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {macro.status}
                  </span>
                  {macro.createdByCoachId && (
                    <Link
                      href={`/macrocycles/${macro.id}`}
                      className="px-3 py-1 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition"
                    >
                      Edit →
                    </Link>
                  )}
                </div>
              </div>

              {macro.description && (
                <p className="text-sm text-gray-500 mb-2">{macro.description}</p>
              )}

              {macro.mesocycles.length > 0 && (
                <div className="mt-3 space-y-1">
                  {macro.mesocycles.map((meso) => (
                    <div key={meso.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          meso.status === 'active'
                            ? 'bg-green-500'
                            : meso.status === 'completed'
                            ? 'bg-blue-400'
                            : 'bg-gray-300'
                        }`}
                      />
                      {meso.name}
                      <span
                        className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                          meso.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : meso.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {meso.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Block Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Create Training Block</h2>
              <p className="text-sm text-gray-500 mt-1">Build a new block for this client</p>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Hypertrophy Block"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'planned' | 'active' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                </select>
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateError('') }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
