export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-9 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-5 bg-gray-100 rounded w-96"></div>
      </div>

      {/* Next Workout Card Skeleton */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-20"></div>
            <div className="h-7 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="h-4 bg-gray-100 rounded w-40"></div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Phase Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-7 bg-gray-200 rounded w-36 mb-4"></div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-100 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-24"></div>
              </div>
              <div className="h-4 bg-gray-100 rounded w-64"></div>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3"></div>
              <div className="h-3 bg-gray-100 rounded w-20 ml-auto"></div>
            </div>
          </div>
        </div>

        {/* Recent Workouts Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-7 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-md">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-24 mb-1"></div>
                <div className="h-4 bg-gray-100 rounded w-40"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
