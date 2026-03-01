'use client'

import { useState } from 'react'

export default function CoachInvitePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/coach/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to send invite')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invite sent!</h2>
          <p className="text-gray-500 text-sm mb-6">
            An email has been sent to <strong>{email}</strong> with a link to accept your invitation.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/coach"
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Back to clients
            </a>
            <button
              onClick={() => { setSuccess(false); setEmail('') }}
              className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Invite another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <a href="/coach" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to clients
      </a>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Invite a client</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter their email address. They&apos;ll receive a link to accept the invitation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="client@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {loading ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      </div>
    </div>
  )
}
