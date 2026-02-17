import Link from 'next/link'

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary-600">ProBlock</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white pt-20 pb-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-6">
            Free beta — no credit card required
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-5 leading-tight">
            <span className="text-primary-900">Build smarter,</span>{' '}
            <span className="text-primary-600">train harder</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            ProBlock gives serious lifters a structured approach to programming — plan your training blocks, log every session, and see your progress compound over time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition shadow-sm"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition border border-gray-200 shadow-sm"
            >
              Log in
            </Link>
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
              Built around the periodization principles that elite coaches use — now accessible to every lifter.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Structured Training Blocks</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Organise your training into macrocycles, phases, and weeks. Plan your season like a professional coach.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Workout Logging</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Log sets, reps, weight, and RPE in real time. Pre-populated targets mean you spend less time typing, more time lifting.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Visualise volume, intensity, and strength trends. See exactly how your training is paying off.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Exercise Library</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                A comprehensive library of exercises with muscle group and equipment tagging. Add your own custom movements.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Progressive Overload</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Track volume and intensity week over week. Know when you&apos;re progressing and when to push harder.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile-Friendly</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Designed for the gym floor. Log workouts from your phone without friction, even with sweaty hands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-600 text-lg">Start with a free trial. No credit card needed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Trial */}
            <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg md:col-span-1 flex flex-col">
              <div className="mb-6">
                <div className="text-sm font-medium text-primary-200 mb-1">Right now</div>
                <div className="text-2xl font-bold mb-1">Free Trial</div>
                <div className="text-4xl font-extrabold mb-1">$0</div>
                <div className="text-primary-200 text-sm">4 weeks, no card required</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Full access to all features',
                  'Unlimited training blocks',
                  'Unlimited workout logs',
                  'No credit card required',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <svg className="w-4 h-4 text-primary-200 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition text-sm"
              >
                Start free trial
              </Link>
            </div>

            {/* Paid tiers */}
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
              {/* Basic */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">Coming soon</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Basic</div>
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">
                    —
                  </div>
                  <div className="text-gray-400 text-sm">Pricing coming soon</div>
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
                <div className="block text-center px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold text-sm cursor-default">
                  Coming soon
                </div>
              </div>

              {/* Advanced */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">Coming soon</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Advanced</div>
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">
                    —
                  </div>
                  <div className="text-gray-400 text-sm">Pricing coming soon</div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Everything in Basic',
                    'Advanced analytics',
                    'Data export',
                    'Priority support',
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="block text-center px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold text-sm cursor-default">
                  Coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary-600">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to train smarter?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join the beta — free for 4 weeks, no card required.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-white text-primary-700 rounded-xl font-semibold text-lg hover:bg-primary-50 transition shadow-sm"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-white">ProBlock</span>
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition">Log in</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} ProBlock. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
