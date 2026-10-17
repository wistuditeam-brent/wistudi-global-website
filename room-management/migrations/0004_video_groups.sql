CREATE TABLE IF NOT EXISTS room_video_groups (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL,
 locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
 title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS room_video_group_membership (
 content_id TEXT PRIMARY KEY,
 group_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS room_video_groups_listing ON room_video_groups(room_id,locale,sort_order);
CREATE INDEX IF NOT EXISTS room_video_membership_group ON room_video_group_membership(group_id);
