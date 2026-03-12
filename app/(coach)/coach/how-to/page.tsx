import Link from 'next/link'

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

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 leading-relaxed">
      <span className="font-semibold">Tip: </span>
      {children}
    </div>
  )
}

function StepCard({ step, title, body, href, cta }: {
  step: string
  title: string
  body: React.ReactNode
  href?: string
  cta?: string
}) {
  return (
    <li className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {step}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-semibold text-gray-900">{title}</p>
        <div className="text-sm text-gray-600 leading-relaxed space-y-2">{body}</div>
        {href && cta && (
          <Link href={href} className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
            {cta} →
          </Link>
        )}
      </div>
    </li>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function CoachHowToPage() {
  const toc = [
    { id: 'overview', label: 'Coach Overview' },
    { id: 'clients', label: 'Inviting & Managing Clients' },
    { id: 'blocks', label: 'Building Client Training Blocks' },
    { id: 'templates', label: 'Phase Templates' },
    { id: 'monitoring', label: 'Monitoring Client Progress' },
    { id: 'profile', label: 'Your Coach Profile' },
  ]

  return (
    <div id="top" className="max-w-3xl mx-auto px-4 py-8 space-y-12">

      {/* Back link */}
      <Link href="/coach" className="text-primary-600 hover:text-primary-700 text-sm">
        ← Back to Coach Dashboard
      </Link>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Coach Guide</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Everything you need to know to onboard clients, build programmes, and monitor progress inside pbX.
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
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition group"
              >
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition">
                  {i + 1}
                </span>
                <span className="underline underline-offset-2 decoration-primary-300 group-hover:decoration-primary-600">
                  {item.label}
                </span>
                <svg className="w-4 h-4 ml-auto text-primary-400 group-hover:text-primary-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── 1. Coach Overview ──────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div id="overview" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 1</p>
          <h2 className="text-xl font-bold text-gray-900">Coach Overview</h2>
          <p className="text-gray-500 text-sm mt-1">How the coach role works in pbX.</p>
        </div>

        <div className="bg-gray-900 rounded-xl px-5 py-4 text-sm text-gray-200 leading-relaxed">
          As a coach in pbX, you manage clients through the <strong className="text-white font-semibold">Coach section</strong> —
          a separate workspace from your own training. You can build structured programmes, monitor client progress in real time,
          message clients, and build a reusable library of phase templates to deploy quickly.
        </div>

        <div className="space-y-3">
          {[
            { label: 'Clients', desc: 'Athletes you manage. Each client has their own training blocks, workout history, and progress data visible only to you and them.' },
            { label: 'Phase Templates', desc: 'Reusable programme blueprints. Build a template once and apply it to any client\'s block in seconds. Templates support full weekly workout structures.' },
            { label: 'Coach Dashboard', desc: 'Your overview — active clients, unread messages, and recent templates at a glance.' },
            { label: 'Messages', desc: 'In-app messaging with each client. Unread counts surface on the dashboard.' },
            { label: 'Seat Limit', desc: 'Your account has a maximum client capacity (maxClients). Admins manage seat allocation. Check your current usage in the Coach Dashboard.' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-primary-600">
                <p className="font-bold text-white text-sm">{label}</p>
              </div>
              <div className="px-4 py-3 bg-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 2. Inviting & Managing Clients ─────────────────────────────────── */}
      <section className="space-y-5">
        <div id="clients" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 2</p>
          <h2 className="text-xl font-bold text-gray-900">Inviting &amp; Managing Clients</h2>
          <p className="text-gray-500 text-sm mt-1">How to bring athletes into your coaching roster.</p>
        </div>

        <ol className="space-y-6">
          <StepCard
            step="1"
            title="Send a client invite"
            href="/coach/invite"
            cta="Go to Invite page"
            body={
              <p>
                Go to Coach Dashboard → Invite a Client. Enter the athlete&apos;s email address. pbX sends them an invitation
                link that is valid for 7 days. You can see pending invites on your dashboard — resend or revoke them at any time.
              </p>
            }
          />
          <StepCard
            step="2"
            title="Client accepts the invite"
            body={
              <p>
                When the client clicks the link, they are either prompted to create an account or, if they already have one,
                the relationship is connected automatically. They will then see a &quot;My Coach&quot; section in their navigation.
              </p>
            }
          />
          <StepCard
            step="3"
            title="Manage your client list"
            href="/coach/clients"
            cta="View your clients"
            body={
              <>
                <p>
                  Active clients appear in your Clients list. Click any client to access their full profile — training blocks,
                  workout history, progress charts, and messages.
                </p>
                <p>
                  From the client overview you can see their current active block at a glance, navigate directly into their
                  mesocycle structure, and start building a programme.
                </p>
              </>
            }
          />
        </ol>

        <ScreenshotPlaceholder label="Screenshot: Coach Dashboard — pending invites + client list" aspectRatio="16/7" />
        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 3. Building Client Training Blocks ─────────────────────────────── */}
      <section className="space-y-5">
        <div id="blocks" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 3</p>
          <h2 className="text-xl font-bold text-gray-900">Building Client Training Blocks</h2>
          <p className="text-gray-500 text-sm mt-1">Creating and populating structured programmes for your athletes.</p>
        </div>

        <ol className="space-y-6">
          <StepCard
            step="1"
            title="Create a training block for the client"
            body={
              <p>
                Open the client&apos;s profile → Blocks → New Block. Set a name, start date, and training focus.
                This works exactly like the athlete&apos;s own block setup, but you are building it on their behalf.
              </p>
            }
          />
          <StepCard
            step="2"
            title="Add phases"
            body={
              <>
                <p>
                  Inside the block, add phases with a focus (Accumulation, Intensification, Deload), duration, and split.
                  You have the same four population options available:
                </p>
                <ul className="space-y-1.5 mt-2">
                  {[
                    ['Manual add', 'Build workouts from scratch — full control.'],
                    ['Generate defaults', 'pbX scaffolds exercises from split + focus. A fast starting point to customise.'],
                    ['Repeat a prior phase', 'Copy structure from an earlier phase in the same block.'],
                    ['Apply a phase template', 'Deploy one of your saved templates instantly — the fastest option once your library is built.'],
                  ].map(([label, desc]) => (
                    <li key={label as string} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-primary-600 mt-0.5 shrink-0 font-bold">→</span>
                      <span><strong className="text-gray-800">{label}</strong> — {desc}</span>
                    </li>
                  ))}
                </ul>
              </>
            }
          />
          <StepCard
            step="3"
            title="Build out the workouts"
            body={
              <p>
                Open each workout in the phase and add exercises with sets, reps, RIR, rest periods, and notes.
                You can reorder exercises via drag-and-drop, mark exercises as supersets, and add tempo prescriptions.
                Changes apply immediately — the client sees the updated plan on their next login.
              </p>
            }
          />
          <StepCard
            step="4"
            title="Activate the phase"
            body={
              <p>
                Once the programme is ready, use the <strong>Activate</strong> button on the phase to mark it live.
                The client&apos;s dashboard will then display this phase&apos;s current week and workouts. They don&apos;t
                need to do anything — it just appears.
              </p>
            }
          />
        </ol>

        <ScreenshotPlaceholder label="Screenshot: Client block view — phases + activate button" aspectRatio="16/7" />
        <TipBox>
          Build out Week 1 of a phase fully before applying it. The rest of the weeks are generated from Week 1,
          so a complete Week 1 means a complete phase.
        </TipBox>
        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 4. Phase Templates ──────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div id="templates" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 4</p>
          <h2 className="text-xl font-bold text-gray-900">Phase Templates</h2>
          <p className="text-gray-500 text-sm mt-1">Build once, deploy to any client.</p>
        </div>

        <div className="bg-gray-900 rounded-xl px-5 py-4 text-sm text-gray-200 leading-relaxed">
          Phase templates let you save a programme blueprint — split, workouts, exercises, sets, reps, RIR — and
          apply it to any client&apos;s block in one step. The more templates you build, the faster you can
          onboard new athletes.
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-primary-600">
              <p className="font-bold text-white text-sm">Creating a template from scratch</p>
            </div>
            <div className="px-4 py-3 bg-gray-100 space-y-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                Go to Phase Templates → New Template. Set a name, split, and focus. pbX generates workout shells
                (e.g. Push A, Pull A, Legs A, Push B…) based on your split and number of training days.
                Open each workout and build it out exactly as you would for a client — exercises, sets, reps, RIR, rest.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Use the <strong>Copy Week</strong> feature to duplicate Week 1 into additional weeks, then adjust
                loads progressively week by week.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-primary-600">
              <p className="font-bold text-white text-sm">Saving a client phase as a template</p>
            </div>
            <div className="px-4 py-3 bg-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                Already built a phase for a client that worked well? Save it directly as a template from the
                phase page — all weeks are captured. It immediately appears in your template library ready to
                deploy to other clients.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-primary-600">
              <p className="font-bold text-white text-sm">Applying a template to a client</p>
            </div>
            <div className="px-4 py-3 bg-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                Inside a client&apos;s phase, choose &quot;Apply Phase Template&quot;. Select the template from your library —
                the workouts and exercises populate immediately, week by week. You can then edit the result to
                personalise it for that athlete before activating.
              </p>
            </div>
          </div>
        </div>

        <ScreenshotPlaceholder label="Screenshot: Phase template editor — week carousel + workout exercises" aspectRatio="16/7" />
        <Link href="/coach/templates" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
          Go to Phase Templates →
        </Link>
        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 5. Monitoring Client Progress ──────────────────────────────────── */}
      <section className="space-y-5">
        <div id="monitoring" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 5</p>
          <h2 className="text-xl font-bold text-gray-900">Monitoring Client Progress</h2>
          <p className="text-gray-500 text-sm mt-1">What you can see for each athlete and how to act on it.</p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Overview', desc: 'The client overview tab shows their active block name, current mesocycle, and recent session count. Click any mesocycle row to go directly into their phase view.' },
            { label: 'Progress', desc: 'Full access to the client\'s progress charts — session volume, RPE trend, exercise metrics (weight over time, estimated 1RM, PR history), and block comparison. The same data the athlete sees.' },
            { label: 'Workout History', desc: 'Every session the client has logged — date, duration, exercises, sets, reps, and weight. Useful for spotting consistency patterns or reviewing a session before adjusting their programme.' },
            { label: 'Messages', desc: 'Direct in-app messaging. Use this to give feedback after sessions, flag form cues, or check in on how a phase is feeling. Unread messages are surfaced on your dashboard.' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-primary-600">
                <p className="font-bold text-white text-sm">{label}</p>
              </div>
              <div className="px-4 py-3 bg-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <ScreenshotPlaceholder label="Screenshot: Client progress tab — volume chart + exercise metrics" aspectRatio="16/7" />
        <SectionDivider />
        <BackToTop />
      </section>

      {/* ── 6. Your Coach Profile ───────────────────────────────────────────── */}
      <section className="space-y-5">
        <div id="profile" className="-mt-4 pt-4" />
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Section 6</p>
          <h2 className="text-xl font-bold text-gray-900">Your Coach Profile</h2>
          <p className="text-gray-500 text-sm mt-1">What your clients see when they view their My Coach page.</p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Your profile is the first impression clients get of you inside the app. Set it up via{' '}
          <Link href="/coach/about" className="font-medium text-primary-600 hover:text-primary-700 transition">
            About Me
          </Link>{' '}
          in the Coach sidebar.
        </p>

        <div className="space-y-3">
          {[
            { label: 'Profile photo', desc: 'Upload a JPEG, PNG, or WebP (max 2MB). Shown as a circular avatar on your client\'s My Coach page. Falls back to your initials if not set.' },
            { label: 'Bio', desc: 'A short description of your background, coaching philosophy, and specialties. Plain text — keep it concise and client-facing.' },
            { label: 'Contact number', desc: 'Optional. Displayed to clients so they can reach you outside the app.' },
            { label: 'Office hours', desc: 'Optional. Let clients know when you\'re available — e.g. "Mon–Fri 7am–7pm AEST".' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-primary-600">
                <p className="font-bold text-white text-sm">{label}</p>
              </div>
              <div className="px-4 py-3 bg-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <ScreenshotPlaceholder label="Screenshot: About Me page + client My Coach view" aspectRatio="16/7" />
        <Link href="/coach/about" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
          Set up your profile →
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
