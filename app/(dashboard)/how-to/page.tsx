import Link from 'next/link'

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="-mt-4 pt-4" />
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary-50 border-l-4 border-primary-400 rounded-r-lg px-4 py-3 text-sm text-primary-900 leading-relaxed">
      {children}
    </div>
  )
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 leading-relaxed">
      <span className="font-semibold">Tip: </span>
      {children}
    </div>
  )
}

function HierarchyRow({
  label,
  description,
  example,
  color,
}: {
  label: string
  description: string
  example: string
  color: string
}) {
  return (
    <div className={`flex gap-4 p-4 rounded-xl border ${color}`}>
      <div className="min-w-[120px] shrink-0">
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 italic">{example}</p>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
    </div>
  )
}

export default function HowToPage() {
  const toc = [
    { id: 'architecture', label: 'App Architecture' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'getting-most', label: 'Getting the Most Out of pbX' },
    { id: 'manual-workouts', label: 'Manual Workouts & History' },
    { id: 'progress', label: 'Understanding Your Progress' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">How to use pbX</h1>
        <p className="text-gray-500 text-base leading-relaxed">
          Everything you need to know to train smarter — from setting up your first block to reading your progress charts.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</p>
        <ol className="space-y-1.5">
          {toc.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-900 hover:underline"
              >
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── 1. App Architecture ── */}
      <section className="space-y-5">
        <SectionAnchor id="architecture" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">1. App Architecture</h2>
          <p className="text-gray-500 text-sm">Understanding the structure is the key to using pbX properly.</p>
        </div>

        <Callout>
          pbX is built around <strong>periodisation</strong> — the same training science used by elite coaches. Your
          training is organised into layers that build on each other. Every workout you log contributes to a bigger
          picture.
        </Callout>

        <div className="space-y-2">
          <HierarchyRow
            label="Training Block"
            example='e.g. "Hypertrophy 2026"'
            description="Your highest-level training goal — typically 3–6 months. A block contains multiple phases and gives your training direction over time. You can have more than one block (e.g. off-season vs. competition prep), but only one is active at a time."
            color="border-primary-200 bg-primary-50"
          />
          <div className="flex justify-center">
            <svg className="w-4 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v24M2 18l6 6 6-6" />
            </svg>
          </div>
          <HierarchyRow
            label="Phase"
            example='e.g. "Accumulation 1"'
            description="A focused training period inside your block — typically 4–8 weeks. Each phase has a specific goal: accumulating volume, intensifying load, or recovering. Phases stack progressively: volume goes up before intensity does."
            color="border-purple-200 bg-purple-50"
          />
          <div className="flex justify-center">
            <svg className="w-4 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v24M2 18l6 6 6-6" />
            </svg>
          </div>
          <HierarchyRow
            label="Week (Microcycle)"
            example='e.g. "Week 3 of 6"'
            description="Each phase is broken into weeks. pbX tracks which week of a phase you're in and adjusts progressive overload suggestions accordingly. Recovery weeks are automatically programmed at reduced volume."
            color="border-blue-200 bg-blue-50"
          />
          <div className="flex justify-center">
            <svg className="w-4 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v24M2 18l6 6 6-6" />
            </svg>
          </div>
          <HierarchyRow
            label="Workout"
            example='e.g. "Push A"'
            description="A single training session within a week. Workouts contain a list of exercises with prescribed sets, reps, and RIR (Reps in Reserve). You log each workout as you complete it."
            color="border-green-200 bg-green-50"
          />
          <div className="flex justify-center">
            <svg className="w-4 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v24M2 18l6 6 6-6" />
            </svg>
          </div>
          <HierarchyRow
            label="Exercise"
            example='e.g. "Barbell Squat, 4×8 @ 2 RIR"'
            description="The individual movements inside a workout. Each exercise tracks weight, reps, and RIR per set. Over time, pbX uses this data to suggest progressive overload — how much to increase weight or reps next session."
            color="border-gray-200 bg-gray-50"
          />
        </div>

        <div className="bg-gray-900 text-gray-100 rounded-xl px-5 py-4 text-sm leading-relaxed">
          <p className="font-semibold text-white mb-2">The big picture</p>
          <p className="text-gray-300">
            Training Block → Phase → Week → Workout → Exercise. Each layer feeds the one above it. When you log a
            set, pbX doesn&apos;t just record the weight — it stores it in the context of which exercise, workout,
            week, phase, and block it belongs to. That&apos;s what makes the progress charts and analytics meaningful.
          </p>
        </div>
      </section>

      {/* ── 2. Getting Started ── */}
      <section className="space-y-5">
        <SectionAnchor id="getting-started" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">2. Getting Started</h2>
          <p className="text-gray-500 text-sm">The fastest path from sign-up to first logged workout.</p>
        </div>

        <ol className="space-y-4">
          {[
            {
              step: '1',
              title: 'Create a Training Block',
              body: 'Go to Training Blocks → New Training Block. Give it a name and set your start date. This is your overarching goal container.',
              href: '/macrocycles/setup',
              cta: 'Create a block',
            },
            {
              step: '2',
              title: 'Add a Phase',
              body: 'Inside your block, add your first phase. Choose a type (Accumulation, Intensification, or Deload), set the number of weeks, and pick your training split (e.g. Push/Pull/Legs, Upper/Lower). pbX will scaffold your weekly workout structure automatically.',
              href: '/macrocycles',
              cta: 'Go to Training Blocks',
            },
            {
              step: '3',
              title: 'Fill in your workouts',
              body: 'Each phase generates empty workout shells. Open each workout and add exercises with sets, reps, and your target RIR. You can use the built-in exercise library or create custom movements.',
              href: '/exercises',
              cta: 'Browse exercises',
            },
            {
              step: '4',
              title: 'Activate your phase and start logging',
              body: 'Mark your phase as active. Your dashboard will show the current week\'s workouts. Tap a workout, hit Log, and fill in your sets as you train. Log RPE at the end — it powers the readiness score.',
              href: '/dashboard',
              cta: 'Go to dashboard',
            },
          ].map(({ step, title, body, href, cta }) => (
            <div key={step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{body}</p>
                <Link href={href} className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                  {cta} →
                </Link>
              </div>
            </div>
          ))}
        </ol>
      </section>

      {/* ── 3. Getting the Most Out of It ── */}
      <section className="space-y-5">
        <SectionAnchor id="getting-most" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">3. Getting the Most Out of pbX</h2>
          <p className="text-gray-500 text-sm">The behaviours that separate great results from average ones.</p>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-5 space-y-2">
            <p className="font-semibold text-gray-900">Log consistently</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Progressive overload only works when pbX has data. The suggestions you see in the logging screen are
              calculated from your previous session for that exercise. Skip logging and the system loses context —
              you&apos;re back to guessing.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 space-y-2">
            <p className="font-semibold text-gray-900">Rate RPE honestly</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              RPE (Rate of Perceived Exertion) is your subjective effort score for a session — 1 is effortless, 5 is
              maximal. It&apos;s used to calculate your Training Readiness score. If you always rate sessions as
              easy, the system will misread your fatigue. Be honest — a 4 is fine.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 space-y-2">
            <p className="font-semibold text-gray-900">Trust the progressive overload suggestions</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              When you open a workout to log it, pbX shows suggested weights and reps based on your last
              performance. These are conservative — designed to keep you progressing without grinding into fatigue.
              You can always override them, but if the suggestion feels right, use it.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 space-y-2">
            <p className="font-semibold text-gray-900">Check progress at the end of each phase</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              The Progress section becomes more useful the more data you have. At the end of a phase, check the
              Volume & Intensity tab to see how your training load evolved, and the Exercise Metrics tab to see
              which lifts moved. Use this to inform how you set up the next phase.
            </p>
          </div>

          <TipBox>
            If you have a coach, they can build your phases and workouts for you — you just show up and log. Check
            your{' '}
            <Link href="/my-coach" className="font-semibold text-amber-800 hover:underline">
              My Coach
            </Link>{' '}
            page to see if a plan is waiting for you.
          </TipBox>
        </div>
      </section>

      {/* ── 4. Manual Workouts & History ── */}
      <section className="space-y-5">
        <SectionAnchor id="manual-workouts" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">4. Manual Workouts & History</h2>
          <p className="text-gray-500 text-sm">For sessions outside your structured plan.</p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Not every session fits neatly into a training block — and that&apos;s fine. Use{' '}
          <Link href="/workout/start" className="font-medium text-primary-600 hover:underline">
            Log Manual Workout
          </Link>{' '}
          for any session you want to record outside your structured plan: cardio, mobility work, a casual gym
          session, or a workout when you&apos;re travelling.
        </p>

        <p className="text-sm text-gray-600 leading-relaxed">
          Every manual workout is saved to your{' '}
          <Link href="/workout-history" className="font-medium text-primary-600 hover:underline">
            History
          </Link>{' '}
          alongside your structured sessions. They also count toward your overall volume and progress charts —
          nothing is lost.
        </p>

        <div className="flex gap-4 flex-wrap">
          <Link
            href="/workout/start"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
          >
            Log a manual workout
          </Link>
          <Link
            href="/workout-history"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            View history
          </Link>
        </div>
      </section>

      {/* ── 5. Progress ── */}
      <section className="space-y-6">
        <SectionAnchor id="progress" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">5. Understanding Your Progress</h2>
          <p className="text-gray-500 text-sm">Three tabs, each showing a different lens on your training data.</p>
        </div>

        {/* Volume & Intensity */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">Tab 1</span>
            <h3 className="font-semibold text-gray-900">Volume & Intensity</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            This tab shows the overall shape of your training load over time. You&apos;ll see:
          </p>
          <ul className="space-y-2 ml-4">
            {[
              ['Session volume', 'Total weight lifted per session (sets × reps × weight). A good proxy for how much work you did.'],
              ['RPE trend', 'How hard your sessions felt over time. Rising RPE with flat volume = accumulating fatigue.'],
              ['Block comparison', 'Week-by-week volume comparison across phases in your current block — useful for validating that your phases are actually progressing.'],
            ].map(([term, desc]) => (
              <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                <span className="text-primary-500 mt-0.5 shrink-0">→</span>
                <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Exercise Metrics */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Tab 2</span>
            <h3 className="font-semibold text-gray-900">Exercise Metrics</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Search for any exercise you&apos;ve logged and see its full history. This tab shows:
          </p>
          <ul className="space-y-2 ml-4">
            {[
              ['Weight over time', 'One bar per session — the weight you moved. Clear visual of whether you\'re progressing.'],
              ['Estimated 1RM', 'Calculated from your best set each session using an Epley-style formula. Tracks strength even when you\'re training in higher rep ranges.'],
              ['PR badges', 'A "New PR!" badge appears in your workout log when you set a new estimated 1RM for an exercise in that session.'],
              ['Performance summary', 'Max weight, best estimated 1RM, and total volume logged for the selected period.'],
            ].map(([term, desc]) => (
              <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                <span className="text-primary-500 mt-0.5 shrink-0">→</span>
                <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
          <TipBox>
            The 1RM estimate is most accurate when you log sets close to failure (low RIR). If you&apos;re always
            leaving 4+ reps in the tank, the estimate will undervalue your true strength.
          </TipBox>
        </div>

        {/* Deep Analytics */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">Tab 3</span>
            <h3 className="font-semibold text-gray-900">Deep Analytics</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Premiere</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Available on the Premiere plan. This tab goes beyond raw numbers to give you an interpretation of your
            training state.
          </p>
          <ul className="space-y-3 ml-4">
            {[
              [
                'Training Readiness',
                'A traffic-light score (green / amber / red) based on your recent RPE trend, weekly adherence, and whether your lifts are progressing. Green = keep pushing. Amber = monitor fatigue. Red = consider a deload. Requires at least 10 logged workouts to activate.',
              ],
              [
                'Weak Point Analysis',
                'A horizontal bar chart comparing your average weekly sets per muscle group against Minimum Effective Volume (MEV) thresholds. Red bars are below MEV — these are the muscle groups your current plan is under-serving. Use this to adjust your next phase\'s exercise selection.',
              ],
              [
                'Adherence & RPE metrics',
                'Inside the readiness card: how many workouts you\'ve completed vs. planned this week, your average RPE over the past two weeks vs. the prior two weeks, and a lift trend indicator (improving / stable / declining).',
              ],
            ].map(([term, desc]) => (
              <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                <span className="text-primary-500 mt-0.5 shrink-0">→</span>
                <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <Link
            href="/progress"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
          >
            Open Progress →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-8 text-center">
        <p className="text-sm text-gray-400">
          Questions or feedback?{' '}
          <a href="mailto:support@pbxstrength.com.au" className="text-primary-600 hover:underline">
            support@pbxstrength.com.au
          </a>
        </p>
      </div>
    </div>
  )
}
