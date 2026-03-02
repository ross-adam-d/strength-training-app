'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { PBeXLogo } from '@/components/PBeXLogo'

export function Navigation({
  email,
  role,
  subscriptionStatus,
}: {
  email: string
  role?: string
  subscriptionStatus?: string | null
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  async function manageBilling() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.assign(data.url)
      }
    } finally {
      setBillingLoading(false)
    }
  }

  const showBillingButton = subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'PAST_DUE' || subscriptionStatus === 'TRIALING'

  const links = [
    { href: '/dashboard', label: 'Dashboard', hardNav: true },
    { href: '/macrocycles', label: 'Training Blocks' },
    { href: '/workout-history', label: 'History' },
    { href: '/exercises', label: 'Exercises' },
    { href: '/progress', label: 'Progress' },
    { href: '/workout/start', label: 'Log Manual Workout' },
    ...(role === 'USER' || !role ? [{ href: '/my-coach', label: 'My Coach' }] : []),
    ...(role === 'ADMIN' ? [{ href: '/admin', label: 'Admin', hardNav: true }] : []),
  ]

  function navLinkClass(href: string) {
    return `px-3 py-2 rounded-md text-sm font-medium transition ${
      pathname === href ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
    }`
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a href="/dashboard" className="flex items-center">
              <PBeXLogo className="h-8 w-auto" />
            </a>
            <div className="hidden md:flex space-x-4">
              {links.map((link) =>
                link.hardNav ? (
                  <a key={link.href} href={link.href} className={navLinkClass(link.href)}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                    {link.label}
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-sm text-gray-600">{email}</span>
            {showBillingButton && (
              <button
                onClick={manageBilling}
                disabled={billingLoading}
                className="hidden md:inline px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-md transition disabled:opacity-60"
              >
                {billingLoading ? 'Loading…' : 'Manage Billing'}
              </button>
            )}
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
            {links.map((link) =>
              link.hardNav ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block ${navLinkClass(link.href)}`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block ${navLinkClass(link.href)}`}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-3 mt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
              {showBillingButton && (
                <button
                  onClick={manageBilling}
                  disabled={billingLoading}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-md transition disabled:opacity-60"
                >
                  {billingLoading ? 'Loading…' : 'Manage Billing'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
