export default function WorkoutLogLoading() {
  return (
    <div className="animate-pulse min-h-screen">
      {/* Header Skeleton */}
      <div className="sticky top-0 bg-white border-b shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-100 rounded w-32"></div>
          </div>
          <div className="h-10 bg-primary-200 rounded w-40"></div>
        </div>
      </div>

      <div className="px-4 pb-20">
        {/* Exercise Skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-56 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-40"></div>
            </div>

            {/* Sets Grid Skeleton */}
            <div className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="grid grid-cols-[1.75rem_1fr_1fr_1fr] gap-2 items-center">
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  <div className="h-11 bg-gray-100 rounded"></div>
                  <div className="h-11 bg-gray-100 rounded"></div>
                  <div className="h-11 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>

            {/* Add Set Button Skeleton */}
            <div className="mt-3 h-9 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
