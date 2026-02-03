'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import MacrocycleOverview, { MacrocycleData } from '@/components/macrocycle-overview/MacrocycleOverview'

export default function MacrocycleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [macrocycle, setMacrocycle] = useState<MacrocycleData | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchMacrocycle() {
    try {
      const response = await fetch(`/api/macrocycles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMacrocycle(data)
      }
    } catch (error) {
      console.error('Error fetching macrocycle:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMacrocycle()
  }, [])

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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!macrocycle) {
    return <div className="text-center py-8">Training block not found</div>
  }

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{macrocycle.name}</h1>
              <p className="text-gray-600 mt-1">
                {new Date(macrocycle.startDate).toLocaleDateString()} –{' '}
                {new Date(macrocycle.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  macrocycle.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : macrocycle.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {macrocycle.status}
              </span>
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

      <MacrocycleOverview data={macrocycle} onRefresh={fetchMacrocycle} />
    </div>
  )
}
