import type { BasePayload } from 'payload'
import type { FormShape as Form, FormSubmissionShape as FormSubmission, SiteShape as Site } from '../types/payload-shapes'

export function buildNotificationText(formName: string, values: { name?: string | null; value?: string | null }[]): string {
  return `Заявка (${formName}): ${values.map((v) => `${v.name}: ${v.value}`).join(' | ')}`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildNotificationEmailHtml(formName: string, values: { name?: string | null; value?: string | null }[]): string {
  const rows = values
    .map(
      (v) =>
        `<tr><td style="padding:4px 8px;font-weight:600">${escapeHtml(String(v.name ?? ''))}</td>` +
        `<td style="padding:4px 8px">${escapeHtml(String(v.value ?? ''))}</td></tr>`,
    )
    .join('')
  return `<h2>Заявка: ${escapeHtml(formName)}</h2><table style="border-collapse:collapse">${rows}</table>`
}

/** Объединяет доп. получателей формы и дефолтный email сайта, убирает пустые/дубликаты (регистронезависимо). */
export function resolveNotifyRecipients(
  siteEmail: string | null | undefined,
  formEmails: (string | null | undefined)[] | null | undefined,
): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of [...(formEmails ?? []), siteEmail]) {
    const email = raw?.trim()
    if (!email) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(email)
  }
  return result
}

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/

/** Берёт адрес из `noreply@x.ru` или `Имя <noreply@x.ru>`; null, если это не email. */
function extractEmail(value: string): string | null {
  const angle = value.match(/<([^<>]+)>\s*$/)
  const addr = (angle ? angle[1] : value).trim()
  return EMAIL_RE.test(addr) ? addr : null
}

/**
 * Отправитель SMTP-писем: «SMTP отправитель» (smtpFrom) приоритетнее «SMTP пользователь» (smtpUser).
 * Если результат пуст или не похож на email — `{ error }` (письмо слать нельзя: SMTP-провайдеры
 * вроде Yandex Cloud Postbox отвечают `550 Empty envelope senders not allowed`).
 */
export function resolveSmtpFrom(
  settings: { smtpFrom?: string | null; smtpUser?: string | null } | null | undefined,
): { from: string } | { error: string } {
  const from = settings?.smtpFrom?.trim() || settings?.smtpUser?.trim() || ''
  if (!from) return { error: 'не задан адрес отправителя (SMTP отправитель)' }
  if (!extractEmail(from)) return { error: `адрес отправителя «${from}» не похож на email — укажите его в поле «SMTP отправитель»` }
  return { from }
}

export type NotificationResult = {
  channel: 'email' | 'telegram'
  recipient: string
  status: 'sent' | 'failed'
  error?: string
}

export async function notifySubmission(payload: BasePayload, doc: FormSubmission): Promise<void> {
  const siteId = typeof doc.site === 'object' ? doc.site.id : doc.site
  const formId = typeof doc.form === 'object' ? doc.form.id : doc.form
  const [site, form] = await Promise.all([
    payload.findByID({ collection: 'sites', id: siteId, overrideAccess: true }) as Promise<Site>,
    payload.findByID({ collection: 'forms', id: formId, overrideAccess: true }) as Promise<Form>,
  ])
  const text = buildNotificationText(form.name, doc.values ?? [])
  const html = buildNotificationEmailHtml(form.name, doc.values ?? [])
  const results: NotificationResult[] = []

  const recipients = resolveNotifyRecipients(site.contacts?.email, (form.notifyEmails ?? []).map((r) => r.email))

  if (site.settings?.smtpHost && recipients.length > 0) {
    const sender = resolveSmtpFrom(site.settings)
    if ('error' in sender) {
      for (const recipient of recipients) results.push({ channel: 'email', recipient, status: 'failed', error: sender.error })
    } else {
      const { default: nodemailer } = await import('nodemailer')
      const port = Number(site.settings.smtpPort) || 587
      const smtp = nodemailer.createTransport({
        host: site.settings.smtpHost,
        port,
        secure: port === 465,
        auth: site.settings.smtpUser ? { user: site.settings.smtpUser, pass: site.settings.smtpPass ?? undefined } : undefined,
      })
      for (const recipient of recipients) {
        try {
          await smtp.sendMail({ from: sender.from, to: recipient, subject: `Заявка: ${form.name}`, text, html })
          results.push({ channel: 'email', recipient, status: 'sent' })
        } catch (err) {
          results.push({ channel: 'email', recipient, status: 'failed', error: err instanceof Error ? err.message : String(err) })
        }
      }
    }
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = site.contacts?.telegram
  if (tgToken && chatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
      if (!res.ok) throw new Error(`telegram ${res.status}`)
      results.push({ channel: 'telegram', recipient: chatId, status: 'sent' })
    } catch (err) {
      results.push({ channel: 'telegram', recipient: chatId, status: 'failed', error: err instanceof Error ? err.message : String(err) })
    }
  }

  if (results.length > 0) {
    await payload.update({ collection: 'form-submissions', id: doc.id, data: { notifications: results }, overrideAccess: true })
  }
}
