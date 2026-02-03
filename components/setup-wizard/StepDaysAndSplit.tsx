import { getSplitsForDays } from '@/lib/splitTemplates'

interface StepDaysAndSplitProps {
  trainingDays: number
  splitKey: string
  onDaysChange: (days: number) => void
  onSplitChange: (key: string) => void
}

const DAY_OPTIONS = [2, 3, 4, 5, 6, 7]

export function StepDaysAndSplit({ trainingDays, splitKey, onDaysChange, onSplitChange }: StepDaysAndSplitProps) {
  const availableSplits = getSplitsForDays(trainingDays)

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Training Days &amp; Split</h2>
      <p className="text-gray-500 text-sm mb-6">
        Pick how many days per week you train, then choose a workout split.
      </p>

      {/* Days picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Days per Week</label>
        <div className="flex gap-2 flex-wrap">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDaysChange(d)}
              className={`w-10 h-10 rounded-lg font-semibold text-sm transition ${
                trainingDays === d
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Split cards */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Workout Split</label>
        <div className="grid sm:grid-cols-2 gap-3">
          {availableSplits.map((split) => (
            <button
              key={split.key}
              type="button"
              onClick={() => onSplitChange(split.key)}
              className={`p-4 rounded-lg border-2 text-left transition ${
                splitKey === split.key
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <p className="font-semibold text-gray-800">{split.label}</p>
              <p className="text-xs text-gray-500 mt-1">
                {split.workoutTypes.join(' → ')}{split.workoutTypes.length > 1 ? ' (rotating)' : ' (every day)'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
