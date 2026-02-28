import Link from 'next/link'
import { PBeXLogo, PBeXLogoStacked } from '@/components/PBeXLogo'

function CheckIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF8000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* Top nav */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 grid grid-cols-3 items-center">
          <PBeXLogo className="h-8 w-auto" />
          <div className="flex justify-center">
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
              style={{ backgroundColor: '#FF8000' }}
            >
              Get started free
            </Link>
          </div>
          <div className="flex justify-end">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4 bg-gray-950">
        <div className="container mx-auto max-w-3xl text-center">

          {/* Logo — large, centred */}
          <div className="flex justify-center mb-10">
            <PBeXLogoStacked className="w-52 h-auto" />
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight mb-5 leading-tight text-white">
            Training software for people{' '}
            <span style={{ color: '#FF8000' }}>who mean business.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Structured periodisation, precision logging, and performance analytics — built for lifters who know what they want and are going to go and get it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-sm"
              style={{ backgroundColor: '#FF8000' }}
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-800 text-gray-200 rounded-xl font-semibold text-lg hover:bg-gray-700 transition border border-gray-700 shadow-sm"
            >
              Log in
            </Link>
          </div>

          {/* Cycle labels */}
          <div className="mt-14 flex items-center justify-center gap-8 text-sm font-semibold tracking-widest" style={{ color: '#FF8000' }}>
            <span>PLAN</span>
            <span className="text-gray-600">→</span>
            <span>BUILD</span>
            <span className="text-gray-600">→</span>
            <span>EXECUTE</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need to train smarter
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Built around the periodisation principles that elite coaches use — now in your pocket.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                title: 'Structured Training Blocks',
                body: 'Organise your training into blocks, phases, and weeks. Plan your season like a professional coach.',
              },
              {
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
                title: 'Workout Logging',
                body: 'Log sets, reps, weight, and RPE in real time. Pre-populated targets mean less typing, more lifting.',
              },
              {
                icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
                title: 'Progress Tracking',
                body: 'Volume, intensity, and strength trends over time. See exactly how your training is paying off.',
              },
              {
                icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
                title: 'Exercise Library',
                body: '60+ exercises with muscle group and equipment tagging. Add your own custom movements.',
              },
              {
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                title: 'Progressive Overload',
                body: 'Track volume and intensity week over week. Know when you\'re progressing and when to push harder.',
              },
              {
                icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
                title: 'Mobile-First',
                body: 'Designed for the gym floor. Works offline, installable on iOS and Android — no app store needed.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" style={{ color: '#FF8000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-600 text-lg">Start with a free trial. No credit card needed to begin.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Trial */}
            <div className="rounded-2xl p-6 text-white shadow-lg md:col-span-1 flex flex-col" style={{ backgroundColor: '#FF8000' }}>
              <div className="mb-6">
                <div className="text-sm font-medium text-orange-100 mb-1">Right now</div>
                <div className="text-2xl font-bold mb-1">Free Trial</div>
                <div className="text-4xl font-extrabold mb-1">$0</div>
                <div className="text-orange-100 text-sm">14 days · no card required</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Full access to all features',
                  'Unlimited training blocks',
                  'Unlimited workout logs',
                  'No credit card required',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <svg className="w-4 h-4 text-orange-100 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center px-6 py-3 bg-white rounded-xl font-semibold hover:bg-orange-50 transition text-sm"
                style={{ color: '#FF8000' }}
              >
                Start free trial
              </Link>
            </div>

            {/* Paid tiers */}
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
              {/* Core */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">After trial</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Core</div>
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">
                    from $9<span className="text-lg font-normal text-gray-500">/mo</span>
                  </div>
                  <div className="text-gray-400 text-sm">AUD · or $7 USD</div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Training block planning',
                    'Workout logging',
                    'Progress tracking',
                    'Exercise library',
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="block text-center px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition"
                  style={{ backgroundColor: '#FF8000' }}
                >
                  Start free trial
                </Link>
              </div>

              {/* Elite */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-900 shadow-sm flex flex-col">
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">After trial</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Elite</div>
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">
                    from $16<span className="text-lg font-normal text-gray-500">/mo</span>
                  </div>
                  <div className="text-gray-400 text-sm">AUD · or $12 USD</div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Everything in Core',
                    'Unlimited training blocks',
                    'Deep analytics',
                    'Training readiness score',
                    'Own your data, export your training history at any time',
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="block text-center px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get serious?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            14-day free trial. No credit card. Cancel any time.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-sm"
            style={{ backgroundColor: '#FF8000' }}
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <PBeXLogo className="h-7 w-auto" color="#FF8000" />
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition">Log in</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} pbX. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
