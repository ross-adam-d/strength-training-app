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
  isUnilateral: boolean
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

const MUSCLE_GROUP_OPTIONS = [
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

const EQUIPMENT_CREATE_OPTIONS = [
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

  // Form state for creating exercises
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function toggleMuscleGroup(value: string) {
    setSelectedMuscleGroups((prev) =>
      prev.includes(value)
        ? prev.filter((m) => m !== value)
        : [...prev, value]
    )
    setFormError('') // Clear error when user makes changes
  }

  function toggleEquipment(value: string) {
    setSelectedEquipment((prev) =>
      prev.includes(value)
        ? prev.filter((e) => e !== value)
        : [...prev, value]
    )
    setFormError('') // Clear error when user makes changes
  }

  function resetForm() {
    setSelectedMuscleGroups([])
    setSelectedEquipment([])
    setFormError('')
    setIsSubmitting(false)
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    // Frontend validation
    if (selectedMuscleGroups.length === 0) {
      setFormError('Please select at least one muscle group')
      return
    }

    if (selectedEquipment.length === 0) {
      setFormError('Please select at least one equipment type')
      return
    }

    const formData = new FormData(event.currentTarget)

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      muscleGroups: selectedMuscleGroups,
      equipment: selectedEquipment,
      videoUrl: formData.get('videoUrl') as string,
      imageUrl: formData.get('imageUrl') as string,
      isPublic: formData.get('isPublic') === 'on',
      isUnilateral: formData.get('isUnilateral') === 'on',
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsModalOpen(false)
        resetForm()
        fetchExercises()
      } else {
        const errorData = await response.json()
        setFormError(errorData.error || 'Failed to create exercise')
      }
    } catch (error) {
      console.error('Error creating exercise:', error)
      setFormError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
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
        <Button onClick={() => {
          setIsModalOpen(true)
          resetForm()
        }}>Create Exercise</Button>
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
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Create New Exercise"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Muscle Groups <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              {MUSCLE_GROUP_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedMuscleGroups.includes(option.value)}
                    onChange={() => toggleMuscleGroup(option.value)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {selectedMuscleGroups.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedMuscleGroups.join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              {EQUIPMENT_CREATE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedEquipment.includes(option.value)}
                    onChange={() => toggleEquipment(option.value)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {selectedEquipment.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedEquipment.join(', ')}
              </p>
            )}
          </div>

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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPublic" name="isPublic" className="rounded" />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this exercise public (visible to all users)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isUnilateral" name="isUnilateral" className="rounded" />
              <label htmlFor="isUnilateral" className="text-sm text-gray-700">
                Unilateral exercise (single-side, e.g., single-leg press, single-arm row)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
