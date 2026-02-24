import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: string
      tier?: string
      subscriptionStatus?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
    subscriptionStatus?: string | null
    tier?: string
    trialEndsAt?: string | null
    manualAccessGrantedUntil?: string | null
  }
}
