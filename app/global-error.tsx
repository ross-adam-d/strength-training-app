'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#dc2626', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            Application Error
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Please share the error details below:
          </p>
          <pre style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '6px', fontSize: '0.75rem', color: '#1f2937', overflow: 'auto', maxHeight: '15rem', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
            {error.message || 'Unknown error'}
            {'\n\n'}
            {error.stack || ''}
            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
          <button
            onClick={reset}
            style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
