import * as migration_20260922_173634_init_sites_media_users from './20260922_173634_init_sites_media_users';
import * as migration_20260923_053127 from './20260923_053127';
import * as migration_20260923_162124_t9_blocks from './20260923_162124_t9_blocks';
import * as migration_20260923_180309_t10_blocks from './20260923_180309_t10_blocks';
import * as migration_20260923_185801_t11_blocks from './20260923_185801_t11_blocks';
import * as migration_20260924_025145 from './20260924_025145';
import * as migration_20260924_035646 from './20260924_035646';
import * as migration_20260924_070111 from './20260924_070111';
import * as migration_20260926_085712 from './20260926_085712';
import * as migration_20260926_105237 from './20260926_105237';
import * as migration_20260926_180447_i18n_labels_site_locale from './20260926_180447_i18n_labels_site_locale';
import * as migration_20260927_073049_contact_hours_field from './20260927_073049_contact_hours_field';
import * as migration_20260927_083223_lexical_richtext_html from './20260927_083223_lexical_richtext_html';
import * as migration_20261013_180050_media_image_sizes from './20261013_180050_media_image_sizes';
import * as migration_20261013_182430_scheduled_publish from './20261013_182430_scheduled_publish';
import * as migration_20261110_015245_smtp_from_field from './20261110_015245_smtp_from_field';

export const migrations = [
  {
    up: migration_20260922_173634_init_sites_media_users.up,
    down: migration_20260922_173634_init_sites_media_users.down,
    name: '20260922_173634_init_sites_media_users',
  },
  {
    up: migration_20260923_053127.up,
    down: migration_20260923_053127.down,
    name: '20260923_053127',
  },
  {
    up: migration_20260923_162124_t9_blocks.up,
    down: migration_20260923_162124_t9_blocks.down,
    name: '20260923_162124_t9_blocks',
  },
  {
    up: migration_20260923_180309_t10_blocks.up,
    down: migration_20260923_180309_t10_blocks.down,
    name: '20260923_180309_t10_blocks',
  },
  {
    up: migration_20260923_185801_t11_blocks.up,
    down: migration_20260923_185801_t11_blocks.down,
    name: '20260923_185801_t11_blocks',
  },
  {
    up: migration_20260924_025145.up,
    down: migration_20260924_025145.down,
    name: '20260924_025145',
  },
  {
    up: migration_20260924_035646.up,
    down: migration_20260924_035646.down,
    name: '20260924_035646',
  },
  {
    up: migration_20260924_070111.up,
    down: migration_20260924_070111.down,
    name: '20260924_070111',
  },
  {
    up: migration_20260926_085712.up,
    down: migration_20260926_085712.down,
    name: '20260926_085712',
  },
  {
    up: migration_20260926_105237.up,
    down: migration_20260926_105237.down,
    name: '20260926_105237',
  },
  {
    up: migration_20260926_180447_i18n_labels_site_locale.up,
    down: migration_20260926_180447_i18n_labels_site_locale.down,
    name: '20260926_180447_i18n_labels_site_locale',
  },
  {
    up: migration_20260927_073049_contact_hours_field.up,
    down: migration_20260927_073049_contact_hours_field.down,
    name: '20260927_073049_contact_hours_field',
  },
  {
    up: migration_20260927_083223_lexical_richtext_html.up,
    down: migration_20260927_083223_lexical_richtext_html.down,
    name: '20260927_083223_lexical_richtext_html',
  },
  {
    up: migration_20261013_180050_media_image_sizes.up,
    down: migration_20261013_180050_media_image_sizes.down,
    name: '20261013_180050_media_image_sizes',
  },
  {
    up: migration_20261013_182430_scheduled_publish.up,
    down: migration_20261013_182430_scheduled_publish.down,
    name: '20261013_182430_scheduled_publish',
  },
  {
    up: migration_20261110_015245_smtp_from_field.up,
    down: migration_20261110_015245_smtp_from_field.down,
    name: '20261110_015245_smtp_from_field'
  },
];
