'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Invalid link</h1>
          <p className="text-gray-400 text-sm mb-6">
            This password reset link is missing a token. Please request a new one.
          </p>
          <Link href="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
            Request new reset link
          </Link>
        </div>
      </div>
    )
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      window.location.assign('/login?reset=true')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Choose a new password</h1>
          <p className="text-gray-400 text-sm">Must be at least 8 characters.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-950 border border-red-800 text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirm new password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
