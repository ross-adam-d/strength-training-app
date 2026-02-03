import { useState } from 'react'

interface ExerciseSlot {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetReps: string
  notes: string | null
  exercise: { id: string; name: string }
}

interface Exercise {
  id: string
  name: string
}

interface ExerciseSlotRowProps {
  slot: ExerciseSlot
  exercises: Exercise[]
  onSlotChange: () => void
}

export function ExerciseSlotRow({ slot, exercises, onSlotChange }: ExerciseSlotRowProps) {
  const [editing, setEditing] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState(slot.exerciseId)

  async function handleSwap() {
    if (selectedExerciseId === slot.exerciseId) {
      setEditing(false)
      return
    }
    const res = await fetch(`/api/workout-exercises/${slot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId: selectedExerciseId }),
    })
    if (res.ok) {
      setEditing(false)
      onSlotChange()
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/workout-exercises/${slot.id}`, { method: 'DELETE' })
    if (res.ok) onSlotChange()
  }

  async function handleReorder(direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? slot.orderIndex - 1 : slot.orderIndex + 1
    if (newIndex < 0) return
    const res = await fetch(`/api/workout-exercises/${slot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIndex: newIndex }),
    })
    if (res.ok) onSlotChange()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 bg-primary-50 rounded p-1.5">
        <select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-1"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
        <button type="button" onClick={handleSwap} className="text-xs bg-primary-600 text-white px-2 py-1 rounded">
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      {slot.notes && (
        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap">
          {slot.notes}
        </span>
      )}
      <span
        className="text-xs text-gray-700 flex-1 truncate cursor-pointer hover:text-primary-600"
        onClick={() => setEditing(true)}
      >
        {slot.exercise.name}
      </span>
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {slot.targetSets}×{slot.targetReps}
      </span>
      <div className="hidden group-hover:flex items-center gap-0.5">
        <button type="button" onClick={() => handleReorder('up')} className="text-gray-400 hover:text-gray-600 text-xs px-1">↑</button>
        <button type="button" onClick={() => handleReorder('down')} className="text-gray-400 hover:text-gray-600 text-xs px-1">↓</button>
        <button type="button" onClick={handleDelete} className="text-gray-400 hover:text-red-600 text-xs px-1">✕</button>
      </div>
    </div>
  )
}
