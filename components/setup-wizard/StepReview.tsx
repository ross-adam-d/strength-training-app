import { SetupPayload } from '@/lib/generatePlan'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface StepReviewProps {
  plan: SetupPayload
}

export function StepReview({ plan }: StepReviewProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Review Your Block</h2>
      <p className="text-gray-500 text-sm mb-4">
        Everything look right? Hit Create to generate your training block.
      </p>

      <div className="p-3 bg-primary-50 rounded-lg mb-4">
        <p className="text-sm font-semibold text-primary-800">{plan.name}</p>
        <p className="text-xs text-primary-600">{plan.startDate} → {plan.endDate}</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {plan.mesocycles.map((meso, mi) => (
          <div key={mi} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-3 py-2">
              <p className="text-sm font-semibold text-gray-800">
                {meso.name} <span className="font-normal text-gray-500">— {meso.focus}</span>
              </p>
            </div>
            <div className="divide-y">
              {meso.microcycles.map((micro, wi) => (
                <details key={wi} className="group">
                  <summary className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <span className={`text-sm font-medium ${micro.isRecovery ? 'text-amber-700' : 'text-gray-700'}`}>
                      {micro.name}
                    </span>
                    {micro.isRecovery && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Recovery</span>
                    )}
                  </summary>
                  <div className="px-3 pb-2 space-y-2">
                    {micro.workouts.map((w, wi2) => (
                      <div key={wi2} className="bg-gray-50 rounded p-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          {DAY_NAMES[w.dayOfWeek]} — {w.name}
                        </p>
                        <div className="space-y-0.5">
                          {w.exercises.map((ex, ei) => (
                            <p key={ei} className="text-xs text-gray-500">
                              <span className="text-gray-400">{ex.notes} · </span>
                              {ex.exerciseName} — {ex.targetSets}×{ex.targetReps}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
