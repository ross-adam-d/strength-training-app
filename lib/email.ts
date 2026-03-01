import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
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
