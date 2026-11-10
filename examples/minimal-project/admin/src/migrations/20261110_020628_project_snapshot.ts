import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// Только снимок схемы (.json), SQL не нужен. Core-миграция 20261110_015245_smtp_from_field
// сортируется позже проектной `_cases` и её снапшот не знает о проектных коллекциях, поэтому
// drift-check (`migrate:generate` после `migrations:sync`) видел бы «дрейф». Этот снимок =
// core + проект; поля `smtpFrom` уже добавлены core-миграцией, `cases` — миграцией `_cases`.
export async function up(_args: MigrateUpArgs): Promise<void> {}

export async function down(_args: MigrateDownArgs): Promise<void> {}
