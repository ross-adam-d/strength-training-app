'use client'

import { useEffect, useState } from 'react'
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
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/macrocycles')
      .then((res) => res.json())
      .then((data) => setMacrocycles(data))
      .catch((err) => console.error('Error fetching macrocycles:', err))
      .finally(() => setLoading(false))
  }, [])

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
        <Link href="/macrocycles/setup">
          <Button>New Training Block</Button>
        </Link>
      </div>

      {macrocycles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No training blocks yet. Create your first one!</p>
              <Link href="/macrocycles/setup">
                <Button>Get Started</Button>
              </Link>
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
