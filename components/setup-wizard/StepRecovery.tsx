interface StepRecoveryProps {
  totalWeeks: number
  buildWeeks: number
  recoveryWeeks: number
  onBuildChange: (weeks: number) => void
  onRecoveryChange: (weeks: number) => void
}

export function StepRecovery({
  totalWeeks,
  buildWeeks,
  recoveryWeeks,
  onBuildChange,
  onRecoveryChange,
}: StepRecoveryProps) {
  const cycleLength = buildWeeks + recoveryWeeks
  const fullCycles = Math.floor(totalWeeks / cycleLength)
  const remainder = totalWeeks - fullCycles * cycleLength

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Build &amp; Recovery</h2>
      <p className="text-gray-500 text-sm mb-6">
        Each phase alternates between build weeks and a recovery week. The app auto-calculates how many phases fit.
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Build weeks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Build Weeks</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onBuildChange(Math.max(2, buildWeeks - 1))}
              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-700"
            >
              −
            </button>
            <span className="text-xl font-bold text-gray-900 w-8 text-center">{buildWeeks}</span>
            <button
              type="button"
              onClick={() => onBuildChange(Math.min(6, buildWeeks + 1))}
              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-700"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">2–6 weeks</p>
        </div>

        {/* Recovery weeks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Weeks</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRecoveryChange(Math.max(1, recoveryWeeks - 1))}
              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-700"
            >
              −
            </button>
            <span className="text-xl font-bold text-gray-900 w-8 text-center">{recoveryWeeks}</span>
            <button
              type="button"
              onClick={() => onRecoveryChange(Math.min(2, recoveryWeeks + 1))}
              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-700"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">1–2 weeks</p>
        </div>
      </div>

      {/* Phase summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Phase Breakdown</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: fullCycles }).map((_, i) => (
            <div key={`full-${i}`} className="flex">
              <div className="bg-primary-200 text-primary-800 text-xs font-medium px-2 py-1 rounded-l">
                Build ({buildWeeks}w)
              </div>
              <div className="bg-amber-200 text-amber-800 text-xs font-medium px-2 py-1 rounded-r">
                Recovery ({recoveryWeeks}w)
              </div>
            </div>
          ))}
          {remainder > 0 && (
            <div className="bg-primary-200 text-primary-800 text-xs font-medium px-2 py-1 rounded">
              Build ({remainder}w)
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {fullCycles} full phase{fullCycles !== 1 ? 's' : ''} of {cycleLength} weeks
          {remainder > 0 ? `, + 1 short phase of ${remainder} week${remainder !== 1 ? 's' : ''} (no recovery)` : ''}
        </p>
      </div>
    </div>
  )
}
