'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface Mesocycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  focus?: string
  microcycles: { id: string }[]
}

interface Macrocycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  goals?: string
  status: string
  mesocycles: Mesocycle[]
}

export default function MacrocycleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [macrocycle, setMacrocycle] = useState<Macrocycle | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMacrocycle()
  }, [])

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

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this macrocycle? This will delete all associated data.')) {
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

  async function handleCreateMesocycle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      focus: formData.get('focus') as string,
      macrocycleId: params.id,
    }

    try {
      const response = await fetch('/api/mesocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchMacrocycle()
      }
    } catch (error) {
      console.error('Error creating mesocycle:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!macrocycle) {
    return <div className="text-center py-8">Macrocycle not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/macrocycles" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Macrocycles
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{macrocycle.name}</h1>
              <p className="text-gray-600 mt-1">
                {new Date(macrocycle.startDate).toLocaleDateString()} -{' '}
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

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Mesocycles</h2>
        <Button onClick={() => setIsModalOpen(true)}>Add Mesocycle</Button>
      </div>

      {macrocycle.mesocycles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No mesocycles yet. Create your first training phase!</p>
              <Button onClick={() => setIsModalOpen(true)}>Create Mesocycle</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {macrocycle.mesocycles.map((meso) => (
            <Link key={meso.id} href={`/mesocycles/${meso.id}`}>
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{meso.name}</h3>
                      {meso.description && (
                        <p className="text-sm text-gray-600 mt-1">{meso.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(meso.startDate).toLocaleDateString()} -{' '}
                        {new Date(meso.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {meso.focus && (
                        <span className="text-sm px-2 py-1 bg-primary-100 text-primary-700 rounded">
                          {meso.focus}
                        </span>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {meso.microcycles.length} microcycles
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Mesocycle"
      >
        <form onSubmit={handleCreateMesocycle} className="space-y-4">
          <Input
            label="Name"
            name="name"
            required
            placeholder="e.g., Hypertrophy Phase 1"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" name="startDate" type="date" required />
            <Input label="End Date" name="endDate" type="date" required />
          </div>

          <Input
            label="Focus"
            name="focus"
            placeholder="e.g., Hypertrophy, Strength, Power"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
