'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'subscriptionBannerDismissed'

export function DismissibleBanner({ children }: { children: React.ReactNode }) {
  // Start visible — hide after mount if already dismissed this session
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 mt-1 p-1.5 rounded-md text-amber-600 hover:bg-amber-100 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
