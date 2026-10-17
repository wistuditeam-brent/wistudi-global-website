CREATE TABLE IF NOT EXISTS room_content_translation_links (
 group_id TEXT NOT NULL,
 content_id TEXT NOT NULL UNIQUE,
 locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(group_id,locale)
);
CREATE INDEX IF NOT EXISTS room_content_translation_group ON room_content_translation_links(group_id);
