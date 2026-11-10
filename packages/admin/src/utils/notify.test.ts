import { describe, expect, it } from 'vitest'
import { buildNotificationEmailHtml, buildNotificationText, resolveNotifyRecipients, resolveSmtpFrom } from './notify'

describe('buildNotificationText', () => {
  it('joins form name and values into one line', () => {
    const text = buildNotificationText('Обратная связь', [
      { name: 'name', value: 'Иван' },
      { name: 'email', value: 'ivan@example.com' },
    ])
    expect(text).toBe('Заявка (Обратная связь): name: Иван | email: ivan@example.com')
  })

  it('handles no values', () => {
    expect(buildNotificationText('Форма', [])).toBe('Заявка (Форма): ')
  })
})

describe('buildNotificationEmailHtml', () => {
  it('renders form name and values as a table', () => {
    const html = buildNotificationEmailHtml('Обратная связь', [
      { name: 'name', value: 'Иван' },
      { name: 'email', value: 'ivan@example.com' },
    ])
    expect(html).toContain('Обратная связь')
    expect(html).toContain('<td style="padding:4px 8px;font-weight:600">name</td>')
    expect(html).toContain('<td style="padding:4px 8px">Иван</td>')
  })

  it('escapes HTML in field values', () => {
    const html = buildNotificationEmailHtml('Форма', [{ name: 'comment', value: '<script>alert(1)</script>' }])
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('resolveNotifyRecipients', () => {
  it('combines form and site emails', () => {
    expect(resolveNotifyRecipients('site@example.com', ['form@example.com'])).toEqual([
      'form@example.com',
      'site@example.com',
    ])
  })

  it('dedupes case-insensitively', () => {
    expect(resolveNotifyRecipients('Same@Example.com', ['same@example.com'])).toEqual(['same@example.com'])
  })

  it('drops blank entries', () => {
    expect(resolveNotifyRecipients('  ', ['', undefined, null, 'a@example.com'])).toEqual(['a@example.com'])
  })

  it('returns empty array when nothing configured', () => {
    expect(resolveNotifyRecipients(undefined, undefined)).toEqual([])
  })
})

describe('resolveSmtpFrom', () => {
  it('prefers smtpFrom over smtpUser', () => {
    expect(resolveSmtpFrom({ smtpFrom: 'noreply@site.ru', smtpUser: 'ajes7ta7uldp7gem1vkd' })).toEqual({ from: 'noreply@site.ru' })
  })

  it('falls back to smtpUser when smtpFrom is empty', () => {
    expect(resolveSmtpFrom({ smtpFrom: '  ', smtpUser: 'user@site.ru' })).toEqual({ from: 'user@site.ru' })
    expect(resolveSmtpFrom({ smtpUser: 'user@site.ru' })).toEqual({ from: 'user@site.ru' })
  })

  it('accepts "Name <addr>" format', () => {
    expect(resolveSmtpFrom({ smtpFrom: 'Сайт <noreply@site.ru>' })).toEqual({ from: 'Сайт <noreply@site.ru>' })
  })

  it('errors when both are empty', () => {
    expect(resolveSmtpFrom({})).toEqual({ error: expect.stringContaining('не задан адрес отправителя') })
    expect(resolveSmtpFrom(null)).toEqual({ error: expect.stringContaining('SMTP отправитель') })
  })

  it('errors when the fallback smtpUser is not an email (Postbox ID)', () => {
    expect(resolveSmtpFrom({ smtpUser: 'ajes7ta7uldp7gem1vkd' })).toEqual({ error: expect.stringContaining('не похож на email') })
  })

  it('errors when smtpFrom is not an email', () => {
    expect(resolveSmtpFrom({ smtpFrom: 'noreply', smtpUser: 'user@site.ru' })).toEqual({ error: expect.stringContaining('не похож на email') })
  })
})
