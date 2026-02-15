'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addWeeks, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import Link from 'next/link'

export default function SetupPage() {
  const router = useRouter()
  const [totalWeeks, setTotalWeeks] = useState(12)
  const [blockName, setBlockName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [startDate] = useState(() => new Date())
  const [showActiveBlockWarning, setShowActiveBlockWarning] = useState(false)
  const [existingActiveBlockId, setExistingActiveBlockId] = useState<string | null>(null)

  // Generate simplified plan structure (empty phases/weeks, no workouts)
  function generateSimplifiedPlan() {
    const endDate = addWeeks(startDate, totalWeeks)
    const name = blockName.trim() || `${totalWeeks}-Week Training Block`

    // Create one phase per 4 weeks (or remaining weeks)
    const mesocycles = []
    let currentWeek = 0
    let phaseNum = 1

    while (currentWeek < totalWeeks) {
      const phaseWeeks = Math.min(4, totalWeeks - currentWeek)
      const phaseStart = addWeeks(startDate, currentWeek)
      const phaseEnd = addWeeks(phaseStart, phaseWeeks)

      // Create empty microcycles (weeks) with no workouts
      const microcycles = []
      for (let w = 0; w < phaseWeeks; w++) {
        const weekStart = addWeeks(phaseStart, w)
        const weekEnd = addWeeks(weekStart, 1)
        microcycles.push({
          name: `Week ${currentWeek + w + 1}`,
          weekNumber: currentWeek + w + 1,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          workouts: [] // Empty - user will configure on overview page
        })
      }

      mesocycles.push({
        name: `Phase ${phaseNum}`,
        focus: null,
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
      mesocycles
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (totalWeeks < 4 || totalWeeks > 52) {
      setError('Duration must be between 4 and 52 weeks')
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (weeks)
              </label>
              <input
                type="number"
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(parseInt(e.target.value) || 12)}
                min={4}
                max={52}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Between 4 and 52 weeks. Phases will be created automatically (4 weeks each).
              </p>
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
