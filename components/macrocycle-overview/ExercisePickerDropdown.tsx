'use client'

import { useState, useRef, useEffect } from 'react'

interface Exercise {
  id: string
  name: string
}

interface ExercisePickerDropdownProps {
  exercises: Exercise[]
  value: string
  onChange: (exerciseId: string) => void
  onExerciseCreated: (exercise: Exercise) => void
}

export function ExercisePickerDropdown({
  exercises,
  value,
  onChange,
  onExerciseCreated,
}: ExercisePickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = exercises.find((ex) => ex.id === value)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          muscleGroups: [],
          equipment: [],
          isPublic: false,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        onExerciseCreated({ id: created.id, name: created.name })
        onChange(created.id)
        setCreating(false)
        setNewName('')
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open)
          setSearch('')
        }}
        className="w-full text-left text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 hover:border-primary-400 truncate"
      >
        {selected?.name || 'Pick exercise...'}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg">
          <input
            type="text"
            autoFocus
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border-b border-gray-200 focus:outline-none"
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  onChange(ex.id)
                  setOpen(false)
                }}
                className={`w-full text-left text-sm px-2 py-1.5 hover:bg-primary-50 ${
                  ex.id === value ? 'bg-primary-100 font-medium' : ''
                }`}
              >
                {ex.name}
              </button>
            ))}
            {filtered.length === 0 && !creating && (
              <p className="text-xs text-gray-400 px-2 py-2 text-center">No matches</p>
            )}
          </div>

          {creating ? (
            <div className="border-t p-2 flex gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !newName.trim()}
                className="text-xs bg-primary-600 text-white px-2 py-1 rounded disabled:opacity-50"
              >
                {saving ? '...' : 'Add'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full border-t text-left text-xs text-primary-600 hover:bg-primary-50 px-2 py-1.5"
            >
              + Create custom exercise
            </button>
          )}
        </div>
      )}
    </div>
  )
}
