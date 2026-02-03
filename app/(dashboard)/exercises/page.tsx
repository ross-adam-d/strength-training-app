'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroups: string[]
  equipment: string[]
  isPublic: boolean
  createdById?: string
}

const MUSCLE_GROUPS = [
  { value: '', label: 'All Muscle Groups' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'legs', label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'core', label: 'Core' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'forearms', label: 'Forearms' },
]

const EQUIPMENT_OPTIONS = [
  { value: '', label: 'All Equipment' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance-band', label: 'Resistance Band' },
]

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')

  useEffect(() => {
    fetchExercises()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [exercises, searchTerm, muscleFilter, equipmentFilter])

  async function fetchExercises() {
    try {
      const response = await fetch('/api/exercises')
      const data = await response.json()
      setExercises(data)
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterExercises() {
    let filtered = [...exercises]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((ex) =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Muscle group filter
    if (muscleFilter) {
      filtered = filtered.filter((ex) => ex.muscleGroups.includes(muscleFilter))
    }

    // Equipment filter
    if (equipmentFilter) {
      filtered = filtered.filter((ex) => ex.equipment.includes(equipmentFilter))
    }

    setFilteredExercises(filtered)
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const muscleGroups = formData.get('muscleGroups') as string
    const equipment = formData.get('equipment') as string

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      muscleGroups: muscleGroups.split(',').map((m) => m.trim()).filter(Boolean),
      equipment: equipment.split(',').map((e) => e.trim()).filter(Boolean),
      videoUrl: formData.get('videoUrl') as string,
      imageUrl: formData.get('imageUrl') as string,
      isPublic: formData.get('isPublic') === 'on',
    }

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchExercises()
      }
    } catch (error) {
      console.error('Error creating exercise:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exercise Library</h1>
          <p className="text-gray-600 mt-2">Browse and manage your exercises</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create Exercise</Button>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              options={MUSCLE_GROUPS}
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
            />
            <Select
              options={EQUIPMENT_OPTIONS}
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredExercises.length} of {exercises.length} exercises
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="hover:shadow-lg transition">
            <CardBody>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{exercise.name}</h3>
                {!exercise.isPublic && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Custom
                  </span>
                )}
              </div>

              {exercise.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {exercise.description}
                </p>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Muscle Groups</p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.map((mg) => (
                      <span
                        key={mg}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                      >
                        {mg}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Equipment</p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.equipment.map((eq) => (
                      <span
                        key={eq}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600">No exercises found matching your filters</p>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Exercise"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Exercise Name"
            name="name"
            required
            placeholder="e.g., Barbell Bench Press"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe the exercise..."
            />
          </div>

          <Input
            label="Muscle Groups (comma-separated)"
            name="muscleGroups"
            required
            placeholder="e.g., chest, triceps, shoulders"
          />

          <Input
            label="Equipment (comma-separated)"
            name="equipment"
            required
            placeholder="e.g., barbell, bench"
          />

          <Input
            label="Video URL (optional)"
            name="videoUrl"
            type="url"
            placeholder="https://youtube.com/..."
          />

          <Input
            label="Image URL (optional)"
            name="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
          />

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublic" name="isPublic" className="rounded" />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this exercise public (visible to all users)
            </label>
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
