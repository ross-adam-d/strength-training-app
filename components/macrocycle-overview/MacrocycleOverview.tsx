'use client'

import { useEffect, useState } from 'react'
import { PhaseSummaryBar } from './PhaseSummaryBar'
import { PhaseEditor } from './PhaseEditor'

interface ExerciseSlot {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetReps: string | null
  tempo: string | null
  targetRir: number | null
  notes: string | null
  restPeriod: number | null
  exercise: { id: string; name: string }
}

interface Workout {
  id: string
  name: string
  dayOfWeek: number | null
  workoutExercises: ExerciseSlot[]
}

interface Microcycle {
  id: string
  name: string
  weekNumber: number
  workouts: Workout[]
}

interface Mesocycle {
  id: string
  name: string
  focus: string | null
  microcycles: Microcycle[]
}

export interface MacrocycleData {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  description: string | null
  goals: string | null
  mesocycles: Mesocycle[]
}

interface Exercise {
  id: string
  name: string
}

export default function MacrocycleOverview({ data, onRefresh }: { data: MacrocycleData; onRefresh: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch('/api/exercises').then((r) => r.json()).then(setExercises)
  }, [])

  function handleRefresh() {
    onRefresh()
    setRefreshKey((k) => k + 1)
  }

  if (!data.mesocycles.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <p className="text-gray-600">No phases in this block yet.</p>
      </div>
    )
  }

  return (
    <div>
      <PhaseSummaryBar mesocycles={data.mesocycles} />

      <div className="space-y-4 mt-6">
        {data.mesocycles.map((meso) => (
          <PhaseEditor
            key={`${meso.id}-${refreshKey}`}
            mesocycle={meso}
            exercises={exercises}
            onRefresh={handleRefresh}
          />
        ))}
      </div>
    </div>
  )
}
