import Link from 'next/link'
import Image from 'next/image'

// ── Reusable primitives ─────────────────────────────────────────────────────

function BackToTop() {
  return (
    <div className="flex justify-end pt-2">
      <a
        href="#top"
        className="text-xs text-gray-400 hover:text-primary-600 transition"
      >
        ↑ Back to top
      </a>
    </div>
  )
}

/** Drop a PNG into public/how-to/<filename> to replace the placeholder */
function Screenshot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-4">
      <div className="relative rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-gray-50">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={675}
          className="w-full h-auto"
          // Show a placeholder box if the image hasn't been added yet
          onError={() => {}}
          style={{ display: 'block' }}
        />
      </div>
      {caption && (
        <figcaption className="text-xs text-gray-400 text-center mt-2 italic">{caption}</figcaption>
      )}
    </figure>
  )
}

/** Shown while real screenshots haven't been added yet */
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
        <p className="text-xs text-gray-300">Add PNG to <code className="font-mono">public/how-to/</code></p>
      </div>
    </figure>
  )
}

function SectionDivider() {
  return <hr className="border-gray-100 my-2" />
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary-50 border border-primary-100 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
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

function HierarchyLayer({
  label,
  example,
  description,
  isTop,
}: {
  label: string
  example: string
  description: string
  isTop?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isTop ? 'border-primary-200 ring-1 ring-primary-100' : 'border-gray-200'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isTop ? 'bg-primary-50 border-primary-100' : 'bg-gray-50 border-gray-100'}`}>
        <p className={`font-semibold text-sm ${isTop ? 'text-primary-700' : 'text-gray-800'}`}>{label}</p>
        <span className="text-xs text-gray-400 italic">{example}</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed px-4 py-3">{description}</p>
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
      <nav className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</p>
        <ol className="space-y-2">
          {toc.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-600 transition group"
              >
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-primary-100 group-hover:text-primary-700 transition">
                  {i + 1}
                </span>
                {item.label}
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
          pbX is built around <strong>periodisation</strong> — the training science used by elite coaches.
          Your training is organised into layers that build on each other. Every set you log contributes to a bigger picture.
        </InfoBox>

        {/* Hierarchy */}
        <div className="space-y-2">
          <HierarchyLayer
            label="Training Block"
            example='e.g. "Hypertrophy 2026"'
            description="Your overarching training goal — typically 3–6 months. A block contains multiple phases and gives your training direction over time. Only one block is active at a time."
            isTop
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
            description="Each phase is broken into weeks. pbX tracks which week you're in and adjusts progressive overload suggestions accordingly. Recovery weeks are programmed at reduced volume."
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

        <ScreenshotPlaceholder label="Screenshot: Training Blocks overview page" />

        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm leading-relaxed text-gray-700">
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
      <section className="space-y-5">
        <div id="getting-started" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 2</p>
          <h2 className="text-xl font-bold text-gray-900">Getting Started</h2>
          <p className="text-gray-500 text-sm mt-1">The fastest path from sign-up to first logged workout.</p>
        </div>

        <ol className="space-y-6">
          {[
            {
              step: '1',
              title: 'Create a Training Block',
              body: 'Go to Training Blocks → New Training Block. Give it a name and set your start date. This is your overarching goal container.',
              href: '/macrocycles/setup',
              cta: 'Create your first block',
              screenshot: 'Screenshot: New Training Block setup form',
            },
            {
              step: '2',
              title: 'Add a Phase',
              body: 'Inside your block, add your first phase. Choose a type (Accumulation, Intensification, or Deload), set the number of weeks, and pick your training split (e.g. Push/Pull/Legs). pbX will scaffold your weekly workout structure automatically.',
              href: '/macrocycles',
              cta: 'Go to Training Blocks',
              screenshot: 'Screenshot: Phase setup — split selection and week count',
            },
            {
              step: '3',
              title: 'Fill in your workouts',
              body: 'Each phase generates empty workout shells. Open each workout and add exercises with sets, reps, and target RIR. Use the built-in exercise library or create custom movements.',
              href: '/exercises',
              cta: 'Browse exercises',
              screenshot: 'Screenshot: Workout editor with exercises',
            },
            {
              step: '4',
              title: 'Activate and start logging',
              body: "Mark your phase as active. Your dashboard shows this week's workouts. Tap a workout, hit Log, and fill in your sets as you train. Rate RPE at the end of each session — it powers your readiness score.",
              href: '/dashboard',
              cta: 'Go to dashboard',
              screenshot: 'Screenshot: Active workout log screen',
            },
          ].map(({ step, title, body, href, cta, screenshot }) => (
            <li key={step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{body}</p>
                <Link href={href} className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
                  {cta} →
                </Link>
                <ScreenshotPlaceholder label={screenshot} aspectRatio="16/7" />
              </div>
            </li>
          ))}
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
              title: 'Review progress at the end of each phase',
              body: 'The Progress section becomes more useful the more data you have. At the end of a phase, check Volume & Intensity to see how your training load evolved, and Exercise Metrics to see which lifts moved. Use this to inform your next phase.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-1.5">
              <p className="font-semibold text-gray-900 text-sm">{title}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
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

        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 4. Manual Workouts & History ────────────────────────────────────── */}
      <section className="space-y-5">
        <div id="manual-workouts" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 4</p>
          <h2 className="text-xl font-bold text-gray-900">Manual Workouts & History</h2>
          <p className="text-gray-500 text-sm mt-1">For sessions that live outside your structured plan.</p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Not every session fits neatly into a training block. Use{' '}
          <Link href="/workout/start" className="font-medium text-primary-600 hover:text-primary-700 transition">
            Log Manual Workout
          </Link>{' '}
          for any session you want to record outside your plan — cardio, mobility, a casual gym hit, or training while travelling.
        </p>

        <p className="text-sm text-gray-600 leading-relaxed">
          Every manual workout is saved to your{' '}
          <Link href="/workout-history" className="font-medium text-primary-600 hover:text-primary-700 transition">
            History
          </Link>{' '}
          alongside your structured sessions. They count toward your overall volume and progress charts — nothing is lost.
        </p>

        <ScreenshotPlaceholder label="Screenshot: Workout history list" aspectRatio="16/7" />

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
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
            <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">Tab 1</span>
            <h3 className="font-semibold text-gray-900">Volume & Intensity</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">The overall shape of your training load over time.</p>
            <ul className="space-y-2">
              {[
                ['Session volume', 'Total weight lifted per session (sets × reps × weight). A good proxy for how much work you did.'],
                ['RPE trend', 'How hard your sessions felt over time. Rising RPE with flat volume signals accumulating fatigue.'],
                ['Block comparison', 'Week-by-week volume across phases in your current block — validates that your phases are actually progressing.'],
              ].map(([term, desc]) => (
                <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                  <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
            <ScreenshotPlaceholder label="Screenshot: Volume & Intensity tab — session volume chart" aspectRatio="16/7" />
          </div>
        </div>

        {/* Tab 2 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
            <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">Tab 2</span>
            <h3 className="font-semibold text-gray-900">Exercise Metrics</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">Search any exercise you&apos;ve logged and see its full history.</p>
            <ul className="space-y-2">
              {[
                ['Weight over time', "One bar per session — the weight you moved. A clear visual of whether you're progressing."],
                ['Estimated 1RM', 'Calculated from your best set each session. Tracks strength even when training in higher rep ranges.'],
                ['PR badges', '"New PR!" appears in your workout log when you set a new estimated 1RM for an exercise that session.'],
                ['Performance summary', 'Max weight, best estimated 1RM, and total volume for the selected period.'],
              ].map(([term, desc]) => (
                <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                  <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
            <ScreenshotPlaceholder label="Screenshot: Exercise Metrics — squat weight history chart" aspectRatio="16/7" />
            <TipBox>
              The 1RM estimate is most accurate when you log sets close to failure (low RIR). If you&apos;re always leaving 4+ reps in the tank, the estimate will undervalue your true strength.
            </TipBox>
          </div>
        </div>

        {/* Tab 3 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
            <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">Tab 3</span>
            <h3 className="font-semibold text-gray-900">Deep Analytics</h3>
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100">Premiere</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Goes beyond raw numbers to give you an interpretation of your training state. Requires at least 10 logged workouts.
            </p>
            <ul className="space-y-2">
              {[
                ['Training Readiness', 'A traffic-light score (green / amber / red) based on your RPE trend, weekly adherence, and whether your lifts are progressing. Green = keep pushing. Amber = monitor fatigue. Red = consider a deload.'],
                ['Weak Point Analysis', 'Compares your average weekly sets per muscle group against Minimum Effective Volume (MEV) thresholds. Red bars are below MEV — muscle groups your current plan is under-serving.'],
                ['Adherence & RPE metrics', 'Workouts completed vs. planned this week, average RPE over the past two weeks vs. the prior two weeks, and a lift trend indicator.'],
              ].map(([term, desc]) => (
                <li key={term as string} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                  <span><strong className="text-gray-800">{term}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
            <ScreenshotPlaceholder label="Screenshot: Deep Analytics — readiness score + weak point chart" aspectRatio="16/8" />
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
