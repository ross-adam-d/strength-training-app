'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CoachInvitePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(true)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
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
      const data = await res.json()
      setEmailSent(data.emailSent ?? true)
      setInviteUrl(data.inviteUrl ?? null)
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to send invite')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invite created!</h2>
          {emailSent ? (
            <p className="text-gray-500 text-sm mb-6">
              An email has been sent to <strong>{email}</strong> with a link to accept your invitation.
            </p>
          ) : (
            <div className="mb-6 text-left">
              <p className="text-gray-500 text-sm mb-3">
                Email delivery isn&apos;t configured yet. Share this link directly with <strong>{email}</strong>:
              </p>
              {inviteUrl && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 break-all select-all font-mono">
                  {inviteUrl}
                </div>
              )}
            </div>
          )}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => { setSuccess(false); setEmail('') }}
              className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Invite another
            </button>
            <Link
              href="/coach"
              className="block w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center"
            >
              Back to clients
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/coach" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Clients
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Invite a Client</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter their email address. They&apos;ll receive a link to accept the invitation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

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

