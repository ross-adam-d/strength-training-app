import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendVerificationEmail({
  toEmail,
  name,
  verifyUrl,
}: {
  toEmail: string
  name?: string | null
  verifyUrl: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@pbx.app',
    to: toEmail,
    subject: 'Verify your email address — pbX',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #FF8000; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #374151; margin-bottom: 24px;">
          ${name ? `Hi ${name}, click` : 'Click'} the button below to verify your email address and activate your pbX account.
        </p>
        <a
          href="${verifyUrl}"
          style="display: inline-block; background: #FF8000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;"
        >
          Verify email address
        </a>
        <p style="color: #6B7280; font-size: 13px; margin-top: 24px;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail({
  toEmail,
  name,
  resetUrl,
}: {
  toEmail: string
  name?: string | null
  resetUrl: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@pbx.app',
    to: toEmail,
    subject: 'Reset your password — pbX',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #FF8000; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #374151; margin-bottom: 24px;">
          ${name ? `Hi ${name}, we` : 'We'} received a request to reset your pbX password.
          Click the button below to choose a new password.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #FF8000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;"
        >
          Reset password
        </a>
        <p style="color: #6B7280; font-size: 13px; margin-top: 24px;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
        </p>
      </div>
    `,
  })
}

export async function sendBetaEmail({
  toEmail,
  name,
}: {
  toEmail: string
  name?: string | null
}) {
  const subscribeUrl = 'https://pbxstrength.com.au/subscribe'
  const greeting = name ? `Hi ${name},` : 'Hi,'

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@pbxstrength.com.au',
    to: toEmail,
    subject: 'A thank you from pbX — 30% off inside',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #111827;">

        <h1 style="font-size: 24px; font-weight: 800; color: #FF8000; margin: 0 0 4px 0;">pbX</h1>
        <p style="color: #6B7280; font-size: 13px; margin: 0 0 32px 0;">Strength training, structured.</p>

        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">${greeting}</p>

        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Thank you for being one of the first people to try pbX. Your feedback during beta has helped shape the product into what it is today.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          As a thank you, here's a code for <strong>30% off for your first 12 months</strong> when you subscribe to Elite:
        </p>

        <div style="background: #FFF7ED; border: 2px dashed #FF8000; border-radius: 12px; padding: 20px 24px; text-align: center; margin: 0 0 28px 0;">
          <p style="font-size: 13px; color: #6B7280; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.05em;">Your discount code</p>
          <p style="font-size: 28px; font-weight: 800; letter-spacing: 0.1em; color: #111827; margin: 0;">BETA30</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 8px 0;">
          Elite gives you:
        </p>
        <ul style="font-size: 15px; line-height: 1.8; color: #374151; padding-left: 20px; margin: 0 0 28px 0;">
          <li>Structured training blocks — built around progressive overload</li>
          <li>Volume &amp; intensity trends, exercise progression charts</li>
          <li>Deep analytics &amp; training readiness scoring</li>
          <li>Export your full training history</li>
        </ul>

        <a
          href="${subscribeUrl}"
          style="display: inline-block; background: #FF8000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 16px;"
        >
          Subscribe — use code BETA30
        </a>

        <p style="font-size: 13px; color: #9CA3AF; margin: 28px 0 0 0;">
          Elite is $15 AUD/month. With BETA30 that's $10.50/month for your first year.
          Enter the code at checkout. Cancel any time.
        </p>

        <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 32px 0;" />

        <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
          You're receiving this because you signed up for pbX at pbxstrength.com.au.<br />
          &copy; ${new Date().getFullYear()} pbX. All rights reserved.
        </p>

      </div>
    `,
  })
}

export async function sendCoachInvite({
  toEmail,
  coachName,
  inviteUrl,
}: {
  toEmail: string
  coachName: string
  inviteUrl: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@pbx.app',
    to: toEmail,
    subject: `${coachName} invited you to train on pbX`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #FF8000; margin-bottom: 8px;">You've been invited</h2>
        <p style="color: #374151; margin-bottom: 24px;">
          <strong>${coachName}</strong> has invited you to connect as your coach on pbX.
        </p>
        <a
          href="${inviteUrl}"
          style="display: inline-block; background: #FF8000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;"
        >
          Accept invite
        </a>
        <p style="color: #6B7280; font-size: 13px; margin-top: 24px;">
          This link expires in 7 days. If you weren't expecting this, you can ignore it.
        </p>
      </div>
    `,
  })
}
