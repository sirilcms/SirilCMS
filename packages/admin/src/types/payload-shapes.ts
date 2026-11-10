// Структурные типы документов, которые читает код движка (notify, CSV-экспорт).
// Раньше импортировались из generated `payload-types.ts` приложения (`apps/reference-admin`) — путь существовал
// только в монорепо и ломал type-check у потребителей пакета. Здесь — только поля, реально используемые движком.

export type FormShape = {
  id: number
  name: string
  notifyEmails?: { email: string }[] | null
  fields?: { name: string; label?: string | null }[] | null
}

export type SiteShape = {
  id: number
  contacts?: { email?: string | null; telegram?: string | null } | null
  settings?: {
    smtpHost?: string | null
    smtpPort?: string | number | null
    smtpUser?: string | null
    smtpFrom?: string | null
    smtpPass?: string | null
  } | null
}

export type FormSubmissionShape = {
  id: number
  createdAt: string
  ip?: string | null
  site: number | { id: number }
  form: number | { id: number }
  values?: { name?: string | null; value?: string | null }[] | null
}
