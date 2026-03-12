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
    <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {invite ? `Join pbX and connect with ${invite.coachName}` : 'Start training with pbX'}
          </p>
        </div>

        {inviteToken && inviteError && (
          <div className="mb-4 p-4 bg-red-950 border border-red-800 rounded-lg text-sm text-red-300 text-center">
            {inviteError}
          </div>
        )}

        {invite && (
          <div className="mb-4 p-4 bg-gray-800 border border-primary-700 rounded-lg text-sm text-primary-300 text-center">
            <strong className="text-primary-200">{invite.coachName}</strong> has invited you to train together on pbX.
            Creating your account will automatically connect you as their client.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-950 border border-red-800 text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
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
              className={`w-full px-3 py-2.5 bg-gray-800 border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base ${
                invite ? 'border-gray-700 text-gray-400 cursor-not-allowed opacity-60' : 'border-gray-700'
              }`}
              placeholder="you@example.com"
            />
            {invite && (
              <p className="text-xs text-gray-500 mt-1">Email locked to match your invite.</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="••••••••"
            />
          </div>

          <p className="text-xs text-gray-500 text-center">
            By creating an account you agree to our{' '}
            <a href="/privacy" className="text-primary-400 hover:text-primary-300 underline">
              Privacy Policy
            </a>
            .
          </p>

          <button
            type="submit"
            disabled={loading || (!!inviteToken && !invite && !inviteError)}
            className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
          >
            {loading ? 'Creating account…' : invite ? 'Create Account & Connect' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a
              href={inviteToken ? `/login?callbackUrl=/invites/${inviteToken}` : '/login'}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign in
            </a>
          </p>
          <Link href="/" className="block text-sm text-gray-600 hover:text-gray-400 transition">
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
