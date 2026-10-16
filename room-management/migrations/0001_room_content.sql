-- Client Room CMS stage 3. Apply to the D1 database bound as ROOM_DB before enabling API.
CREATE TABLE IF NOT EXISTS room_content (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL CHECK(room_id IN ('client','distributor','investor')),
 category TEXT NOT NULL CHECK(category IN ('presentation','video','gallery','document')),
 title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 asset_url TEXT NOT NULL,
 locale TEXT NOT NULL DEFAULT 'en' CHECK(locale IN ('en','vi')),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS room_content_listing ON room_content(room_id,category,locale,status,sort_order);
