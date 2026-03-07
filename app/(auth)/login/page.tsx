'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified') === 'true'
  const passwordReset = searchParams.get('reset') === 'true'
  const wrongAccount = searchParams.get('reason') === 'wrong_account'
  const callbackUrl = searchParams.get('callbackUrl')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before signing in. Check your inbox for a verification link.')
      } else if (result?.error) {
        setError('Invalid email or password')
      } else {
        const destination = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard'
        window.location.assign(destination)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">pbX</h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {verified && (
            <div className="p-3 bg-green-950 border border-green-800 text-green-300 rounded-md text-sm">
              Email verified — please sign in.
            </div>
          )}
          {passwordReset && (
            <div className="p-3 bg-green-950 border border-green-800 text-green-300 rounded-md text-sm">
              Password updated — please sign in with your new password.
            </div>
          )}
          {wrongAccount && (
            <div className="p-3 bg-amber-950 border border-amber-800 text-amber-300 rounded-md text-sm">
              Please sign in with the account you used to subscribe.
            </div>
          )}
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
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-400 transition">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up
            </Link>
          </p>
          <Link href="/" className="block text-sm text-gray-600 hover:text-gray-400 transition">
            ← Back to home
          </Link>
          <Link href="/privacy" className="block text-sm text-gray-600 hover:text-gray-400 transition">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
