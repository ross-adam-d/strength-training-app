'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { WizardLayout } from '@/components/setup-wizard/WizardLayout'
import { StepDuration } from '@/components/setup-wizard/StepDuration'
import { StepRecovery } from '@/components/setup-wizard/StepRecovery'
import { StepDaysAndSplit } from '@/components/setup-wizard/StepDaysAndSplit'
import { StepReview } from '@/components/setup-wizard/StepReview'
import { generatePlan } from '@/lib/generatePlan'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(12)
  const [buildWeeks, setBuildWeeks] = useState(4)
  const [recoveryWeeks, setRecoveryWeeks] = useState(1)
  const [trainingDays, setTrainingDays] = useState(4)
  const [splitKey, setSplitKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [startDate] = useState(() => new Date())
  const [showActiveBlockWarning, setShowActiveBlockWarning] = useState(false)
  const [existingActiveBlockId, setExistingActiveBlockId] = useState<string | null>(null)

  const plan = useMemo(() => {
    if (!splitKey) return null
    return generatePlan({ totalWeeks, buildWeeks, recoveryWeeks, trainingDays, splitKey, startDate })
  }, [totalWeeks, buildWeeks, recoveryWeeks, trainingDays, splitKey, startDate])

  async function handleSubmit(forceStatus?: 'active' | 'planned') {
    if (!plan) return
    setSubmitting(true)
    setError('')
    try {
      const planData = forceStatus ? { ...plan, status: forceStatus } : plan

      const res = await fetch('/api/macrocycles/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
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
      router.push(`/macrocycles/${id}`)
    } catch (error) {
      console.error('Setup error:', error)
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  async function handleMakeNewActive() {
    if (!existingActiveBlockId) return
    setSubmitting(true)
    setShowActiveBlockWarning(false)
    try {
      // Pause the existing active block
      const pauseRes = await fetch(`/api/macrocycles/${existingActiveBlockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      })
      if (!pauseRes.ok) {
        throw new Error('Failed to pause existing block')
      }
      // Create new block as active
      await handleSubmit('active')
    } catch (error) {
      console.error('Error making new block active:', error)
      setError('Failed to pause existing block and create new one')
      setSubmitting(false)
    }
  }

  async function handleCreateAsPlanned() {
    setShowActiveBlockWarning(false)
    await handleSubmit('planned')
  }

  return (
    <>
      <WizardLayout
        step={step}
        totalSteps={4}
        onBack={() => setStep((s) => Math.max(1, s - 1))}
        onNext={() => setStep((s) => Math.min(4, s + 1))}
        onSubmit={handleSubmit}
        canNext={step < 3 ? true : !!splitKey}
        submitting={submitting}
        error={error}
      >
        {step === 1 && <StepDuration totalWeeks={totalWeeks} onChange={setTotalWeeks} />}
        {step === 2 && (
          <StepRecovery
            totalWeeks={totalWeeks}
            buildWeeks={buildWeeks}
            recoveryWeeks={recoveryWeeks}
            onBuildChange={setBuildWeeks}
            onRecoveryChange={setRecoveryWeeks}
          />
        )}
        {step === 3 && (
          <StepDaysAndSplit
            trainingDays={trainingDays}
            splitKey={splitKey}
            onDaysChange={(d) => {
              setTrainingDays(d)
              setSplitKey('')
            }}
            onSplitChange={setSplitKey}
          />
        )}
        {step === 4 && plan && <StepReview plan={plan} />}
      </WizardLayout>

      <Modal
        isOpen={showActiveBlockWarning}
        onClose={() => setShowActiveBlockWarning(false)}
        title="Active Training Block Exists"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You already have an active training block. Would you like to make your new block active?
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Yes:</strong> Your current active block will be paused, and the new block will become active.</p>
            <p><strong>No:</strong> The new block will be created as &quot;Planned&quot; and you can activate it later.</p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={handleCreateAsPlanned}
              disabled={submitting}
            >
              No, Create as Planned
            </Button>
            <Button
              onClick={handleMakeNewActive}
              disabled={submitting}
            >
              Yes, Make This Active
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
