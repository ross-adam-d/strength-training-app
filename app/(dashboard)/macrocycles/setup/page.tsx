'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { addWeeks, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import Link from 'next/link'

export default function SetupPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const hasActiveCoach = (session?.user as any)?.hasActiveCoach ?? false
  const subscriptionStatus = session?.user?.subscriptionStatus
  const trialEndsAt = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) : null
  const hasOwnAccess =
    subscriptionStatus === 'ACTIVE' ||
    (subscriptionStatus === 'TRIALING' && trialEndsAt != null && trialEndsAt > new Date())
  const isCoachOnlyMode = hasActiveCoach && !hasOwnAccess

  // All hooks must be declared before any conditional returns
  const [totalWeeks, setTotalWeeks] = useState(12)
  const [blockName, setBlockName] = useState('')
  const [activeWeeks, setActiveWeeks] = useState(3)
  const [recoveryWeeks, setRecoveryWeeks] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [startDate] = useState(() => new Date())
  const [showActiveBlockWarning, setShowActiveBlockWarning] = useState(false)
  const [existingActiveBlockId, setExistingActiveBlockId] = useState<string | null>(null)
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([])

  if (isCoachOnlyMode) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center px-4">
        <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your training is managed by your coach</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your coach builds and assigns your training blocks.
          To create your own blocks independently, subscribe to Elite.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/subscribe"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition"
            style={{ backgroundColor: '#FF8000' }}
          >
            Subscribe to Elite
          </Link>
          <Link
            href="/macrocycles"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Back to blocks
          </Link>
        </div>
      </div>
    )
  }

  function toggleEquipment(eq: string) {
    setAvailableEquipment(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    )
  }

  const phaseLength = activeWeeks + recoveryWeeks
  const estimatedPhases = Math.ceil(totalWeeks / phaseLength)

  // Generate simplified plan structure (empty phases/weeks, no workouts)
  function generateSimplifiedPlan() {
    const endDate = addWeeks(startDate, totalWeeks)
    const name = blockName.trim() || `${totalWeeks}-Week Training Block`

    // Create phases using configured phase length (active + recovery weeks)
    const mesocycles = []
    let currentWeek = 0
    let phaseNum = 1

    while (currentWeek < totalWeeks) {
      const phaseWeeks = Math.min(phaseLength, totalWeeks - currentWeek)
      const phaseStart = addWeeks(startDate, currentWeek)
      const phaseEnd = addWeeks(phaseStart, phaseWeeks)

      // Create empty microcycles (weeks) with no workouts
      const microcycles = []
      for (let w = 0; w < phaseWeeks; w++) {
        const weekStart = addWeeks(phaseStart, w)
        const weekEnd = addWeeks(weekStart, 1)
        const isRecovery = recoveryWeeks > 0 && w >= activeWeeks
        microcycles.push({
          name: `Week ${currentWeek + w + 1}${isRecovery ? ' (Recovery)' : ''}`,
          weekNumber: currentWeek + w + 1,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          isRecovery,
          workouts: [] // Empty - user will configure on overview page
        })
      }

      mesocycles.push({
        name: `Phase ${phaseNum}`,
        startDate: format(phaseStart, 'yyyy-MM-dd'),
        endDate: format(phaseEnd, 'yyyy-MM-dd'),
        microcycles
      })

      currentWeek += phaseWeeks
      phaseNum++
    }

    return {
      name,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      status: 'planned' as const,
      availableEquipment,
      mesocycles
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (totalWeeks < 4 || totalWeeks > 52) {
      setError('Duration must be between 4 and 52 weeks')
      return
    }
    if (phaseLength < 1 || phaseLength > 12) {
      setError('Phase length must be between 1 and 12 weeks')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const plan = generateSimplifiedPlan()

      const res = await fetch('/api/macrocycles/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        // Check if error is about existing active block
        if (data.error?.includes('already have an active training block')) {
          // Find the existing active block
          const blocksRes = await fetch('/api/macrocycles')
          if (blocksRes.ok) {
            const blocks = await blocksRes.json()
            const activeBlock = blocks.find((b: any) => b.status === 'active')
            if (activeBlock) {
              setExistingActiveBlockId(activeBlock.id)
              setShowActiveBlockWarning(true)
              setSubmitting(false)
              return
            }
          }
        }
        setError(data.error || 'Failed to create training block')
        setSubmitting(false)
        return
      }

      const { id } = await res.json()
      // Redirect to training block overview where user can configure phases
      router.push(`/macrocycles/${id}`)
    } catch (error) {
      console.error('Setup error:', error)
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/macrocycles" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Training Blocks
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Create Training Block</h1>
          <p className="text-gray-600 mt-2">
            Create a new training block and configure the details on the next page.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Block Name (optional)
              </label>
              <input
                type="text"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={`${totalWeeks}-Week Training Block`}
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank to use default name
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Duration: <span className="text-primary-600 font-bold">{totalWeeks} weeks</span>
              </label>
              <input
                type="range"
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(parseInt(e.target.value))}
                min={4}
                max={52}
                step={1}
                className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>4 weeks</span>
                <span>52 weeks</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Phase Structure</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Training Weeks: <span className="text-primary-600 font-bold">{activeWeeks} {activeWeeks === 1 ? 'week' : 'weeks'}</span>
                </label>
                <input
                  type="range"
                  value={activeWeeks}
                  onChange={(e) => setActiveWeeks(parseInt(e.target.value))}
                  min={1}
                  max={8}
                  step={1}
                  className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 week</span>
                  <span>8 weeks</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Weeks of progressive training before recovery
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recovery/Deload Weeks: <span className="text-primary-600 font-bold">{recoveryWeeks} {recoveryWeeks === 1 ? 'week' : 'weeks'}</span>
                </label>
                <input
                  type="range"
                  value={recoveryWeeks}
                  onChange={(e) => setRecoveryWeeks(parseInt(e.target.value))}
                  min={0}
                  max={3}
                  step={1}
                  className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 weeks</span>
                  <span>3 weeks</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Lighter weeks for recovery between phases
                </p>
              </div>

              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Phase Length:</span>
                  <span className="text-lg font-bold text-primary-600">{phaseLength} weeks</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Estimated Phases:</span>
                  <span className="text-sm font-semibold text-gray-900">{estimatedPhases} phases</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ({activeWeeks} active + {recoveryWeeks} recovery = {phaseLength} weeks per phase)
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-1">Available Equipment</h3>
              <p className="text-sm text-gray-500 mb-3">Select the equipment you have access to. Leave all unselected to use all equipment.</p>
              <div className="space-y-2">
                {[
                  { key: 'barbell',    label: 'Barbell' },
                  { key: 'rack',       label: 'Rack' },
                  { key: 'bench',      label: 'Bench' },
                  { key: 'dumbbell',   label: 'Dumbbells' },
                  { key: 'cable',      label: 'Cable Machine' },
                  { key: 'machine',    label: 'Machines' },
                  { key: 'bodyweight', label: 'Bodyweight' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableEquipment.includes(key)}
                      onChange={() => toggleEquipment(key)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Next Steps</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Configure focus and training split for each phase</li>
                <li>• Set training days per week</li>
                <li>• Add workouts and exercises to your schedule</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Create Training Block'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/macrocycles')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Modal
        isOpen={showActiveBlockWarning}
        onClose={() => setShowActiveBlockWarning(false)}
        title="Active Training Block Exists"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You already have an active training block. The new block will be created as &quot;Planned&quot;.
          </p>
          <p className="text-sm text-gray-600">
            You can activate it later from the training blocks page.
          </p>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              onClick={() => {
                setShowActiveBlockWarning(false)
                handleSubmit()
              }}
              disabled={submitting}
            >
              OK, Create as Planned
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
