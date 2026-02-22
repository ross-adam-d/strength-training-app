import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const startTime = Date.now()

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const dbStart = Date.now()
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            subscription: {
              select: {
                status: true,
                tier: true,
                trialEndsAt: true,
                manualAccessGrantedUntil: true,
              },
            },
          },
        })
        const dbTime = Date.now() - dbStart

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const bcryptStart = Date.now()
        const isPasswordValid = await compare(credentials.password, user.password)
        const bcryptTime = Date.now() - bcryptStart

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        const totalTime = Date.now() - startTime
        console.log(`[Auth Performance] Total: ${totalTime}ms | DB: ${dbTime}ms | bcrypt: ${bcryptTime}ms`)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionStatus: user.subscription?.status ?? null,
          tier: user.subscription?.tier ?? 'PREMIERE',
          trialEndsAt: user.subscription?.trialEndsAt?.toISOString() ?? null,
          manualAccessGrantedUntil: user.subscription?.manualAccessGrantedUntil?.toISOString() ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.subscriptionStatus = (user as any).subscriptionStatus
        token.tier = (user as any).tier
        token.trialEndsAt = (user as any).trialEndsAt
        token.manualAccessGrantedUntil = (user as any).manualAccessGrantedUntil
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
        ;(session.user as any).tier = token.tier ?? 'PREMIERE'
      }
      return session
    },
  },
}
