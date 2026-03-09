import { useState } from 'react'
import { ExercisePickerModal } from '@/components/ExercisePickerModal'

export interface SlotData {
  exerciseId: string
  exerciseName: string
  orderIndex: number
  targetSets: number
  targetReps: string
  tempo: string
  restPeriod: number | null
  targetRir: number | null
  notes: string
}

interface EditableSlotRowProps {
  slot: SlotData
  onChange: (updated: SlotData) => void
  onDelete: () => void
  onReorder: (direction: 'up' | 'down') => void
  readOnly?: boolean
}

export function EditableSlotRow({
  slot,
  onChange,
  onDelete,
  onReorder,
  readOnly = false,
}: EditableSlotRowProps) {
  const [tempoError, setTempoError] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  function update(field: keyof SlotData, value: unknown) {
    onChange({ ...slot, [field]: value })
  }

  return (
    <div className="bg-gray-50 rounded p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0">
          {readOnly ? (
            <p className="text-xs font-medium text-gray-700">{slot.exerciseName}</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full text-left text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 hover:border-primary-400 truncate"
              >
                {slot.exerciseName || 'Pick exercise...'}
              </button>
              <ExercisePickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onAdd={(result) => {
                  onChange({ ...slot, exerciseId: result.exercise.id, exerciseName: result.exercise.name })
                  setPickerOpen(false)
                }}
                mode="log"
                existingExerciseIds={slot.exerciseId ? [] : []}
              />
            </>
          )}
        </div>
        {!readOnly && (
          <>
            <button type="button" onClick={() => onReorder('up')} className="text-gray-400 hover:text-gray-600 text-xs px-1">↑</button>
            <button type="button" onClick={() => onReorder('down')} className="text-gray-400 hover:text-gray-600 text-xs px-1">↓</button>
            <button type="button" onClick={onDelete} className="text-gray-400 hover:text-red-600 text-xs px-1">✕</button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Sets</label>
          <input
            type="number"
            min={1}
            value={slot.targetSets}
            onChange={(e) => update('targetSets', parseInt(e.target.value) || 1)}
            disabled={readOnly}
            className="w-12 text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Reps</label>
          <input
            type="text"
            placeholder="8-10"
            value={slot.targetReps}
            onChange={(e) => update('targetReps', e.target.value)}
            disabled={readOnly}
            className="w-16 text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Tempo</label>
          <input
            type="text"
            placeholder="3010"
            maxLength={4}
            value={slot.tempo}
            onChange={(e) => {
              update('tempo', e.target.value)
              setTempoError(false)
            }}
            onBlur={(e) => {
              if (e.target.value && !/^\d{4}$/.test(e.target.value)) setTempoError(true)
            }}
            onFocus={() => setTempoError(false)}
            disabled={readOnly}
            className={`w-16 text-xs border rounded px-1.5 py-0.5 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
              tempoError ? 'border-red-400' : 'border-gray-300 focus:border-primary-400'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Rest (s)</label>
          <input
            type="number"
            min={0}
            placeholder="90"
            value={slot.restPeriod ?? ''}
            onChange={(e) =>
              update('restPeriod', e.target.value === '' ? null : parseInt(e.target.value))
            }
            disabled={readOnly}
            className="w-16 text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-0.5">RIR</label>
          <input
            type="number"
            min={0}
            max={5}
            placeholder="2"
            value={slot.targetRir ?? ''}
            onChange={(e) =>
              update('targetRir', e.target.value === '' ? null : parseInt(e.target.value))
            }
            disabled={readOnly}
            className="w-12 text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {tempoError && <p className="text-xs text-red-500">Tempo must be exactly 4 digits</p>}
    </div>
  )
}
