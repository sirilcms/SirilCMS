# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/), версии — теги `vX.Y.Z` (публикуются в GHCR через `.github/workflows/ci.yml`, см. [docs/roadmap.md](docs/roadmap.md)).

**Как вести этот файл:** любое изменение, которое требует от оператора ручного действия при обновлении (новая обязательная переменная в `.env`, ручной SQL, переименование volume/сервиса в compose, несовместимое изменение API) — помечать блоком `⚠ Breaking / ручные шаги` в записи версии, с конкретной командой или шагом, который нужно выполнить. Обычные фичи и фиксы — под `Added`/`Changed`/`Fixed`/`Security`. Процедура обновления сервера — [docs/runbooks/prod.md §4.1](docs/runbooks/prod.md).

## [Unreleased]

### ⚠ Breaking / ручные шаги
- **Применить миграцию** `20261110_015245_smtp_from_field` (новая колонка `sites.settings_smtp_from`): `pnpm --filter <admin-проект> migrate` (в клиентских проектах — `pnpm migrate` после обновления `@sirilcms/admin`). Колонка nullable, данные не меняются. Обратная совместимость: при пустом «SMTP отправитель» отправитель по-прежнему берётся из «SMTP пользователь» — но теперь он обязан быть email, иначе заявка получит статус `failed` в `notifications` вместо попытки отправки. SMTP-провайдеры, где логин — не email (Yandex Cloud Postbox: `ajes7…`), требуют заполнить новое поле.
- Клиентские проекты (`create-siril`) со своим prod-compose/хостингом: в окружение web-контейнера добавить `NUXT_PURGE_TOKEN=<тот же PURGE_TOKEN, что у admin>` (и `NUXT_PAYLOAD_URL`, если админка не на запечённом при сборке адресе). Проверка — `docs/runbooks/prod.md` §2.3. Стек движка (`infra/docker-compose.prod.yml`) ручных шагов не требует: обновите файл и `make -C infra up`.

### Added
- `@sirilcms/admin`: поле «SMTP отправитель (От кого)» (`sites.settings.smtpFrom`) в Sites → Настройки — адрес `noreply@domain.ru` или `Имя <noreply@domain.ru>`, должен быть разрешён у SMTP-провайдера. Читает только owner (как остальные smtp-поля).

### Fixed
- `@sirilcms/admin`: SMTP-уведомления о заявках падали с `550 5.0.0 Empty envelope senders not allowed` (Yandex Cloud Postbox и др.), если «SMTP пользователь» не email или пуст — отправитель брался только из него. Теперь `from = smtpFrom || smtpUser`; если результат пуст или не похож на email, письмо не отправляется, а в `notifications` пишется `failed` с понятной ошибкой («не задан адрес отправителя (SMTP отправитель)»). Для порта 465 включён `secure: true` (implicit TLS).
- Prod: публикация не сбрасывала HTML-кэш сайта — purge из admin получал 401, обновления появлялись только через 5 мин TTL. Собранный web (`.output`) на рантайме перекрывает `runtimeConfig` только из `NUXT_`-переменных, а prod-compose передавал ему голый `PURGE_TOKEN`, так что web оставался с build-time `dev-purge-token` (и принимал его от кого угодно). `infra/docker-compose.prod.yml` теперь задаёт web `NUXT_PURGE_TOKEN: ${PURGE_TOKEN}` и `NUXT_PAYLOAD_URL: http://admin:3001`; задокументировано в `.env.example`, `docs/runbooks/prod.md` §2.3 и в шаблоне проекта (`.env.example`, `docker/web.Dockerfile`, README). Регрессия ловится `scripts/check-prod-compose-env.mjs` (в `pnpm lint`) и runtime-smoke собранного web в CI (`scripts/check-web-runtime-env.mjs`).

## [0.7.3] — 2026-10-15

