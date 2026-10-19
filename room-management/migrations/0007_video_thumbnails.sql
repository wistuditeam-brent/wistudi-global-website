CREATE TABLE IF NOT EXISTS room_video_thumbnails (
 target_type TEXT NOT NULL CHECK(target_type IN ('content','partner')),
 target_id TEXT NOT NULL,
 thumbnail_url TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(target_type,target_id)
);
