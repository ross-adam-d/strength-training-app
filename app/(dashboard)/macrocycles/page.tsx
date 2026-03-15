'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'

interface Macrocycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  goals?: string
  status: string
  mesocycles: { id: string; name: string }[]
}

export default function MacrocyclesPage() {
  const { data: session } = useSession()
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/macrocycles')
      .then((res) => res.json())
      .then((data) => setMacrocycles(data))
      .catch((err) => console.error('Error fetching macrocycles:', err))
      .finally(() => setLoading(false))
  }, [])

  // Coached athletes without their own subscription can only access coach-assigned blocks
  const hasActiveCoach = (session?.user as any)?.hasActiveCoach ?? false
  const subscriptionStatus = session?.user?.subscriptionStatus
  const trialEndsAt = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) : null
  const hasOwnAccess =
    subscriptionStatus === 'ACTIVE' ||
    (subscriptionStatus === 'TRIALING' && trialEndsAt != null && trialEndsAt > new Date())
  const isCoachOnlyMode = hasActiveCoach && !hasOwnAccess

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Blocks</h1>
          <p className="text-gray-600 mt-2">Manage your long-term training cycles</p>
        </div>
        {!isCoachOnlyMode && (
          <Link href="/macrocycles/setup">
            <Button>New Training Block</Button>
          </Link>
        )}
      </div>

      {isCoachOnlyMode && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-900">Your training is managed by your coach</p>
              <p className="text-sm text-orange-700 mt-0.5">
                You can log workouts from the blocks your coach has created.
                To build your own training blocks,{' '}
                <Link href="/subscribe" className="underline font-semibold hover:text-orange-900">subscribe to Elite</Link>.
              </p>
            </div>
          </div>
        </div>
      )}

      {macrocycles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              {isCoachOnlyMode ? (
                <>
                  <p className="text-gray-600 mb-2">No training blocks yet.</p>
                  <p className="text-sm text-gray-500">Your coach will assign a training block to you once your programme is ready.</p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">No training blocks yet. Create your first one!</p>
                  <Link href="/macrocycles/setup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {macrocycles.map((macro) => (
            <Link key={macro.id} href={`/macrocycles/${macro.id}`}>
              <Card className={`hover:shadow-lg transition cursor-pointer h-full ${macro.status === 'active' ? 'border-2 border-primary-500' : ''}`}>
                <CardBody>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold">{macro.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        macro.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : macro.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {macro.status}
                    </span>
                  </div>
                  {macro.description && (
                    <p className="text-gray-600 text-sm mb-3">{macro.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    <p>
                      {new Date(macro.startDate).toLocaleDateString()} –{' '}
                      {new Date(macro.endDate).toLocaleDateString()}
                    </p>
                    <p className="mt-1">{macro.mesocycles.length} phases</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
