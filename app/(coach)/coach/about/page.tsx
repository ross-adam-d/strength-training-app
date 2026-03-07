'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CoachProfile {
  bio: string | null
  contactPhone: string | null
  officeHours: string | null
  maxClients: number
}

export default function CoachAboutPage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [bio, setBio] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [officeHours, setOfficeHours] = useState('')

  useEffect(() => {
    fetch('/api/coach/profile')
      .then(r => r.json())
      .then((data: CoachProfile) => {
        setProfile(data)
        setBio(data.bio ?? '')
        setContactPhone(data.contactPhone ?? '')
        setOfficeHours(data.officeHours ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/coach/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio: bio.trim() || null,
        contactPhone: contactPhone.trim() || null,
        officeHours: officeHours.trim() || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('Failed to save profile')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/coach" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Coach Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">About Me</h1>
        <p className="text-sm text-gray-500 mt-1">
          This information is visible to your clients on their My Coach page.
        </p>
      </div>

      {/* Edit form */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={5}
            placeholder="Tell your clients about yourself — your background, coaching philosophy, specialties…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact number</label>
          <input
            type="tel"
            value={contactPhone}
            onChange={e => setContactPhone(e.target.value)}
            placeholder="+61 4XX XXX XXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Office hours / availability</label>
          <textarea
            value={officeHours}
            onChange={e => setOfficeHours(e.target.value)}
            rows={3}
            placeholder="e.g. Mon–Fri 7am–6pm AEST. Messages responded to within 24 hours."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved ✓</span>
          )}
        </div>
      </div>

      {/* Preview */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Client preview</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {!bio && !contactPhone && !officeHours ? (
            <p className="text-sm text-gray-400 text-center py-4">Fill in your details above to see a preview</p>
          ) : (
            <>
              {bio && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{bio}</p>
                </div>
              )}
              {contactPhone && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                  <p className="text-sm text-gray-700">{contactPhone}</p>
                </div>
              )}
              {officeHours && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Availability</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{officeHours}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
