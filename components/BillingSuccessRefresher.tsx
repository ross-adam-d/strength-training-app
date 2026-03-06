'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * After a successful Stripe checkout, the JWT token still holds the old
 * subscription status. This component fires `update()` to re-mint the JWT
 * from the DB so the middleware stops blocking expired-trial users on their
 * next navigation.
 */
export function BillingSuccessRefresher() {
  const { update } = useSession()

  useEffect(() => {
    update()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
