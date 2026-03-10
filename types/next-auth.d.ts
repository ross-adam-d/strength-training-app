import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: string
      emailVerified?: boolean
      tier?: string
      subscriptionStatus?: string | null
      trialEndsAt?: string | null
      unitPreference?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role?: string
    emailVerified?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
    emailVerified?: boolean
    subscriptionStatus?: string | null
    tier?: string
    trialEndsAt?: string | null
    manualAccessGrantedUntil?: string | null
    unitPreference?: string
  }
}
