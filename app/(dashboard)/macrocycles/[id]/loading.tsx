export default function MacrocycleLoading() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-32"></div>
        <div className="h-9 bg-gray-200 rounded w-64"></div>
      </div>

      {/* Info Cards Skeleton */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="h-4 bg-gray-100 rounded w-24 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>

      {/* Phases Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-100 rounded w-64"></div>
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-20"></div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-16 bg-gray-50 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
