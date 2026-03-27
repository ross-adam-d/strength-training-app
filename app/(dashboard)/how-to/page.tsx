import Link from 'next/link'
import Image from 'next/image'

// ── Reusable primitives ─────────────────────────────────────────────────────

function BackToTop() {
  return (
    <div className="flex justify-end pt-2">
      <a href="#top" className="text-xs text-gray-400 hover:text-primary-600 transition">
        ↑ Back to top
      </a>
    </div>
  )
}

function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="my-4">
      <Image src={src} alt={alt} width={1200} height={750} className="w-full h-auto rounded-xl border border-gray-200 shadow-sm" />
    </figure>
  )
}

/** Drop a PNG into public/how-to/<filename> to replace the placeholder */
function ScreenshotPlaceholder({ label, aspectRatio = '16/9' }: { label: string; aspectRatio?: string }) {
  return (
    <figure className="my-4">
      <div
        className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center p-8 gap-2"
        style={{ aspectRatio }}
      >
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
          <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 15l-5-5L5 21" />
        </svg>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </figure>
  )
}

function SectionDivider() {
  return <hr className="border-gray-100 my-2" />
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl px-5 py-4 text-sm text-gray-200 leading-relaxed">
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

// ── Hierarchy layer card ─────────────────────────────────────────────────────
// Orange header on every card, stacked title + example, gray-100 body

function HierarchyLayer({
  label,
  example,
  description,
}: {
  label: string
  example: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-primary-600">
        <p className="font-bold text-white text-sm">{label}</p>
        <p className="text-primary-100 text-xs mt-0.5 italic">{example}</p>
      </div>
      <div className="px-4 py-3 bg-gray-100">
        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function HowToPage() {
  const toc = [
    { id: 'architecture', label: 'App Architecture' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'getting-most', label: 'Getting the Most Out of pbX' },
    { id: 'manual-workouts', label: 'Manual Workouts & History' },
    { id: 'progress', label: 'Understanding Your Progress' },
  ]

  return (
    <div id="top" className="max-w-3xl mx-auto px-4 py-8 space-y-12">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">How to use pbX</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Everything you need to know — from setting up your first block to reading your progress charts.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-900 rounded-t-xl">
          <p className="text-sm font-bold text-white uppercase tracking-wider">On this page</p>
        </div>
        <ol className="divide-y divide-gray-100">
          {toc.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:text-primary-600 transition"
              >
                <span className="text-gray-400 text-xs w-4 shrink-0">{i + 1}.</span>
                {item.label}
                <svg className="w-3.5 h-3.5 ml-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── 1. App Architecture ────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div id="architecture" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 1</p>
          <h2 className="text-xl font-bold text-gray-900">App Architecture</h2>
          <p className="text-gray-500 text-sm mt-1">Understanding the structure is the key to using pbX properly.</p>
        </div>

        <InfoBox>
          pbX is built around <strong className="text-white font-semibold">periodisation</strong> — the training science used by elite coaches.
          Your training is organised into layers that build on each other. Every set you log contributes to a bigger picture.
        </InfoBox>

        <div className="space-y-2">
          <HierarchyLayer
            label="Training Block"
            example='e.g. "Hypertrophy 2026"'
            description="Your overarching training goal — typically 3–6 months. A block contains multiple phases and gives your training direction over time. Only one block is active at a time."
          />
          <div className="flex justify-center py-1">
            <svg className="w-4 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v20M3 15l5 5 5-5" />
            </svg>
          </div>
          <HierarchyLayer
            label="Phase (Mesocycle)"
            example='e.g. "Accumulation — 6 weeks"'
            description="A focused training period inside your block — typically 4–8 weeks. Each phase has a goal: accumulating volume, intensifying load, or recovering. Phases stack progressively."
          />
          <div className="flex justify-center py-1">
            <svg className="w-4 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v20M3 15l5 5 5-5" />
            </svg>
          </div>
          <HierarchyLayer
            label="Week (Microcycle)"
            example='e.g. "Week 3 of 6"'
            description="Each phase is broken into weeks. pbX tracks which week you're in and adjusts progressive overload suggestions accordingly. Recovery weeks are programmed at reduced volume automatically."
          />
          <div className="flex justify-center py-1">
            <svg className="w-4 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v20M3 15l5 5 5-5" />
            </svg>
          </div>
          <HierarchyLayer
            label="Workout"
            example='e.g. "Push A — Monday"'
            description="A single training session within the week. Workouts contain exercises with prescribed sets, reps, and RIR (Reps in Reserve). You log each workout as you complete it."
          />
          <div className="flex justify-center py-1">
            <svg className="w-4 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 16 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 0v20M3 15l5 5 5-5" />
            </svg>
          </div>
          <HierarchyLayer
            label="Exercise"
            example='e.g. "Barbell Squat — 4×8 @ 2 RIR"'
            description="Individual movements inside a workout. Each exercise tracks weight, reps, and RIR per set. pbX uses this data to suggest how much to increase weight or reps next session."
          />
        </div>

        <Screenshot src="/how-to/block overview.jpg" alt="Training Blocks overview" />

        <div className="bg-gray-100 border border-gray-200 rounded-xl px-5 py-4 text-sm leading-relaxed text-gray-700">
          <p className="font-semibold text-gray-900 mb-1">The big picture</p>
          <p>
            <span className="text-primary-600 font-medium">Block → Phase → Week → Workout → Exercise.</span>{' '}
            Each layer feeds into the one above it. When you log a set, pbX stores it in the context of which
            exercise, workout, week, phase, and block it belongs to — that&apos;s what makes progress tracking meaningful.
          </p>
        </div>

        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 2. Getting Started ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div id="getting-started" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 2</p>
          <h2 className="text-xl font-bold text-gray-900">Getting Started</h2>
          <p className="text-gray-500 text-sm mt-1">The fastest path from sign-up to first logged workout.</p>
        </div>

        <ol className="space-y-8">

          {/* Step 1 */}
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-gray-900">Create a Training Block</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Go to Training Blocks → New Training Block. Give it a name, set your start date, and choose your primary focus (Hypertrophy, Strength, Power, or Endurance). This is your overarching goal container.
              </p>
              <Link href="/macrocycles/setup" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
                Create your first block →
              </Link>
              <Screenshot src="/how-to/training block set up form.jpg" alt="New Training Block setup form" />
            </div>
          </li>

          {/* Step 2 */}
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-gray-900">Add a Phase</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Inside your block, add your first phase. Choose a focus (Accumulation, Intensification, or Deload),
                set the number of weeks, and pick your training split (e.g. Push/Pull/Legs, Upper/Lower, Full Body).
                pbX scaffolds your weekly workout structure automatically.
              </p>

              <p className="text-sm font-medium text-gray-800 mt-3">Populating your phase — four options:</p>
              <div className="space-y-2 mt-1">
                {[
                  {
                    label: 'Manual add',
                    desc: 'Build from scratch — open each generated workout and add exercises one by one. Full control over every movement, set, rep, and RIR target.',
                  },
                  {
                    label: 'Generate defaults',
                    desc: 'Let pbX suggest a starting set of exercises based on your split and phase focus. A good starting point you can then edit to suit your equipment and preferences.',
                  },
                  {
                    label: 'Repeat a prior phase',
                    desc: 'Copy the workout structure from a previous phase in this block. Useful when you want to run the same programme with progressed loads.',
                  },
                  {
                    label: 'Use a phase template (coach-assigned)',
                    desc: 'If you\'re working with a coach, they can build and apply phase templates directly to your block. Your workouts will be pre-populated — just log and go.',
                  },
                ].map(({ label, desc }) => (
                  <div key={label} className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <Screenshot src="/how-to/Phase setup.jpg" alt="Phase setup — split, weeks and populate options" />
            </div>
          </li>

          {/* Step 3 */}
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-gray-900">Build out your workouts</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Whether you generated defaults or started blank, each workout can be edited to match exactly how you want to train.
                Open any workout and add, remove, or reorder exercises using the exercise library or by creating a custom movement.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                For each exercise, dial in the specifics:
              </p>
              <ul className="space-y-1.5 mt-1">
                {[
                  ['Sets', 'How many working sets per exercise.'],
                  ['Reps', 'Target rep count — driven by your phase focus. Accumulation phases use higher reps (8–15+); Intensification phases use lower reps (3–6). pbX pre-fills sensible defaults based on your focus choice.'],
                  ['RIR target', 'Reps in Reserve — how many reps you should have left at the end of each set. RIR 2 means stopping 2 reps short of failure. This controls intensity without requiring you to go to absolute failure.'],
                  ['Rest period', 'Rest time between sets in seconds. Compound movements typically need longer rest (2–3 min); isolation exercises less.'],
                  ['Rep range', 'Set a minimum and maximum rep target (e.g. 8–12). When you hit the top of the range consistently, pbX will suggest a weight increase.'],
                ].map(([term, desc]) => (
                  <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                    <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
                  </li>
                ))}
              </ul>
              <Link href="/exercises" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
                Browse exercises →
              </Link>
              <Screenshot src="/how-to/workout editor with exercises.jpg" alt="Workout editor with exercises, sets, reps and RIR fields" />
            </div>
          </li>

          {/* Step 4 */}
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-gray-900">Start logging</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your dashboard shows this week&apos;s scheduled workouts. Tap a workout and hit Log — your phase activates automatically on your first logged session, no manual step required.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Log your sets as you train: enter weight, reps completed, and RIR. Rate your overall session effort (RPE) at the end — this feeds your Training Readiness score in the Progress tab.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                After your first session, pbX will start generating progressive overload suggestions for your next visit to each exercise.
              </p>
              <Link href="/dashboard" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
                Go to dashboard →
              </Link>
              <Screenshot src="/how-to/active workout-log.jpg" alt="Active workout log screen" />
            </div>
          </li>

        </ol>

        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 3. Getting the Most Out of It ───────────────────────────────────── */}
      <section className="space-y-5">
        <div id="getting-most" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 3</p>
          <h2 className="text-xl font-bold text-gray-900">Getting the Most Out of pbX</h2>
          <p className="text-gray-500 text-sm mt-1">The habits that separate great results from average ones.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              title: 'Log consistently',
              body: "Progressive overload only works when pbX has data. The suggestions in the logging screen are calculated from your previous session for that exercise. Skip logging and the system loses context — you're back to guessing.",
            },
            {
              title: 'Rate RPE honestly',
              body: 'RPE (Rate of Perceived Exertion) is your effort score for a session — 1 is effortless, 5 is maximal. It powers your Training Readiness score. If you always rate sessions as easy, the system misreads your fatigue. Be honest — a 4 is fine.',
            },
            {
              title: 'Trust the progressive overload suggestions',
              body: 'When you open a workout to log it, pbX shows suggested weights and reps based on your last performance. These are conservative — designed to keep you progressing without grinding into fatigue. Override them if needed, but if it feels right, use it.',
            },
            {
              title: 'Edit your workouts to suit you',
              body: 'The generated defaults are a starting point, not a prescription. Swap exercises you can\'t do for equipment reasons, adjust rep ranges to match how your body responds, or tighten the RIR target as you approach the end of a phase. The more tailored your programme, the better the progressive overload suggestions.',
            },
            {
              title: 'Review progress at the end of each phase',
              body: 'The Progress section becomes more useful the more data you have. At the end of a phase, check Volume & Intensity to see how your training load evolved, and Exercise Metrics to see which lifts moved. Use this to inform how you set up the next phase.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}

          <TipBox>
            If you have a coach, they can build your phases and workouts for you — you just show up and log. Check your{' '}
            <Link href="/my-coach" className="font-semibold text-amber-800 underline hover:text-amber-900">
              My Coach
            </Link>{' '}
            page to see if a plan is waiting for you.
          </TipBox>
        </div>

        <Screenshot src="/how-to/settings - PO.jpg" alt="Progressive overload settings" />

        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 4. Manual Workouts & History ────────────────────────────────────── */}
      <section className="space-y-5">
        <div id="manual-workouts" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 4</p>
          <h2 className="text-xl font-bold text-gray-900">Manual Workouts & History</h2>
          <p className="text-gray-500 text-sm mt-1">For when you want to turn up and train without a plan.</p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Sometimes you just want to get under the bar without following a programme — a spontaneous session, an off-plan
          lift with a gym buddy, or a week where your schedule doesn&apos;t match your block. That&apos;s what{' '}
          <Link href="/workout/start" className="font-medium text-primary-600 hover:text-primary-700 transition">
            Log Manual Workout
          </Link>{' '}
          is for. Still strength training — same exercises, sets, reps, and weight logging — just without the structure of a planned phase.
        </p>

        <p className="text-sm text-gray-600 leading-relaxed">
          Every manual workout is saved to your{' '}
          <Link href="/workout-history" className="font-medium text-primary-600 hover:text-primary-700 transition">
            History
          </Link>{' '}
          alongside your structured sessions, and the data flows into your progress charts and exercise metric history.
        </p>

        <Screenshot src="/how-to/workout history calendar.jpg" alt="Workout history calendar" />

        <div className="flex gap-3">
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

        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 5. Understanding Your Progress ─────────────────────────────────── */}
      <section className="space-y-6">
        <div id="progress" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 5</p>
          <h2 className="text-xl font-bold text-gray-900">Understanding Your Progress</h2>
          <p className="text-gray-500 text-sm mt-1">Three tabs, each showing a different lens on your training data.</p>
        </div>

        {/* Tab 1 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-primary-600">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">Tab 1</span>
            <h3 className="font-semibold text-white">Volume &amp; Intensity</h3>
          </div>
          <div className="px-5 py-4 bg-gray-100 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">The overall shape of your training load over time.</p>
            <ul className="space-y-2">
              {[
                ['Session volume', 'Total weight lifted per session (sets × reps × weight). A clear proxy for how much work you did each day.'],
                ['RPE trend', 'How hard your sessions felt over time. Rising RPE with flat volume signals accumulating fatigue — a sign to consider a deload.'],
                ['Block, phase & week comparison', 'Zoom in or out on your training volume. Compare week-on-week to see short-term trends, phase-on-phase to validate your mesocycles are building, or block-on-block for the long view on how your training has evolved.'],
              ].map(([term, desc]) => (
                <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                  <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
            <Screenshot src="/how-to/volume and intesity tab.jpg" alt="Volume and Intensity tab — session volume chart and block comparison" />
          </div>
        </div>

        {/* Tab 2 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-primary-600">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">Tab 2</span>
            <h3 className="font-semibold text-white">Exercise Metrics</h3>
          </div>
          <div className="px-5 py-4 bg-gray-100 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">Search any exercise you&apos;ve logged and see its full history.</p>
            <ul className="space-y-2">
              {[
                ['Weight over time', "One bar per session — the weight you moved. A clear visual of whether you're progressing on each lift."],
                ['Estimated 1RM', 'Calculated from your best set each session using an Epley-style formula. Tracks strength even when training in higher rep ranges.'],
                ['PR badges', '"New PR!" appears in your workout log when you set a new estimated 1RM for an exercise in that session.'],
                ['Performance summary', 'Max weight, best estimated 1RM, and total volume logged for the selected period.'],
              ].map(([term, desc]) => (
                <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                  <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
            <Screenshot src="/how-to/Exercise metrics - squat history chart.jpg" alt="Exercise Metrics — squat weight history and 1RM chart" />
            <TipBox>
              The 1RM estimate is most accurate when you log sets close to failure (low RIR). If you&apos;re always leaving 4+ reps in the tank, the estimate will undervalue your true strength.
            </TipBox>
          </div>
        </div>

        {/* Tab 3 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-primary-600">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">Tab 3</span>
            <h3 className="font-semibold text-white">Deep Analytics</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium border border-white/30">Elite</span>
          </div>
          <div className="px-5 py-4 bg-gray-100 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Goes beyond raw numbers to interpret your training state. Requires at least 10 logged workouts to activate.
            </p>
            <ul className="space-y-2">
              {[
                ['Training Readiness', 'A traffic-light score (green / amber / red) based on your recent RPE trend, weekly adherence, and whether your lifts are progressing. Green = keep pushing. Amber = monitor fatigue. Red = consider a deload.'],
                ['Weak Point Analysis', 'Compares your average weekly sets per muscle group against Minimum Effective Volume (MEV) thresholds. Red bars are below MEV — muscle groups your current plan is under-serving. Use this to inform exercise selection in your next phase.'],
                ['Adherence & RPE metrics', 'Workouts completed vs. planned this week, average RPE over the past two weeks vs. the prior two, and a lift trend indicator (improving / stable / declining).'],
              ].map(([term, desc]) => (
                <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                  <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
            <Screenshot src="/how-to/deep analytics.jpg" alt="Deep Analytics — readiness score and weak point chart" />
          </div>
        </div>

        <Link
          href="/progress"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
        >
          Open Progress →
        </Link>

        <SectionDivider />
        <BackToTop />
      </section>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-sm text-gray-400">
          Questions or feedback?{' '}
          <a href="mailto:support@pbxstrength.com.au" className="text-primary-600 hover:text-primary-700 transition">
            support@pbxstrength.com.au
          </a>
        </p>
      </div>

    </div>
  )
}
