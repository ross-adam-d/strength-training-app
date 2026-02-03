interface Mesocycle {
  name: string
  microcycles: { name: string }[]
}

interface PhaseSummaryBarProps {
  mesocycles: Mesocycle[]
}

const PHASE_COLORS = [
  'bg-primary-200',
  'bg-emerald-200',
  'bg-violet-200',
  'bg-rose-200',
  'bg-sky-200',
]

export function PhaseSummaryBar({ mesocycles }: PhaseSummaryBarProps) {
  const totalWeeks = mesocycles.reduce((sum, m) => sum + m.microcycles.length, 0)

  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-4">
        {mesocycles.map((meso, i) => {
          const weeks = meso.microcycles.length
          const pct = (weeks / totalWeeks) * 100
          return (
            <div
              key={i}
              style={{ width: `${pct}%` }}
              className={PHASE_COLORS[i % PHASE_COLORS.length]}
              title={`${meso.name}: ${weeks} weeks`}
            />
          )
        })}
      </div>
      <div className="flex gap-4 mt-2 flex-wrap">
        {mesocycles.map((meso, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${PHASE_COLORS[i % PHASE_COLORS.length]}`} />
            <span className="text-xs text-gray-600">{meso.name} ({meso.microcycles.length}w)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
