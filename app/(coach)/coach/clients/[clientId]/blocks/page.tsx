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

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading blocks...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{macrocycles.length} block{macrocycles.length !== 1 ? 's' : ''}</p>
        <a
          href={`/coach/clients/${clientId}/blocks/new`}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
        >
          + Create Block
        </a>
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
    </div>
  )
}
