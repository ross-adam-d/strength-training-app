import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'

export const metadata = {
  title: 'Privacy Policy — pbX',
  description: 'How pbX collects, uses and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
    <div className="min-h-[100dvh] bg-white px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to pbX
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: 7 March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. About this policy</h2>
            <p>
              pbX (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an Australian strength training platform operated
              at pbxstrength.com.au. This policy explains how we collect, use, store and protect
              your personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and
              the Australian Privacy Principles (APPs).
            </p>
            <p className="mt-3">
              By creating an account or using pbX, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Information we collect</h2>
            <p className="mb-3">We collect the following personal information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account information</strong> — your name (optional) and email address,
                collected when you register.
              </li>
              <li>
                <strong>Authentication data</strong> — your password is stored as a one-way
                cryptographic hash (bcrypt). We never store your password in plain text.
              </li>
              <li>
                <strong>Training data</strong> — workout logs, exercises, sets, reps, weights,
                and program history that you enter while using the app. This may constitute
                health information under the Privacy Act.
              </li>
              <li>
                <strong>Subscription and billing data</strong> — your subscription plan and
                payment status. Payment card details are handled entirely by Stripe and are
                never stored on our systems.
              </li>
              <li>
                <strong>Coach relationship data</strong> — if you use the coach feature, we store
                the connection between a coach and their clients, and any messages exchanged
                within the platform.
              </li>
              <li>
                <strong>Usage data</strong> — basic technical data such as access logs, which
                may be retained by our hosting provider (Vercel).
              </li>
            </ul>
            <p className="mt-3">
              We collect only the information necessary to provide the service. We do not collect
              sensitive information such as government identifiers or financial account details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. How we use your information</h2>
            <p className="mb-3">We use your personal information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create and manage your account</li>
              <li>Provide the strength training platform and its features</li>
              <li>Send transactional emails (email verification, password resets, subscription receipts)</li>
              <li>Process subscription payments via Stripe</li>
              <li>Enable coach-client relationships and in-platform messaging</li>
              <li>Maintain the security and performance of the platform</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not use your personal information for advertising, and we do not sell or trade
              your information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Third parties we share information with</h2>
            <p className="mb-3">
              We share limited personal information with the following trusted third-party service
              providers, solely to operate the platform:
            </p>
            <div className="space-y-4">
              <div>
                <strong>Supabase / AWS</strong>
                <p className="text-sm mt-1">
                  Our database is hosted on Supabase, running on Amazon Web Services in the
                  Asia-Pacific (Singapore) region. Your account and training data is stored here.
                  Supabase maintains SOC 2 Type II certification.
                </p>
              </div>
              <div>
                <strong>Vercel</strong>
                <p className="text-sm mt-1">
                  Our application is hosted on Vercel&apos;s infrastructure (United States). Vercel
                  processes web requests and may retain access logs.
                </p>
              </div>
              <div>
                <strong>Stripe</strong>
                <p className="text-sm mt-1">
                  Subscription payments are processed by Stripe (United States). Stripe receives
                  your email address and payment details. We store only a Stripe customer reference ID.
                  Stripe is PCI DSS Level 1 certified.
                </p>
              </div>
              <div>
                <strong>Resend</strong>
                <p className="text-sm mt-1">
                  Transactional emails (verification, password reset) are delivered via Resend
                  (United States). Resend receives your email address and the content of
                  transactional emails only.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Overseas data storage</h2>
            <p>
              Some of your personal information is stored or processed outside Australia — specifically
              in Singapore (Supabase/AWS) and the United States (Vercel, Stripe, Resend). By using
              pbX, you consent to this transfer. We take reasonable steps to ensure these providers
              handle your information in a manner consistent with the Australian Privacy Principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data security</h2>
            <p>
              We take reasonable steps to protect your personal information from misuse, interference,
              loss, and unauthorised access. Measures include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>All data transmitted over HTTPS/TLS</li>
              <li>Passwords stored as bcrypt hashes (never in plain text)</li>
              <li>Database access restricted to application services only</li>
              <li>Email verification required for new accounts</li>
            </ul>
            <p className="mt-3">
              If we become aware of a data breach that is likely to result in serious harm, we will
              notify affected individuals and the Office of the Australian Information Commissioner
              (OAIC) as required under the Notifiable Data Breaches scheme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Data retention</h2>
            <p>
              We retain your personal information for as long as your account is active, or as
              necessary to provide the service. If you close your account, we will delete or
              de-identify your personal information within a reasonable period, unless we are
              required to retain it by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Your rights</h2>
            <p className="mb-3">Under the Privacy Act, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Access</strong> — request a copy of the personal information we hold about you
              </li>
              <li>
                <strong>Correction</strong> — ask us to correct information that is inaccurate,
                out of date, or incomplete
              </li>
              <li>
                <strong>Complaint</strong> — make a complaint if you believe we have mishandled
                your personal information
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at the address below. We will respond
              within 30 days.
            </p>
            <p className="mt-3">
              If you are unsatisfied with our response, you may lodge a complaint with the{' '}
              <a
                href="https://www.oaic.gov.au/privacy/privacy-complaints"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 underline"
              >
                Office of the Australian Information Commissioner (OAIC)
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Cookies and local storage</h2>
            <p>
              pbX uses session cookies for authentication (managed by NextAuth.js). We do not use
              third-party tracking or advertising cookies. A service worker is used to enable
              offline/PWA functionality — it does not collect personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. If we make material changes, we will
              notify you by email or by a prominent notice within the app. The date at the top of
              this page indicates when the policy was last updated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact us</h2>
            <p>
              For privacy-related enquiries, access requests, or complaints, please contact us at:
            </p>
            <p className="mt-3">
              <strong>pbX</strong><br />
              Email:{' '}
              <a href="mailto:support@pbxstrength.com.au" className="text-orange-600 hover:text-orange-700">
                support@pbxstrength.com.au
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
    <PublicFooter />
    </>
  )
}
