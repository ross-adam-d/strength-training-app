import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

function canAccess(token: {
  role?: string
  subscriptionStatus?: string | null
  trialEndsAt?: string | null
  manualAccessGrantedUntil?: string | null
  hasActiveCoach?: boolean
}): { canWrite: boolean; isExpired: boolean } {
  if (token.role === 'ADMIN' || token.role === 'COACH') {
    return { canWrite: true, isExpired: false }
  }

  // Coached athletes get access to log workouts and coach-assigned content
  // even without their own subscription. Block creation is enforced at the API level.
  if (token.hasActiveCoach) {
    return { canWrite: true, isExpired: false }
  }

  const now = new Date()

  // Manual admin override
  if (token.manualAccessGrantedUntil) {
    const until = new Date(token.manualAccessGrantedUntil)
    if (until > now) {
      return { canWrite: true, isExpired: false }
    }
  }

  const status = token.subscriptionStatus

  if (status === 'ACTIVE') {
    return { canWrite: true, isExpired: false }
  }

  if (status === 'TRIALING' && token.trialEndsAt) {
    const trialEnd = new Date(token.trialEndsAt)
    if (trialEnd > now) {
      return { canWrite: true, isExpired: false }
    }
    // Trial ended
    return { canWrite: false, isExpired: true }
  }

  if (!status) {
    // No subscription data in JWT — stale token (logged in before subscription feature).
    // Fail open: let them through, the SubscriptionBanner will show accurate state via DB read.
    return { canWrite: true, isExpired: false }
  }

  // READ_ONLY, CANCELLED, PAST_DUE
  return { canWrite: false, isExpired: true }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/subscribe') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/invites') ||
    pathname.startsWith('/coach-subscribe') ||
    pathname.startsWith('/for-coaches')
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request })

  // Not authenticated — let the page/layout handle redirect
  if (!token) {
    return NextResponse.next()
  }

  // COACH users: redirect from /dashboard to /coach
  if (token.role === 'COACH' && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/coach', request.url))
  }

  // Email verification gate — skip for ADMIN and COACH
  if (
    token.emailVerified === false &&
    token.role !== 'ADMIN' &&
    token.role !== 'COACH'
  ) {
    const isProtectedApi =
      pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')
    const isDashboard = !pathname.startsWith('/api/') && !pathname.startsWith('/admin') && !pathname.startsWith('/coach')

    if (isProtectedApi && WRITE_METHODS.has(method)) {
      return NextResponse.json(
        { error: 'Please verify your email address.' },
        { status: 403 }
      )
    }
    if (isDashboard) {
      return NextResponse.redirect(new URL('/verify-email', request.url))
    }
  }

  // Only enforce on protected API routes (not /api/auth/*)
  const isProtectedApiRoute =
    pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')

  // Only enforce on dashboard page routes
  const isDashboardPage = !pathname.startsWith('/api/') && !pathname.startsWith('/admin') && !pathname.startsWith('/coach')

  if (!isProtectedApiRoute && !isDashboardPage) {
    return NextResponse.next()
  }

  const { canWrite, isExpired } = canAccess(token)

  // Fully expired user on a page → redirect to subscribe
  // Exception: returning from Stripe checkout — let through so syncCheckoutSession can run
  if (isExpired && isDashboardPage) {
    const isStripeReturn =
      request.nextUrl.searchParams.get('billing') === 'success' &&
      request.nextUrl.searchParams.has('session_id')
    if (!isStripeReturn && pathname !== '/subscribe') {
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  // Read-only user attempting a write API call → 403
  // Billing routes are always accessible so users can resubscribe/manage payment
  const isBillingRoute = pathname.startsWith('/api/billing/')
  if (!canWrite && isProtectedApiRoute && WRITE_METHODS.has(method) && !isBillingRoute) {
    return NextResponse.json(
      { error: 'Your trial has ended. Please contact us to continue.' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
