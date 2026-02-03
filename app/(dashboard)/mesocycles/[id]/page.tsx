'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'

interface Microcycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  weekNumber: number
  workouts: { id: string }[]
}

interface Mesocycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  focus?: string
  macrocycle: {
    id: string
    name: string
  }
  microcycles: Microcycle[]
}

export default function MesocycleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMesocycle()
  }, [])

  async function fetchMesocycle() {
    try {
      const response = await fetch(`/api/mesocycles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMesocycle(data)
      }
    } catch (error) {
      console.error('Error fetching mesocycle:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this mesocycle?')) {
      return
    }

    try {
      const response = await fetch(`/api/mesocycles/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok && mesocycle) {
        router.push(`/macrocycles/${mesocycle.macrocycle.id}`)
      }
    } catch (error) {
      console.error('Error deleting mesocycle:', error)
    }
  }

  async function handleCreateMicrocycle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      weekNumber: parseInt(formData.get('weekNumber') as string),
      mesocycleId: params.id,
    }

    try {
      const response = await fetch('/api/microcycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchMesocycle()
      }
    } catch (error) {
      console.error('Error creating microcycle:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!mesocycle) {
    return <div className="text-center py-8">Mesocycle not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/macrocycles/${mesocycle.macrocycle.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          ← Back to {mesocycle.macrocycle.name}
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mesocycle.name}</h1>
              <p className="text-gray-600 mt-1">
                {new Date(mesocycle.startDate).toLocaleDateString()} -{' '}
                {new Date(mesocycle.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 items-start">
              {mesocycle.focus && (
                <span className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full">
                  {mesocycle.focus}
                </span>
              )}
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {mesocycle.description && (
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600">{mesocycle.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Microcycles</h2>
        <Button onClick={() => setIsModalOpen(true)}>Add Microcycle</Button>
      </div>

      {mesocycle.microcycles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No microcycles yet. Create your first week!</p>
              <Button onClick={() => setIsModalOpen(true)}>Create Microcycle</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {mesocycle.microcycles.map((micro) => (
            <Link key={micro.id} href={`/microcycles/${micro.id}`}>
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          Week {micro.weekNumber}
                        </span>
                        <h3 className="text-lg font-semibold">{micro.name}</h3>
                      </div>
                      {micro.description && (
                        <p className="text-sm text-gray-600 mt-1">{micro.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(micro.startDate).toLocaleDateString()} -{' '}
                        {new Date(micro.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{micro.workouts.length} workouts</p>
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
        title="Create New Microcycle"
      >
        <form onSubmit={handleCreateMicrocycle} className="space-y-4">
          <Input
            label="Name"
            name="name"
            required
            placeholder="e.g., Week 1"
          />

          <Input
            label="Week Number"
            name="weekNumber"
            type="number"
            min="1"
            required
            placeholder="1"
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
