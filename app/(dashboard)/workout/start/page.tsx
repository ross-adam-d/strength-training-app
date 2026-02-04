'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ExercisePickerDropdown } from '@/components/macrocycle-overview/ExercisePickerDropdown'

interface Exercise {
  id: string
  name: string
}

interface SetLog {
  exerciseId: string
  setNumber: number
  reps: string
  weight: string
  rpe: string
  notes: string
}

export default function ManualWorkoutPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [logs, setLogs] = useState<SetLog[]>([])
  const [startTime] = useState(new Date())
  const [overallNotes, setOverallNotes] = useState('')
  const [overallRating, setOverallRating] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)
  const [pickerValue, setPickerValue] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetch('/api/exercises').then((r) => r.json()).then(setExercises)
  }, [])

  // Tick elapsed time every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  function addExercise(exerciseId: string) {
    if (!exerciseId) return
    const ex = exercises.find((e) => e.id === exerciseId)
    if (!ex || selectedExercises.find((s) => s.id === ex.id)) return
    setSelectedExercises((prev) => [...prev, ex])
    setPickerValue('')
  }

  function handleExerciseCreated(exercise: Exercise) {
    setExercises((prev) => [...prev, exercise])
  }

  function addSet(exerciseId: string) {
    const count = logs.filter((l) => l.exerciseId === exerciseId).length
    setLogs((prev) => [
      ...prev,
      { exerciseId, setNumber: count + 1, reps: '', weight: '', rpe: '', notes: '' },
    ])
  }

  function updateLog(exerciseId: string, setNumber: number, field: string, value: string) {
    setLogs((prev) =>
      prev.map((l) =>
        l.exerciseId === exerciseId && l.setNumber === setNumber ? { ...l, [field]: value } : l
      )
    )
  }

  function removeSet(exerciseId: string, setNumber: number) {
    setLogs((prev) =>
      prev
        .filter((l) => !(l.exerciseId === exerciseId && l.setNumber === setNumber))
        .map((l) => {
          if (l.exerciseId === exerciseId && l.setNumber > setNumber) {
            return { ...l, setNumber: l.setNumber - 1 }
          }
          return l
        })
    )
  }

  function removeExercise(exerciseId: string) {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== exerciseId))
    setLogs((prev) => prev.filter((l) => l.exerciseId !== exerciseId))
  }

  async function handleComplete() {
    if (logs.length === 0) {
      alert('Please log at least one set')
      return
    }
    const invalidLogs = logs.filter((l) => !l.reps || !l.weight)
    if (invalidLogs.length > 0) {
      alert('Please fill in reps and weight for all sets')
      return
    }

    setSaving(true)
    const duration = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60)

    try {
      const res = await fetch('/api/workout-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          notes: overallNotes,
          overallRating,
          exerciseLogs: logs.map((l) => ({
            exerciseId: l.exerciseId,
            setNumber: l.setNumber,
            reps: parseInt(l.reps),
            weight: parseFloat(l.weight),
            rpe: l.rpe ? parseFloat(l.rpe) : undefined,
            notes: l.notes || undefined,
          })),
        }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        alert('Failed to save workout')
      }
    } finally {
      setSaving(false)
    }
  }

  const elapsed = Math.round((now.getTime() - startTime.getTime()) / 1000 / 60)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Start a Workout</h1>
        <p className="text-sm text-gray-600 mt-1">
          Started {startTime.toLocaleTimeString()} &middot; {elapsed} min elapsed
        </p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add exercise</label>
          <ExercisePickerDropdown
            exercises={exercises}
            value={pickerValue}
            onChange={addExercise}
            onExerciseCreated={handleExerciseCreated}
          />
        </CardBody>
      </Card>

      {selectedExercises.map((ex) => {
        const exLogs = logs.filter((l) => l.exerciseId === ex.id)
        return (
          <Card key={ex.id} className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{ex.name}</h2>
                <button
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  className="text-gray-400 hover:text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              {exLogs.map((log) => (
                <div key={log.setNumber} className="flex gap-2 items-center flex-wrap">
                  <span className="text-sm font-medium w-14">Set {log.setNumber}</span>
                  <Input
                    type="number"
                    placeholder="Weight"
                    value={log.weight}
                    onChange={(e) => updateLog(ex.id, log.setNumber, 'weight', e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">kg ×</span>
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={log.reps}
                    onChange={(e) => updateLog(ex.id, log.setNumber, 'reps', e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">reps</span>
                  <Input
                    type="number"
                    placeholder="RPE"
                    step="0.5"
                    value={log.rpe}
                    onChange={(e) => updateLog(ex.id, log.setNumber, 'rpe', e.target.value)}
                    className="w-16"
                  />
                  <Input
                    type="text"
                    placeholder="Notes"
                    value={log.notes}
                    onChange={(e) => updateLog(ex.id, log.setNumber, 'notes', e.target.value)}
                    className="flex-1 min-w-[80px]"
                  />
                  <Button variant="danger" size="sm" onClick={() => removeSet(ex.id, log.setNumber)}>
                    ✕
                  </Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => addSet(ex.id)}>
                + Add Set
              </Button>
            </CardBody>
          </Card>
        )
      })}

      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-semibold">Workout Summary</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setOverallRating(r)}
                  className={`px-4 py-2 rounded-md font-medium transition ${
                    overallRating === r
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="How did the workout feel?"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
            />
          </div>
          <p className="text-sm text-gray-500">
            Total sets: {logs.length} &middot; Duration: {elapsed} min
          </p>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3 mb-8">
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
          Cancel
        </Button>
        <Button onClick={handleComplete} disabled={saving}>
          {saving ? 'Saving...' : 'Complete Workout'}
        </Button>
      </div>
    </div>
  )
}
