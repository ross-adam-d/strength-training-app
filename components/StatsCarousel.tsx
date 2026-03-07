'use client'

import { useState, useRef } from 'react'

export type StatView = {
  title: string
  sub: string
  sessions: string
  time: string
  volume: string
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

export function StatsCarousel({ views }: { views: StatView[] }) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const view = views[idx]

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dist = touchStartX.current - e.changedTouches[0].clientX
    if (dist > 50) setIdx((i) => Math.min(views.length - 1, i + 1))
    if (dist < -50) setIdx((i) => Math.max(0, i - 1))
    touchStartX.current = null
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex justify-center gap-1.5 mb-3">
        {views.map((v, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              i === idx
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {v.title}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Sessions" value={view.sessions} sub={view.sub} />
        <StatCard label="Time" value={view.time} sub={view.sub} />
        <StatCard label="Volume" value={view.volume} sub={view.sub} />
      </div>
    </div>
  )
}
