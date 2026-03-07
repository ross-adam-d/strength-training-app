'use client'

import { useState } from 'react'

type PendingInvite = {
  id: string
  email: string
  expiresAt: string
}

function InviteCard({ invite, onRevoked }: { invite: PendingInvite; onRevoked: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<'resend' | 'revoke' | null>(null)
  const [resent, setResent] = useState(false)

  async function handleResend() {
    setLoading('resend')
    await fetch(`/api/coach/invites/${invite.id}`, { method: 'PATCH' })
    setResent(true)
    setLoading(null)
  }

  async function handleRevoke() {
    setLoading('revoke')
    await fetch(`/api/coach/invites/${invite.id}`, { method: 'DELETE' })
    onRevoked(invite.id)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition"
      >
        <div className="min-w-0 opacity-60">
          <p className="font-semibold text-gray-900 truncate">{invite.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Expires {new Date(invite.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            Invite pending
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 pt-3 border-t border-gray-100 flex gap-2">
          {resent ? (
            <p className="text-sm text-green-600 font-medium py-1.5">Invite resent!</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={!!loading}
              className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {loading === 'resend' ? 'Sending…' : 'Resend'}
            </button>
          )}
          <button
            onClick={handleRevoke}
            disabled={!!loading}
            className="flex-1 py-2 text-sm font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
          >
            {loading === 'revoke' ? 'Revoking…' : 'Revoke'}
          </button>
        </div>
      )}
    </div>
  )
}

export function PendingInvitesList({ invites }: { invites: PendingInvite[] }) {
  const [list, setList] = useState(invites)
  if (list.length === 0) return null
  return (
    <>
      {list.map((inv) => (
        <InviteCard
          key={inv.id}
          invite={inv}
          onRevoked={(id) => setList((l) => l.filter((i) => i.id !== id))}
        />
      ))}
    </>
  )
}
