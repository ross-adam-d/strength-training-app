import React from 'react'
import { Button } from '@/components/ui/button'

interface WizardLayoutProps {
  step: number
  totalSteps: number
  children: React.ReactNode
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  canNext: boolean
  submitting: boolean
  error: string
}

const STEP_LABELS = ['Duration', 'Recovery', 'Days & Split', 'Review']

export function WizardLayout({
  step,
  totalSteps,
  children,
  onBack,
  onNext,
  onSubmit,
  canNext,
  submitting,
  error,
}: WizardLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Training Block</h1>
        <p className="text-gray-600 mt-1">Set up your training program in a few steps</p>
      </div>

      {/* Step bar */}
      <div className="flex items-center mb-8">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const isActive = n === step
          const isDone = n < step
          return (
            <React.Fragment key={n}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isDone
                      ? 'bg-primary-600 text-white'
                      : isActive
                      ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isDone ? '✓' : n}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {children}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Nav buttons */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack} disabled={step === 1}>
          Back
        </Button>
        {step < totalSteps ? (
          <Button onClick={onNext} disabled={!canNext}>
            Next
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Training Block'}
          </Button>
        )}
      </div>
    </div>
  )
}
