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
