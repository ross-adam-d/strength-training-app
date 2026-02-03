'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { WizardLayout } from '@/components/setup-wizard/WizardLayout'
import { StepDuration } from '@/components/setup-wizard/StepDuration'
import { StepRecovery } from '@/components/setup-wizard/StepRecovery'
import { StepDaysAndSplit } from '@/components/setup-wizard/StepDaysAndSplit'
import { StepReview } from '@/components/setup-wizard/StepReview'
import { generatePlan } from '@/lib/generatePlan'

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

  const plan = useMemo(() => {
    if (!splitKey) return null
    return generatePlan({ totalWeeks, buildWeeks, recoveryWeeks, trainingDays, splitKey, startDate })
  }, [totalWeeks, buildWeeks, recoveryWeeks, trainingDays, splitKey, startDate])

  async function handleSubmit() {
    if (!plan) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/macrocycles/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create training block')
        return
      }
      const { id } = await res.json()
      router.push(`/macrocycles/${id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
  )
}
