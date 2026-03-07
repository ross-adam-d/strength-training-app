'use client'

import { useState } from 'react'
import Link from 'next/link'

const FOCUS_OPTIONS = ['hypertrophy', 'strength', 'power', 'endurance', 'deload']
const SPLIT_OPTIONS = [
  'Full Body',
  'Upper/Lower',
  'Push/Pull/Legs',
  'Push/Pull',
  'Bro Split',
  'Olympic Lifts',
  'Custom',
]

export default function NewPhaseTemplatePage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [focus, setFocus] = useState('')
  const [trainingSplit, setTrainingSplit] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [defaultWeeks, setDefaultWeeks] = useState(4)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Template name is required'); return }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/coach/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          focus: focus || undefined,
          trainingSplit: trainingSplit || undefined,
          daysPerWeek,
          defaultWeeks,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create template')
        setSubmitting(false)
        return
      }

      const { id } = await res.json()
      window.location.assign(`/coach/templates/${id}`)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/coach/templates" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Templates
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">New Phase Template</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Define the structure. You&apos;ll add workouts and exercises on the next page.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hypertrophy Base, Strength Peaking, Deload"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief notes about when and how to use this template"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select focus</option>
              {FOCUS_OPTIONS.map((f) => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Training Split */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Split</label>
            <select
              value={trainingSplit}
              onChange={(e) => setTrainingSplit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select split</option>
              {SPLIT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Days per Week: <span className="text-primary-600 font-bold">{daysPerWeek}</span>
              </label>
              <input
                type="range"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                min={1} max={7} step={1}
                className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span><span>7</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Duration: <span className="text-primary-600 font-bold">{defaultWeeks} weeks</span>
              </label>
              <input
                type="range"
                value={defaultWeeks}
                onChange={(e) => setDefaultWeeks(parseInt(e.target.value))}
                min={1} max={12} step={1}
                className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span><span>12</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 transition"
            >
              {submitting ? 'Creating…' : 'Create & Add Workouts →'}
            </button>
            <Link
              href="/coach/templates"
              className="block w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
