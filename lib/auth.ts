import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { sendVerificationEmail } from './email'

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
            emailVerified: true,
            unitPreference: true,
            overloadTrigger: true,
            rpeAutoDeload: true,
            subscription: {
              select: {
                status: true,
                tier: true,
                trialEndsAt: true,
                manualAccessGrantedUntil: true,
              },
            },
            coachSubscription: {
              select: {
                plan: true,
                status: true,
                trialEndsAt: true,
              },
            },
            clientRelationships: {
              where: { status: 'ACTIVE' },
              select: { id: true },
              take: 1,
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

        // If email not verified, ensure a valid verification token exists, (re-)send email, and block login
        if (!user.emailVerified && user.role !== 'ADMIN' && user.role !== 'COACH') {
          const now = new Date()
          const existingToken = await prisma.emailVerificationToken.findFirst({
            where: {
              userId: user.id,
              usedAt: null,
              expiresAt: { gt: now },
            },
          })
          if (!existingToken) {
            const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            const newToken = await prisma.emailVerificationToken.create({
              data: { userId: user.id, expiresAt },
            })
            const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${newToken.token}`
            sendVerificationEmail({ toEmail: user.email, name: user.name, verifyUrl }).catch(() => {})
          }
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: !!user.emailVerified,
          unitPreference: user.unitPreference ?? 'metric',
          overloadTrigger: user.overloadTrigger ?? 'topOfRange',
          rpeAutoDeload: user.rpeAutoDeload ?? false,
          subscriptionStatus: user.subscription?.status ?? null,
          tier: user.subscription?.tier ?? 'PREMIERE',
          trialEndsAt: user.subscription?.trialEndsAt?.toISOString() ?? null,
          manualAccessGrantedUntil: user.subscription?.manualAccessGrantedUntil?.toISOString() ?? null,
          coachPlan: user.coachSubscription?.plan ?? null,
          coachSubscriptionStatus: user.coachSubscription?.status ?? null,
          coachTrialEndsAt: user.coachSubscription?.trialEndsAt?.toISOString() ?? null,
          hasActiveCoach: (user.clientRelationships?.length ?? 0) > 0,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.emailVerified = (user as any).emailVerified
        token.unitPreference = (user as any).unitPreference ?? 'metric'
        token.overloadTrigger = (user as any).overloadTrigger ?? 'topOfRange'
        token.rpeAutoDeload = (user as any).rpeAutoDeload ?? false
        token.subscriptionStatus = (user as any).subscriptionStatus
        token.tier = (user as any).tier
        token.trialEndsAt = (user as any).trialEndsAt
        token.manualAccessGrantedUntil = (user as any).manualAccessGrantedUntil
        token.coachPlan = (user as any).coachPlan
        token.coachSubscriptionStatus = (user as any).coachSubscriptionStatus
        token.coachTrialEndsAt = (user as any).coachTrialEndsAt
        token.hasActiveCoach = (user as any).hasActiveCoach ?? false
      }
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            emailVerified: true,
            unitPreference: true,
            overloadTrigger: true,
            rpeAutoDeload: true,
            subscription: {
              select: {
                status: true,
                tier: true,
                trialEndsAt: true,
                manualAccessGrantedUntil: true,
              },
            },
            coachSubscription: {
              select: {
                plan: true,
                status: true,
                trialEndsAt: true,
              },
            },
            clientRelationships: {
              where: { status: 'ACTIVE' },
              select: { id: true },
              take: 1,
            },
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.emailVerified = !!dbUser.emailVerified
          token.unitPreference = dbUser.unitPreference ?? 'metric'
          token.overloadTrigger = dbUser.overloadTrigger ?? 'topOfRange'
          token.rpeAutoDeload = dbUser.rpeAutoDeload ?? false
          if (dbUser.subscription) {
            token.subscriptionStatus = dbUser.subscription.status
            token.tier = dbUser.subscription.tier
            token.trialEndsAt = dbUser.subscription.trialEndsAt?.toISOString() ?? null
            token.manualAccessGrantedUntil = dbUser.subscription.manualAccessGrantedUntil?.toISOString() ?? null
          }
          token.coachPlan = dbUser.coachSubscription?.plan ?? null
          token.coachSubscriptionStatus = dbUser.coachSubscription?.status ?? null
          token.coachTrialEndsAt = dbUser.coachSubscription?.trialEndsAt?.toISOString() ?? null
          token.hasActiveCoach = (dbUser.clientRelationships?.length ?? 0) > 0
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
        session.user.emailVerified = token.emailVerified as boolean | undefined
        session.user.unitPreference = token.unitPreference ?? 'metric'
        session.user.overloadTrigger = token.overloadTrigger ?? 'topOfRange'
        session.user.rpeAutoDeload = (token.rpeAutoDeload as boolean) ?? false
        session.user.tier = token.tier ?? 'PREMIERE'
        session.user.subscriptionStatus = token.subscriptionStatus ?? null
        session.user.trialEndsAt = token.trialEndsAt ?? null
        session.user.coachPlan = token.coachPlan ?? null
        session.user.coachSubscriptionStatus = token.coachSubscriptionStatus ?? null
        session.user.coachTrialEndsAt = token.coachTrialEndsAt ?? null
        session.user.hasActiveCoach = (token.hasActiveCoach as boolean) ?? false
      }
      return session
    },
  },
}
