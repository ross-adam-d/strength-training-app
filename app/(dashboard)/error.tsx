'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 max-w-lg w-full">
        <h1 className="text-xl font-bold text-red-600 mb-3">Something went wrong</h1>
        <p className="text-sm text-gray-600 mb-4">
          Please share the error details below with support.
        </p>
        <pre className="bg-gray-100 rounded p-4 text-xs text-gray-800 overflow-auto max-h-60 mb-4 whitespace-pre-wrap">
          {error.message || 'Unknown error'}
          {'\n\n'}
          {error.stack || ''}
          {error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
          >
            Reload dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
