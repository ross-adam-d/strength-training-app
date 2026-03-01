'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface PR {
  exerciseId: string
  exerciseName: string
  est1RM: number
  est5RM: number
  est10RM: number
  lastLoggedAt: string
}

export default function ClientProgressPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const [prs, setPrs] = useState<PR[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/coach/clients/${clientId}/progress`)
      .then((r) => r.json())
      .then(setPrs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading progress data...</div>
  }

  if (prs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No logged sets yet — progress data will appear after workouts are tracked.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Estimated maxes</h3>
          <p className="text-xs text-gray-400 mt-0.5">Based on logged sets using the Epley formula</p>
        </div>
        <div className="divide-y divide-gray-50">
          {prs.map((pr) => (
            <div key={pr.exerciseId} className="px-5 py-3.5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{pr.exerciseName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Last logged{' '}
                  {new Date(pr.lastLoggedAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-5 text-right flex-shrink-0">
                <div>
                  <p className="text-xs text-gray-400">e1RM</p>
                  <p className="text-sm font-semibold text-gray-900">{pr.est1RM} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">e5RM</p>
                  <p className="text-sm font-medium text-gray-600">{pr.est5RM} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">e10RM</p>
                  <p className="text-sm font-medium text-gray-600">{pr.est10RM} kg</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