### Fixed
- `@sirilcms/admin`: коллекция `categories` читается публично (`access.read: () => true`, раньше — только авторизованным). Анонимный web при чтении постов с `depth=1` получал вместо рубрики голый id — имя категории на карточках поста и фильтр блога в клиентских проектах не работали. Создание/изменение/удаление — по-прежнему только авторизованным. Схема не менялась, миграция не нужна.

## [0.7.2] — 2026-10-15

### Fixed
- `scripts/build-packages.mjs` (`pnpm build:packages`): сборка пакетов идемпотентна — межпроцессная блокировка + отметка по хешу исходников, инструменты запускаются напрямую (не через `pnpm --filter … build`, который мог рекурсивно запустить `pnpm install`). Исправляет плавающее падение сборки Docker-образов и CI при `pnpm install` (`ENOENT … .d.vue.ts`: параллельные postinstall'ы собирали пакеты одновременно) — так упал `Publish web image` на теге v0.7.1 (перезапуск прошёл).

## [0.7.1] — 2026-10-15

### Changed
- `pnpm build:packages` — `scripts/build-packages.mjs` с межпроцессной блокировкой: параллельные postinstall'ы web-приложений при `pnpm install` больше не собирают пакеты одновременно (гонка по `dist`).
- Подпись блока в редакторе страниц — `name` из контракта (раньше Payload выводил её из `slug`: «Dev Intro»).
- Шаблон проекта: `migrate:generate` сам правит импорт типов в сгенерированных миграциях (`admin/scripts/fix-migration-imports.mjs`) — Payload генерирует `import { MigrateUpArgs, … }`, на котором `migrate` падает.

### Fixed
- `@sirilcms/web`: приложение не гидрировалось в браузере (меню, копирование, подсветка аннотаций не работали, SSR при этом был в порядке) — Nuxt подхватывал `dist/runtime/**/plugins/*.d.ts` как плагин («does not provide an export named default»). После сборки декларации внутри `dist/runtime` удаляются (`packages/web/scripts/clean-runtime-dts.mjs`). Найдено на пилотном проекте в браузере; в CI добавлена проверка отсутствия `.d.ts` в runtime.

## [0.7.0] — 2026-10-14

### Added
- **`@sirilcms/create-siril`** — генератор проекта на движке: `npx @sirilcms/create-siril <name> [--git]` создаёт репозиторий из `templates/project` (admin + web + `siril.extensions.ts`, CI, Dockerfile'ы, README). Версия генератора = версия движка (lockstep); `--engine-source <dir>` ставит движок из локальных tgz (проверка до публикации). Шаблон не содержит демо-контента.
- CI-джоб **Template freshness**: scaffold из текущего коммита → установка упакованных пакетов (как у потребителя вне монорепо) → `setup`, typecheck, build, migrate, drift-check, запуск admin+web, `scripts/verify-scaffold.mjs`. `scripts/check-template-sync.mjs` (в `pnpm lint`) держит обвязку шаблона и `examples/minimal-project` идентичными.

### Fixed
- `@sirilcms/web` (найдено проверкой scaffold-проекта): в собранном пакете не работали auto-imports в `node_modules` — сервер падал `defineNitroPlugin/readBody is not defined`, страницы отдавали 500. Серверный runtime теперь импортирует из `#imports` явно, app-часть включена в `imports.transform.include`.

## [0.6.0] — 2026-10-14

### Fixed
- **Пакеты `@sirilcms/web` и `@sirilcms/admin` теперь компилируются и публикуются как `dist/`** (раньше — исходники TS: версия 0.5.0 не работала у потребителя вне монорепо — Payload CLI отказывался грузить TS из `node_modules`, Nitro не транспилировал серверные роуты, `next build` падал на type-check). `@sirilcms/admin` больше не импортирует типы из `apps/reference-admin/payload-types` (свои структурные типы в `src/types/payload-shapes.ts`). Проверено установкой из `pnpm pack`-tarball'ов в проект вне монорепо: `migrations:sync`, `generate:importmap`, `typecheck`, `next build`, `nuxt build`.

### ⚠ Breaking / ручные шаги
- Сборка пакетов обязательна перед использованием в монорепо: `pnpm install` делает это сам (`prepare`/`postinstall`), после правок в `packages/{web,admin,contracts}` запускайте `pnpm build:packages`. `importMap.baseDir` у приложений на движке теперь указывает на `…/@sirilcms/admin/dist` (не `src`) — перегенерируйте `importMap.js` (`generate:importmap`).
- `siril-migrations-sync` копирует теперь скомпилированные `.js`/`.json` core-миграций (раньше `.ts`): в проекте, обновляющемся с 0.5.0, после `migrations:sync` в каталоге миграций окажутся обе версии одних и тех же миграций — удалите старые `.ts`-копии core-миграций.

## [0.5.0] — 2026-10-14

### Security
- Prod-compose: `PAYLOAD_URL` админки = `https://admin.${SITE_DOMAIN}` (раньше брался dev-дефолт из `.env` → save/publish за прокси мог молча падать на CSRF-проверке). Заходить в админку нужно по этому домену.
- **users: любой залогиненный пользователь мог менять любые записи `users`** (в т.ч. поставить себе `role: owner`). Теперь `update` — owner для всех, остальные только себя; поля `role`/`site` меняет только owner.
- Блокировка логина после 5 неудачных попыток на 10 минут (встроенный lockout Payload).
- `/api/purge`: constant-time сравнение токена, лимит 10 неудачных попыток/мин на IP (429).
- Prod: анонимная самрегистрация первого пользователя отключена (`DISABLE_FIRST_USER_SIGNUP=true`), первый owner создаётся из `INITIAL_OWNER_EMAIL`/`INITIAL_OWNER_PASSWORD`.

### Fixed
- `@sirilcms/web`: блоки и темы **проекта** (`app/blocks/<type>/<Variant>.vue`, `themes/<id>/tokens.css`) не подхватывались — `import.meta.glob` в сгенерированном модуле резолвился в пустой объект (Nuxt 4), блок рендерился заглушкой. Теперь модуль сканирует каталоги проекта и встраивает абсолютные импорты; добавление/удаление файла в dev пересобирает шаблоны.
- Rich-text: relationship-embed (вставка связанного документа в текст) рендерился на публичном сайте буквальным текстом «unknown node». Фича убрана из редактора (`sirilEditor()` в `@sirilcms/admin`, reference-admin его использует). Проверено вживую: upload-картинки, ссылки (`javascript:` → `#`), списки/чек-листы, quote, hr, форматирование, выравнивание и экранирование HTML рендерятся корректно.

### Added
- Релизный инструментарий движка: `scripts/release.mjs` (lockstep-бамп `@sirilcms/{contracts,web,admin}`, перенос `[Unreleased]` в CHANGELOG, коммит и тег; не пушит), workflow `publish-packages.yml` (по тегу `vX.Y.Z` публикует пакеты; ручной запуск — dry-run), runbook [docs/runbooks/release.md](docs/runbooks/release.md). Пакеты больше не `private`, имеют `files`/`publishConfig`; `web` и `admin` публикуются как TS-исходники.
- Документация для разработчиков проектов на движке: [docs/extension-api.md](docs/extension-api.md) (стабильное/нестабильное API, блок/тема/коллекция по шагам, миграции, обновление) и [docs/compat.md](docs/compat.md) (таблица совместимости). `scripts/check-no-core-copies.mjs` (в `pnpm lint`) запрещает идентичные копии core-файлов в проекте.
- `examples/minimal-project` — эталонный проект на движке: блок `cases` (контракт + Vue-компонент), тема `client` (ThemeDef + `tokens.css`), своя коллекция `cases`, проектная серия миграций. `examples/minimal-project/scripts/verify.mjs` и CI-джоб «Example project» проверяют сквозной сценарий admin → web на собранных (`next build` / `nuxt build`) приложениях.
- `@sirilcms/admin`: бинарь `siril-migrations-sync` — копирует core-миграции из пакета в каталог миграций проекта (идемпотентно, файлы проекта не трогает).
- Extension API подключён: `sirilAdminConfig({ blocks, themes })` (admin) и опции Nuxt-модуля `siril: { blocks, themes }` (web) регистрируют блоки/темы проекта до сборки коллекций и до рендера. `makeSites()` — фабрика коллекции `sites` (select тем из активного реестра); `Sites` оставлен для совместимости.
- `@sirilcms/contracts`: `registerExtensions({ blocks, themes })` / `resetExtensions()` — подключение блоков и тем проекта к активному реестру (`BLOCKS`/`THEMES`/`getBlock`/`getTheme`); `CORE_BLOCKS`/`CORE_THEMES` — неизменяемые core-списки. Core-темы по умолчанию включают новые блоки проекта.
- Отложенная публикация страниц и постов: в админке рядом с «Опубликовать» — планирование на дату/время. Исполняется очередью Payload jobs (`autoRun` раз в минуту в процессе admin), публикация чистит кэш сайта как обычная. Точность — до минуты.
- Оптимизация изображений при загрузке: оригинал ужимается до 2560px, генерируются WebP-размеры `sm` 480w / `md` 960w / `lg` 1600w (`sharp`). Блоки/посты берут размер по роли картинки (`mediaUrl(media, 'sm'|'md'|'lg')`); OG-изображения остаются оригиналом. Старые загрузки без размеров отдаются как раньше (фолбэк).
- `infra/scripts/restore-check.sh` / `make -C infra restore-check` — проверка восстановления дампа в одноразовом postgres.
- `scripts/check-payload-versions.mjs` (в `pnpm lint`): все `payload`/`@payloadcms/*` — одна точная версия.

### Changed
- `mergeBlockRegistry` теперь работает с массивами `BlockDef[]` (override по `type`); раньше принимал `Record` и ломался на массиве `BLOCKS`. `SirilModuleOptions.blocks` — `BlockDef[]`.
- `@payloadcms/*` и `payload` запинены на `3.90.1` (убрана вторая копия `@payloadcms/translations@3.90.2`).

### ⚠ Breaking / ручные шаги
- **Переименование scope `@siril/*` → `@sirilcms/*`** и перенос репозитория в организацию `sirilcms` (имя `siril` занято на GitHub и npm). Проекты на движке меняют импорты и зависимости на `@sirilcms/contracts|web|admin`. Образы GHCR теперь публикуются как `ghcr.io/sirilcms/sirilcms-{admin,web,admin-migrate}`: на **существующих серверах** обновите `image:` в `infra/docker-compose.prod.yml` (новые теги появятся только по новому пути; старые образы `ghcr.io/ildussiraev/…` остаются, но не обновляются).
- Миграция `scheduled_publish` добавляет таблицы `payload_jobs*` (применяется сервисом `migrate`). Проекты на `@sirilcms/admin` должны включить `jobs.autoRun` в своём `payload.config.ts` (см. reference-admin), иначе запланированные публикации не исполнятся.
- Миграция `media_image_sizes` (только добавляет колонки) применяется автоматически сервисом `migrate`. Уже загруженные картинки размеров не получат — перезагрузите нужные файлы, если хотите оптимизацию для них.
- Существующим prod-установкам: если owner уже создан — ничего делать не нужно. Для новых установок `init-env.sh` принимает второй аргумент `<owner-email>`; без него впишите `INITIAL_OWNER_EMAIL`/`INITIAL_OWNER_PASSWORD` в `.env` вручную.

### Added
- Процедура обновления (бэкап → `IMAGE_TAG` → `pull`/`up`, откат при упавшей миграции) — [docs/runbooks/prod.md §4.1](docs/runbooks/prod.md).
- Платформа «движок + кастомизация» (spec [2026-09-27](docs/superpowers/specs/2026-09-27-siril-engine-platform-design.md)): `@sirilcms/blocks-definitions` → `@sirilcms/contracts` (SSOT: контракты блоков/тем/форм-полей, +unbuild dist); новые пакеты `@sirilcms/web` (Nuxt-модуль: runtime UI `src/runtime/app` + темы + server middleware/кэш/purge-API) и `@sirilcms/admin` (Payload-экстензия: `sirilAdminConfig`, collections/endpoints/access/admin-ui + канонические миграции); `apps/*` — тонкие референс-приложения `@sirilcms/reference-web` (:3000, `nuxt build`) и `@sirilcms/reference-admin` (:3001, `next build`).
- Merge-примитивы: `mergeBlockRegistry`, `mergeThemeRegistry` (`@sirilcms/contracts`) — project-overlay блоков/тем (проект сильнее модуля).

### Changed
- Lockstep-версия пакетов: 0.1.0.
- Миграции Payload канонизированы в `packages/admin/src/migrations` — явным `postgresAdapter({ migrationDir })` в `apps/reference-admin/payload.config.ts` (дефолтный каталог Payload — относительный CWD, а это не workspace-root).

### ⚠ Breaking / ручные шаги
- Оператору действий не требуется: docker-образы пересобраны, one-shot-сервис `migrate` по-прежнему выполняет `pnpm --filter @sirilcms/reference-admin migrate` по тем же `packages/admin/src/migrations`, схема БД в этом релизе не изменилась.

## [0.2.0] — 2026-09-26

### Changed
- Prod-compose (`infra/docker-compose.prod.yml`) переведён с `build:` на `image:` — `admin`/`web`/`migrate` тянутся готовыми из GHCR (`ghcr.io/ildussiraev/sirilcms-{admin,web,admin-migrate}`), версия — переменная `IMAGE_TAG` в `.env` (default `latest`). `make -C infra up` больше не собирает образы, только `--pull always`.
- Добавлен отдельный образ `admin-migrate` (стадия `build` того же `admin.Dockerfile`) — рантайм-образ `admin` собран как Next.js standalone и не содержит Payload CLI/миграций, поэтому сервис `migrate` использует отдельный, более тяжёлый образ.

### ⚠ Breaking / ручные шаги
- Существующим прод-серверам на сборке из исходников: сервер должен иметь сетевой доступ к `ghcr.io` (публичный registry, авторизация не нужна). Первый `make -C infra up` после обновления скачает три образа (`admin`, `web`, `admin-migrate`) — заметно дольше обычного рестарта.
- В `.env` можно (не обязательно) задать `IMAGE_TAG` — без него используется `latest`.

## [0.1.0] — 2026-09-26

Первый релиз.

### Added
- Конструктор страниц: 14 типов блоков (hero, текст+изображение, возможности, тарифы, галерея, FAQ, отзывы, команда, портфолио, CTA, контакты, список/сетка постов, форма) с вариантами компоновки, единый источник правды контрактов — `@siril/blocks-definitions`.
- Темы `default`/`mono`, переключение в админке без деплоя, fallback для неподдерживаемых блоков/вариантов.
- Конструктор форм (поля text…honeypot/consent), приём заявок с rate-limit, email/Telegram-уведомления, CSV-экспорт.
- Контент: страницы, блог (посты + категории), медиа-библиотека, SEO-поля, sitemap.xml/robots.txt.
- Роли `owner`/`editor` (editor ограничен своим сайтом), self-register первого пользователя всегда как `owner`.
- SSR-кэш публичных страниц (5 мин) с авто-purge при публикации.
- i18n админки (RU/EN).
- CI: lint, typecheck, test, проверка миграций (apply + drift), сборка, публикация образов в GHCR по тегу.
- Docker-деплой: `docker-compose.prod.yml`, Caddy (TLS), Makefile, скрипт бэкапа БД.

### Security
- Первый user в пустой БД принудительно получает роль `owner`, что бы ни пришло в запросе — закрывает гонку «кто первый зарегистрировался, тот и admin, но не обязательно owner».
- `pages`/`posts` read-доступ у `editor` ограничен по сайту пользователя, а не по данным документа (было — уязвимость, позволявшая читать чужой сайт при подмене поля).
- `smtpPass` шифруется at rest.
