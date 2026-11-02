CREATE TABLE IF NOT EXISTS room_sections (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL,
 locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
 slug TEXT NOT NULL,
 title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(room_id,locale,slug)
);
CREATE TABLE IF NOT EXISTS room_section_examples (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL,
 section_id TEXT NOT NULL,
 locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
 content_type TEXT NOT NULL CHECK(content_type IN ('flow','xp_video')),
 title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 topic TEXT NOT NULL DEFAULT '',
 thumbnail_url TEXT NOT NULL DEFAULT '',
 target_url TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS room_sections_listing ON room_sections(room_id,locale,status,sort_order);
CREATE INDEX IF NOT EXISTS room_section_examples_listing ON room_section_examples(room_id,section_id,locale,status,sort_order);
