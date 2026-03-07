'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Check your inbox</h1>
          <p className="text-gray-400 text-sm mb-6">
            If an account exists for <span className="text-white">{email}</span>, we&apos;ve sent
            a password reset link. It expires in 1 hour.
          </p>
          <Link href="/login" className="text-sm text-primary-400 hover:text-primary-300">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Forgot your password?</h1>
          <p className="text-gray-400 text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-950 border border-red-800 text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-400 transition">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
