import Link from 'next/link'

type Step = {
  number: number
  title: string
  description: string
  href: string
  cta: string
  primary?: boolean
  icon: React.ReactNode
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className={`bg-white rounded-xl border ${step.primary ? 'border-primary-200 ring-2 ring-primary-100' : 'border-gray-200'} p-6 flex flex-col`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${step.primary ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {step.number}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <Link
          href={step.href}
          className={`inline-flex items-center gap-1.5 text-sm font-medium transition ${
            step.primary
              ? 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700'
              : 'text-primary-600 hover:text-primary-700'
          }`}
        >
          {step.cta}
          {!step.primary && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </Link>
      </div>
    </div>
  )
}

export function WelcomeChecklist({ name }: { name: string | null | undefined }) {
  const firstName = name?.split(' ')[0] ?? 'there'

  const steps: Step[] = [
    {
      number: 1,
      title: 'Set up your training block',
      description: 'Build your training block, phases, and weekly workout structure. pbX handles the periodisation — you just fill in the details.',
      href: '/macrocycles/setup',
      cta: 'Create your first block',
      primary: true,
      icon: null,
    },
    {
      number: 2,
      title: 'Log your first workout',
      description: 'Once your block is set up, navigate to your active training week and tap any workout to log sets, reps, weight, and RPE in real time.',
      href: '/macrocycles',
      cta: 'Go to training blocks',
      icon: null,
    },
    {
      number: 3,
      title: 'Review your workout history',
      description: 'Every session you log is saved here. Browse past workouts, view sets and reps, and track your consistency over time.',
      href: '/workout-history',
      cta: 'View workout history',
      icon: null,
    },
    {
      number: 4,
      title: 'Track your performance',
      description: 'Visualise strength gains, training volume, and intensity trends across your phases. See exactly how your training is paying off.',
      href: '/progress',
      cta: 'Go to progress',
      icon: null,
    },
    {
      number: 5,
      title: 'Build your exercise library',
      description: 'Browse the built-in exercise library or create your own custom movements with muscle group and equipment tagging.',
      href: '/exercises',
      cta: 'Explore exercises',
      icon: null,
    },
    {
      number: 6,
      title: 'Learn how pbX works',
      description: 'New to periodised training? Read the How To guide — it explains the block/phase/week structure, how progressive overload suggestions work, and how to read your progress charts.',
      href: '/how-to',
      cta: 'Read the guide',
      icon: null,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-6 md:p-8 text-white">
        <p className="text-primary-200 text-sm font-medium mb-1">Welcome to pbX</p>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Hey {firstName}! Let&apos;s get you set up.
        </h1>
        <p className="text-primary-100 text-sm md:text-base leading-relaxed max-w-xl">
          pbX is built around structured periodisation — training blocks, phases, and weeks that build on each other. Here&apos;s what you need to know to get started.
        </p>
      </div>

      {/* Checklist */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Getting started
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </div>
  )
}
