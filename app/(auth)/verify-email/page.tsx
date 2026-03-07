'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyEmailContent() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const emailParam = searchParams.get('email')

  const [resending, setResending] = useState(false)
  const [resendError, setResendError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Handle success status: refresh JWT, then redirect
  useEffect(() => {
    if (status !== 'success') return

    update().then((updatedSession) => {
      if (updatedSession?.user?.emailVerified) {
        router.push('/dashboard')
      } else {
        // Different device or session expired — go to login with verified flag
        router.push('/login?verified=true')
      }
    })
  }, [status, update, router])

  // Cooldown timer after resend
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleResend() {
    setResending(true)
    setResendError('')
    setResendSuccess(false)

    const displayEmail = session?.user?.email ?? emailParam ?? undefined

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: displayEmail }),
      })
      if (res.ok) {
        setResendSuccess(true)
        setCooldown(60)
      } else {
        const data = await res.json()
        setResendError(data.error ?? 'Failed to send email. Please try again.')
      }
    } catch {
      setResendError('Failed to send email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-white mb-2">Email verified</h1>
          <p className="text-gray-400 text-sm">Redirecting you to your dashboard…</p>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Link expired or invalid</h1>
            <p className="text-gray-400 text-sm">
              This verification link has expired or has already been used. Request a new one below.
            </p>
          </div>

          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-950 border border-green-800 text-green-300 rounded-md text-sm">
              Verification email sent — check your inbox.
            </div>
          )}
          {resendError && (
            <div className="mb-4 p-3 bg-red-950 border border-red-800 text-red-300 rounded-md text-sm">
              {resendError}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {resending
              ? 'Sending…'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend verification email'}
          </button>
        </div>
      </div>
    )
  }

  // Default state: check your inbox
  return (
    <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
          <p className="text-gray-400 text-sm">
            We sent a verification link to{' '}
            <span className="text-white font-medium">{session?.user?.email ?? emailParam ?? 'your email'}</span>.
            Click the link to activate your account.
          </p>
        </div>

        {resendSuccess && (
          <div className="mb-4 p-3 bg-green-950 border border-green-800 text-green-300 rounded-md text-sm">
            Verification email resent — check your inbox.
          </div>
        )}
        {resendError && (
          <div className="mb-4 p-3 bg-red-950 border border-red-800 text-red-300 rounded-md text-sm">
            {resendError}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="w-full py-2.5 px-4 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {resending
            ? 'Sending…'
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : 'Resend verification email'}
        </button>

        <p className="text-center text-xs text-gray-600 mt-6">
          Wrong account?{' '}
          <a href="/login" className="text-primary-400 hover:text-primary-300">
            Sign in with a different account
          </a>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
