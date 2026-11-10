import type { CollectionConfig } from 'payload'
import { THEMES } from '@sirilcms/contracts'
import { isOwner } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'
import { decryptField, encryptField } from '../utils/field-encryption'

// Фабрика: select тем берёт активный реестр (core + расширения проекта) в момент вызова,
// поэтому вызывать после registerExtensions (sirilAdminConfig делает это сам).
export const makeSites = (): CollectionConfig => ({
  slug: 'sites',
  labels: {
    singular: { ru: 'Сайт', en: 'Site' },
    plural: { ru: 'Сайты', en: 'Sites' },
  },
  admin: {
    description: 'Настройки сайта (v1: одна запись)',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isOwner(user),
    update: ({ req: { user } }) => isOwner(user),
    delete: ({ req: { user } }) => isOwner(user),
  },
  hooks: {
    afterChange: [
      async (args) => {
        publishHook('site', args.doc.id as number, args.doc.id as number)
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { ru: 'Название', en: 'Name' },
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: { ru: 'Слаг', en: 'Slug' },
      unique: true,
      defaultValue: 'default',
      admin: { position: 'sidebar' },
    },
    {
      name: 'domain',
      type: 'text',
      label: { ru: 'Домен', en: 'Domain' },
    },
    {
      name: 'locale',
      type: 'select',
      label: { ru: 'Язык', en: 'Locale' },
      // Язык контента этого сайта (весь сайт целиком — v1 не поддерживает мультиязычность внутри одного сайта).
      // Используется на web для <html lang>. Опции — те же, что admin i18n.supportedLanguages (payload.config.ts).
      options: [
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'English' },
      ],
      defaultValue: 'ru',
    },
    {
      name: 'theme',
      type: 'select',
      label: { ru: 'Тема', en: 'Theme' },
      options: THEMES.map(t => ({ value: t.id, label: t.name })),
      defaultValue: 'default',
      admin: { description: 'Переключение темы — мгновенное (данные). Блоки/варианты, не поддержанные темой, отрисовываются по fallback-варианту.' },
    },
    {
      name: 'contacts',
      type: 'group',
      label: { ru: 'Контакты', en: 'Contacts' },
      fields: [
        { name: 'email', type: 'email', label: { ru: 'Email', en: 'Email' } },
        { name: 'phone', type: 'text', label: { ru: 'Телефон', en: 'Phone' } },
        { name: 'telegram', type: 'text', label: { ru: 'Telegram', en: 'Telegram' } },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      label: { ru: 'Настройки', en: 'Settings' },
      fields: [
        { name: 'smtpHost', type: 'text', label: { ru: 'SMTP хост', en: 'SMTP host' }, access: { read: ({ req: { user } }) => isOwner(user) } },
        { name: 'smtpPort', type: 'number', label: { ru: 'SMTP порт', en: 'SMTP port' }, access: { read: ({ req: { user } }) => isOwner(user) } },
        { name: 'smtpUser', type: 'text', label: { ru: 'SMTP пользователь', en: 'SMTP user' }, access: { read: ({ req: { user } }) => isOwner(user) } },
        {
          name: 'smtpFrom',
          type: 'text',
          label: { ru: 'SMTP отправитель (От кого)', en: 'SMTP sender (From)' },
          admin: {
            description: {
              ru: 'Адрес отправителя писем-уведомлений: noreply@domain.ru или Имя <noreply@domain.ru>. Должен быть разрешён у SMTP-провайдера. Если пусто — используется «SMTP пользователь» (он должен быть email).',
              en: 'Sender address of notification emails: noreply@domain.com or Name <noreply@domain.com>. Must be allowed by the SMTP provider. If empty, "SMTP user" is used (it must be an email).',
            },
          },
          access: { read: ({ req: { user } }) => isOwner(user) },
        },
        {
          name: 'smtpPass',
          type: 'text',
          label: { ru: 'SMTP пароль', en: 'SMTP password' },
          access: { read: ({ req: { user } }) => isOwner(user) },
          hooks: {
            beforeChange: [({ value }) => (value ? encryptField(value) : value)],
            afterRead: [({ value }) => (value ? decryptField(value) : value)],
          },
        },
        { name: 'analyticsId', type: 'text', label: { ru: 'ID Яндекс.Метрики', en: 'Analytics ID' }, admin: { description: 'ID счётчика Яндекс.Метрики (число). Публично читаемо — подставляется в <head> сайта.' } },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      label: { ru: 'Логотип', en: 'Logo' },
      relationTo: 'media',
    },
  ],
  versions: false,
})

/** @deprecated core-реестр на момент импорта; для проектов — makeSites() после registerExtensions */
export const Sites: CollectionConfig = makeSites()
