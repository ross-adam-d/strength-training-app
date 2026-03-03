'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

interface Message {
  id: string
  senderRole: 'COACH' | 'CLIENT'
  senderId: string
  content: string
  readAt: string | null
  createdAt: string
}

export default function CoachMessagesPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/coach/messages?clientId=${clientId}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silent — polling will retry
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 30_000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, clientId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to send')
        return
      }
      setInput('')
      await fetchMessages()
      inputRef.current?.focus()
    } catch {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading messages…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No messages yet. Send the first one.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCoach = msg.senderRole === 'COACH'
            return (
              <div key={msg.id} className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isCoach
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isCoach ? 'text-primary-200' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                    {isCoach && msg.readAt && (
                      <span className="ml-1.5">· Read</span>
                    )}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your client… (Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="flex-shrink-0 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Refreshes every 30 seconds · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
