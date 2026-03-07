import NextAuth from 'next-auth'

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'READ_ONLY' | 'CANCELLED'
export type SubscriptionTier = 'BASIC' | 'PREMIERE'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: string
      tier?: SubscriptionTier
      subscriptionStatus?: SubscriptionStatus | null
      trialEndsAt?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role?: string
    tier?: SubscriptionTier
    subscriptionStatus?: SubscriptionStatus | null
    trialEndsAt?: string | null
    manualAccessGrantedUntil?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
    subscriptionStatus?: SubscriptionStatus | null
    tier?: SubscriptionTier
    trialEndsAt?: string | null
    manualAccessGrantedUntil?: string | null
  }
}
