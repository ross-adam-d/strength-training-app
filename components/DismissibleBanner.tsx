'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'subscriptionBannerDismissed'

export function DismissibleBanner({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="relative">
      {children}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-amber-600 hover:bg-amber-100 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
