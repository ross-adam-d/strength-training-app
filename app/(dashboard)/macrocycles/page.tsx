'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMacrocycles()
  }, [])

  async function fetchMacrocycles() {
    try {
      const response = await fetch('/api/macrocycles')
      const data = await response.json()
      setMacrocycles(data)
    } catch (error) {
      console.error('Error fetching macrocycles:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      goals: formData.get('goals') as string,
      status: formData.get('status') as string,
    }

    try {
      const response = await fetch('/api/macrocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchMacrocycles()
      }
    } catch (error) {
      console.error('Error creating macrocycle:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Macrocycles</h1>
          <p className="text-gray-600 mt-2">Manage your long-term training cycles</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create Macrocycle</Button>
      </div>

      {macrocycles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No macrocycles yet. Create your first training cycle!</p>
              <Button onClick={() => setIsModalOpen(true)}>Get Started</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {macrocycles.map((macro) => (
            <Link key={macro.id} href={`/macrocycles/${macro.id}`}>
              <Card className="hover:shadow-lg transition cursor-pointer h-full">
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
                      {new Date(macro.startDate).toLocaleDateString()} -{' '}
                      {new Date(macro.endDate).toLocaleDateString()}
                    </p>
                    <p className="mt-1">{macro.mesocycles.length} mesocycles</p>
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
        title="Create New Macrocycle"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Name"
            name="name"
            required
            placeholder="e.g., Winter 2024 Training Block"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" name="startDate" type="date" required />
            <Input label="End Date" name="endDate" type="date" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goals
            </label>
            <textarea
              name="goals"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What do you want to achieve?"
            />
          </div>

          <Select
            label="Status"
            name="status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' },
            ]}
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
