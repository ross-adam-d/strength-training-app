import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const FOCUS_COLOURS: Record<string, string> = {
  hypertrophy: 'bg-blue-100 text-blue-700',
  strength:    'bg-orange-100 text-orange-700',
  power:       'bg-purple-100 text-purple-700',
  endurance:   'bg-green-100 text-green-700',
  deload:      'bg-gray-100 text-gray-600',
}

export default async function PhaseTemplatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') redirect('/dashboard')

  const templates = await prisma.coachPhaseTemplate.findMany({
    where: { coachId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      focus: true,
      trainingSplit: true,
      daysPerWeek: true,
      defaultWeeks: true,
      updatedAt: true,
      _count: { select: { workouts: true } },
    },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phase Templates</h1>
          <p className="text-gray-500 text-sm mt-1">
            Reusable phase structures you can apply to any client&apos;s training block.
          </p>
        </div>
        <Link
          href="/coach/templates/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
        >
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Build your phase library by creating templates here, or save phases from a client&apos;s
            training block as you go.
          </p>
          <Link
            href="/coach/templates/new"
            className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
          >
            Create first template
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <a
              key={t.id}
              href={`/coach/templates/${t.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-400 hover:shadow-sm transition block"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</h3>
                {t.focus && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${FOCUS_COLOURS[t.focus] ?? 'bg-gray-100 text-gray-600'}`}>
                    {t.focus}
                  </span>
                )}
              </div>

              {t.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {t.trainingSplit && <span>{t.trainingSplit}</span>}
                {t.daysPerWeek && <span>{t.daysPerWeek} days/week</span>}
                <span>{t.defaultWeeks} weeks</span>
                <span>{t._count.workouts} workout{t._count.workouts !== 1 ? 's' : ''}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
