'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import type { ReleaseNote } from '@/lib/releaseNotes'

interface ReleaseNotesDialogProps {
  unseenNotes: ReleaseNote[]
}

export function ReleaseNotesDialog({ unseenNotes }: ReleaseNotesDialogProps) {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)

  async function dismiss() {
    setLoading(true)
    await fetch('/api/user/mark-release-seen', { method: 'PATCH' })
    setLoading(false)
    setOpen(false)
  }

  return (
    <Modal isOpen={open} onClose={dismiss} title="What's New">
      <div className="max-h-[60vh] overflow-y-auto space-y-6 -mt-2">
        {unseenNotes.map((note, i) => (
          <div key={note.id}>
            {i > 0 && <hr className="mb-6 border-gray-200" />}
            <p className="text-xs text-gray-400 mb-1">{note.date}</p>
            <h3 className="font-semibold text-gray-900 mb-3">{note.title}</h3>
            <ul className="space-y-1.5">
              {note.changes.map((change, j) => (
                <li key={j} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-primary-500 mt-0.5 flex-shrink-0">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={dismiss}
          disabled={loading}
          className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Got it'}
        </button>
      </div>
    </Modal>
  )
}
