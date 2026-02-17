import Link from 'next/link'

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Your trial has ended</h1>
          <p className="text-gray-600 mb-6">
            Your 4-week free trial has expired. Paid plans are coming soon — get in touch and we&apos;ll sort you out.
          </p>

          <a
            href="mailto:hello@problock.app"
            className="inline-block w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition mb-3"
          >
            Contact us
          </a>

          <Link
            href="/login"
            className="block text-sm text-gray-500 hover:text-gray-700 transition mt-2"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  )
}
