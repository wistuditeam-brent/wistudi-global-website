CREATE TABLE IF NOT EXISTS room_partners (
 id TEXT PRIMARY KEY,room_id TEXT NOT NULL,locale TEXT NOT NULL,title TEXT NOT NULL,slug TEXT NOT NULL,
 short_description TEXT NOT NULL DEFAULT '',banner_url TEXT NOT NULL,video_url TEXT NOT NULL DEFAULT '',
 about_text TEXT NOT NULL DEFAULT '',capability_bullets TEXT NOT NULL DEFAULT '[]',website_url TEXT NOT NULL DEFAULT '',
 tags TEXT NOT NULL DEFAULT '[]',gallery_urls TEXT NOT NULL DEFAULT '[]',status TEXT NOT NULL DEFAULT 'draft',
 sort_order INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(room_id,locale,slug)
);
CREATE TABLE IF NOT EXISTS room_partner_settings (
 room_id TEXT NOT NULL,locale TEXT NOT NULL,title TEXT NOT NULL,intro TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(room_id,locale)
);
CREATE TABLE IF NOT EXISTS room_contact_settings (
 room_id TEXT NOT NULL,locale TEXT NOT NULL,title TEXT NOT NULL,intro TEXT NOT NULL DEFAULT '',business_address TEXT NOT NULL DEFAULT '',
 primary_email TEXT NOT NULL DEFAULT '',secondary_email TEXT NOT NULL DEFAULT '',primary_phone TEXT NOT NULL DEFAULT '',
 facebook_url TEXT NOT NULL DEFAULT '',linkedin_url TEXT NOT NULL DEFAULT '',website_url TEXT NOT NULL DEFAULT '',
 extra_contacts TEXT NOT NULL DEFAULT '[]',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(room_id,locale)
);
CREATE INDEX IF NOT EXISTS room_partners_listing ON room_partners(room_id,locale,status,sort_order);
