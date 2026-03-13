import Link from 'next/link'
import { PBeXLogo } from '@/components/PBeXLogo'

function Check() {
  return (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF8000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function ForCoachesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><PBeXLogo className="h-8 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Log in</Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
              style={{ backgroundColor: '#FF8000' }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4 bg-gray-950">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-block mb-6 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest border border-orange-500/30 bg-orange-500/10" style={{ color: '#FF8000' }}>
            FOR COACHES &amp; PERSONAL TRAINERS
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-5 leading-tight text-white">
            Run your coaching business{' '}
            <span style={{ color: '#FF8000' }}>from one platform.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Build training blocks, assign them to clients, and manage everything — programming, messaging, and progress tracking — in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-sm"
              style={{ backgroundColor: '#FF8000' }}
            >
              Get started free
            </Link>
            <Link
              href="mailto:adam@pbxstrength.com.au"
              className="px-8 py-4 bg-gray-800 text-gray-200 rounded-xl font-semibold text-lg hover:bg-gray-700 transition border border-gray-700 shadow-sm"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to coach at scale</h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Built for coaches who take their clients&apos; results seriously.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                title: 'Build once, assign to many',
                body: 'Create a training block and assign it directly to a client. Customise it per athlete without starting from scratch.',
              },
              {
                icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                title: 'In-app messaging',
                body: 'Chat directly with each client inside the app. No WhatsApp threads, no lost check-ins.',
              },
              {
                icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
                title: 'Progress tracking',
                body: "See each client's strength trends, volume data, and session compliance — all from your coach dashboard.",
              },
              {
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                title: 'Progressive overload built in',
                body: 'The app automatically suggests load increases and flags when clients are ready to progress — you stay in control.',
              },
              {
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                title: 'Client gets full Elite access',
                body: 'Every client you coach gets the full Elite feature set — progress charts, deep analytics, export — at no extra cost to them.',
              },
              {
                icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
                title: 'Mobile-first for your clients',
                body: 'Your clients log workouts from the gym floor. Installable on iOS and Android — no app store needed.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" style={{ color: '#FF8000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works for coaches */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How coaching works in pbX</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign up and get your coach profile', body: 'Register, complete your coach profile, and get your unique invite link to share with clients.' },
              { step: '02', title: 'Invite clients and build their programme', body: 'Send an invite, build their macrocycle, and assign it directly. They see it the moment they log in.' },
              { step: '03', title: 'Monitor and adjust', body: 'Watch their progress, message them in-app, and adjust loads or phases as they progress through the block.' },
            ].map(({ step, title, body }) => (
              <div key={step}>
                <div className="text-5xl font-extrabold text-gray-800 mb-4">{step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Coach pricing</h2>
            <p className="text-gray-600">One flat rate. No per-seat fees for your clients.</p>
          </div>
          <div className="bg-white border-2 border-gray-900 rounded-2xl p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">Coach Plan</div>
                <div className="text-4xl font-extrabold text-gray-900">
                  from $29<span className="text-xl font-normal text-gray-500">/mo</span>
                </div>
                <div className="text-gray-400 text-sm mt-1">AUD · contact us for USD pricing</div>
              </div>
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                Includes up to 5 clients
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Manage up to 5 clients (expandable)',
                'Build and assign training blocks',
                'In-app messaging with each client',
                'Full progress and compliance tracking',
                'Clients get full Elite access at no extra cost',
                'Coach profile page for your clients',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="flex-1 block text-center px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition"
                style={{ backgroundColor: '#FF8000' }}
              >
                Start free trial
              </Link>
              <Link
                href="mailto:adam@pbxstrength.com.au"
                className="flex-1 block text-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
              >
                Contact us
              </Link>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">14-day free trial · no credit card required · cancel any time</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to level up your coaching?</h2>
          <p className="text-gray-400 text-lg mb-8">Register and reach out — we will get your coach account set up.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block px-10 py-4 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-sm"
              style={{ backgroundColor: '#FF8000' }}
            >
              Get started free
            </Link>
            <Link
              href="mailto:adam@pbxstrength.com.au"
              className="inline-block px-10 py-4 bg-gray-800 text-gray-200 rounded-xl font-semibold text-lg hover:bg-gray-700 transition border border-gray-700"
            >
              Email us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <PBeXLogo className="h-7 w-auto" color="#FF8000" />
          <div className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/login" className="hover:text-white transition">Log in</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} pbX. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
