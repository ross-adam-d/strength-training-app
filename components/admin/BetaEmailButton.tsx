'use client'

import { useState } from 'react'

export function BetaEmailButton() {
  const [state, setState] = useState<'idle' | 'previewing' | 'sending' | 'done'>('idle')
  const [preview, setPreview] = useState<{ count: number; users: string[] } | null>(null)
  const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePreview() {
    setState('previewing')
    setError(null)
    try {
      const res = await fetch('/api/admin/send-beta-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data)
      setState('idle')
    } catch (err: any) {
      setError(err.message)
      setState('idle')
    }
  }

  async function handleSend() {
    if (!confirm(`Send BETA30 email to ${preview?.count ?? '?'} users?`)) return
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/admin/send-beta-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setState('done')
    } catch (err: any) {
      setError(err.message)
      setState('idle')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900 mb-0.5">Beta thank-you email</h3>
          <p className="text-sm text-gray-500">
            Send BETA30 (30% off 12 months) to all verified non-paying users.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {state !== 'done' && (
            <button
              onClick={handlePreview}
              disabled={state === 'previewing' || state === 'sending'}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {state === 'previewing' ? 'Checking...' : 'Preview'}
            </button>
          )}
          {preview && state !== 'done' && (
            <button
              onClick={handleSend}
              disabled={state === 'sending'}
              className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
            >
              {state === 'sending' ? 'Sending...' : `Send to ${preview.count} users`}
            </button>
          )}
        </div>
      </div>

      {preview && state !== 'done' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 mb-1">Will send to ({preview.count}):</p>
          <p className="text-xs text-gray-600 font-mono leading-relaxed">{preview.users.join(', ')}</p>
        </div>
      )}

      {result && state === 'done' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800">
            Done — {result.sent} sent{result.failed > 0 ? `, ${result.failed} failed` : ''}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-1 text-xs text-red-600 space-y-0.5">
              {result.errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
