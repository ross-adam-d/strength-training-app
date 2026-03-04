'use client'

import { useEffect, useState } from 'react'

export function DomainChangeBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show on the old Vercel domain
    if (window.location.hostname === 'strength-training-app.vercel.app') {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div className="bg-orange-500 text-white text-sm text-center px-4 py-2">
      <strong>Heads up:</strong> We&apos;re moving to{' '}
      <strong>pbxstrength.com.au</strong> very soon. You&apos;ll be redirected
      automatically — no action needed.
    </div>
  )
}
