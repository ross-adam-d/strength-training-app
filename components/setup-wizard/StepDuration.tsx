interface StepDurationProps {
  totalWeeks: number
  onChange: (weeks: number) => void
}

export function StepDuration({ totalWeeks, onChange }: StepDurationProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Block Duration</h2>
      <p className="text-gray-500 text-sm mb-6">How many weeks will this training block last?</p>

      <div className="flex items-center gap-6">
        <input
          type="range"
          min={8}
          max={24}
          value={totalWeeks}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary-600"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(8, totalWeeks - 1))}
            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-700"
          >
            −
          </button>
          <span className="text-2xl font-bold text-primary-700 w-12 text-center">{totalWeeks}</span>
          <button
            type="button"
            onClick={() => onChange(Math.min(24, totalWeeks + 1))}
            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-700"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>8 weeks</span>
        <span>24 weeks</span>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          A <strong>{totalWeeks}-week</strong> block is{' '}
          {totalWeeks <= 10 ? 'a solid short program' : totalWeeks <= 16 ? 'a standard training block' : 'a long-term program'}.
          {' '}We&apos;ll break it into phases on the next step.
        </p>
      </div>
    </div>
  )
}
