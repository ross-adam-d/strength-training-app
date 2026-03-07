'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

type InviteInfo = {
  coachName: string
  email: string
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!inviteToken) return
    fetch(`/api/invites/${inviteToken}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json()
          setInviteError(d.error ?? 'This invite link is invalid or has expired.')
        } else {
          const d = await r.json()
          setInvite({
            coachName: d.coach.name ?? d.coach.email,
            email: d.email,
          })
        }
      })
      .catch(() => setInviteError('Failed to load invite details.'))
  }, [inviteToken])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    // Use invite email from state — don't trust the locked DOM input which may not update after async load
    const email = invite?.email ?? (formData.get('email') as string)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, ...(inviteToken ? { inviteToken } : {}) }),
      })

      const data = await response.json()

      if (!response.ok) {
        const detail = data.details?.[0]?.message
        setError(detail || data.error || 'Registration failed')
        setLoading(false)
        return
      }

      if (!data.inviteAccepted) {
        // Regular registration — email verification required before sign-in
        window.location.assign('/verify-email?email=' + encodeURIComponent(email))
        return
      }

      // Invite registration — email auto-verified, sign in immediately
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        window.location.assign('/my-coach')
      } else {
        window.location.assign(`/login?registered=true&invite=${inviteToken}`)
      }
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            {invite ? `Join pbX and connect with ${invite.coachName}` : 'Start training with pbX'}
          </p>
        </div>

        {inviteToken && inviteError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
            {inviteError}
          </div>
        )}

        {invite && (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800 text-center">
            <strong>{invite.coachName}</strong> has invited you to train together on pbX.
            Creating your account will automatically connect you as their client.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                key={invite?.email ?? 'email'}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                readOnly={!!invite}
                defaultValue={invite?.email ?? ''}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-base ${
                  invite ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
              />
              {invite && (
                <p className="text-xs text-gray-400 mt-1">Email locked to match your invite.</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!!inviteToken && !invite && !inviteError)}
              className="w-full py-2 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating account…' : invite ? 'Create Account & Connect' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a
                href={inviteToken ? `/login?callbackUrl=/invites/${inviteToken}` : '/login'}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
