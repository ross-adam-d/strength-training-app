'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

interface CurrentMicrocycle {
  id: string
  name: string
  weekNumber: number
  mesocycle: {
    name: string
  }
}

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<CurrentMicrocycle | null>(null)

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/macrocycles', label: 'Training Blocks' },
    { href: '/workout-history', label: 'History' },
    { href: '/exercises', label: 'Exercises' },
    { href: '/progress', label: 'Progress' },
    { href: '/workout/start', label: 'Log Manual Workout' },
  ]

  useEffect(() => {
    if (session?.user) {
      fetch('/api/microcycles/current')
        .then((res) => {
          if (res.ok) return res.json()
          return null
        })
        .then((data) => setCurrentPhase(data))
        .catch(() => setCurrentPhase(null))
    }
  }, [session])

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary-600">
              Strength Tracker
            </Link>
            <div className="hidden md:flex space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === link.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-sm text-gray-600">{session?.user?.email}</span>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hidden md:inline px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                  pathname === link.href
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {currentPhase && (
              <>
                <div className="pt-2 mt-2 border-t" />
                <Link
                  href={`/microcycles/${currentPhase.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === `/microcycles/${currentPhase.id}`
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>Current Phase</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Week {currentPhase.weekNumber}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{currentPhase.mesocycle.name}</div>
                </Link>
              </>
            )}
            <div className="pt-3 mt-3 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">{session?.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
