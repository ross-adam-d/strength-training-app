'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'

type InviteData = {
  token: string
  email: string
  expiresAt: string
  coach: { id: string; name: string | null; email: string }
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const { data: session, status } = useSession()
  const router = useRouter()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json()
          setLoadError(d.error ?? 'This invite is invalid.')
        } else {
          setInvite(await r.json())
        }
      })
      .catch(() => setLoadError('Failed to load invite.'))
  }, [token])

  async function handleAction(action: 'accept' | 'decline') {
    if (status !== 'authenticated') {
      signIn(undefined, { callbackUrl: `/invites/${token}` })
      return
    }
    setActing(true)
    setActionError(null)
    const res = await fetch(`/api/invites/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setDone(action === 'accept' ? 'accepted' : 'declined')
    } else {
      const d = await res.json()
      setActionError(d.error ?? 'Something went wrong.')
    }
    setActing(false)
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-gray-700 font-medium mb-2">Invite unavailable</p>
          <p className="text-gray-500 text-sm">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const coachName = invite.coach.name ?? invite.coach.email

  if (done === 'accepted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;re connected!</h2>
          <p className="text-gray-500 text-sm mb-6">
            {coachName} is now your coach on pbX.
          </p>
          <button
            onClick={() => router.push('/my-coach')}
            className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            Go to My Coach
          </button>
        </div>
      </div>
    )
  }

  if (done === 'declined') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-gray-700 font-medium mb-2">Invite declined</p>
          <p className="text-gray-500 text-sm mb-6">You&apos;ve declined the coaching invitation.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🏋️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Coach invitation</h2>
          <p className="text-gray-600 text-sm">
            <strong>{coachName}</strong> has invited you to train together on pbX.
          </p>
        </div>

        {status === 'unauthenticated' && (
          <p className="text-sm text-center text-gray-500 mb-4">
            You&apos;ll need to log in (or register) to accept this invite.
          </p>
        )}

        {status === 'authenticated' && session.user?.email?.toLowerCase() !== invite.email.toLowerCase() && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-700">
              This invite was sent to <strong>{invite.email}</strong>, but you&apos;re logged in as{' '}
              <strong>{session.user?.email}</strong>. Please log in with the correct account.
            </p>
          </div>
        )}

        {actionError && (
          <p className="text-sm text-red-600 mb-4 text-center">{actionError}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleAction('decline')}
            disabled={acting}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Decline
          </button>
          <button
            onClick={() => handleAction('accept')}
            disabled={acting}
            className="flex-1 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {status === 'unauthenticated' ? 'Log in to accept' : acting ? 'Accepting…' : 'Accept'}
          </button>
        </div>

        {status === 'unauthenticated' && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Don&apos;t have an account?{' '}
            <a href={`/register?callbackUrl=/invites/${token}`} className="text-primary-600 hover:underline">
              Register here
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
