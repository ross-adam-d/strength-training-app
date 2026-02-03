'use client'

import { useEffect, useState } from 'react'
import { PhaseSummaryBar } from './PhaseSummaryBar'
import { WeekRow } from './WeekRow'

interface ExerciseSlot {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetReps: string
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

  useEffect(() => {
    fetch('/api/exercises').then((r) => r.json()).then(setExercises)
  }, [])

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

      <div className="space-y-6 mt-6">
        {data.mesocycles.map((meso) => (
          <div key={meso.id}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {meso.name}{meso.focus ? ` — ${meso.focus}` : ''}
            </h3>
            {meso.microcycles.map((micro) => (
              <WeekRow
                key={micro.id}
                microcycle={micro}
                exercises={exercises}
                onSlotChange={onRefresh}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
