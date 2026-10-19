CREATE TABLE IF NOT EXISTS room_content_tombstones (
 room_id TEXT NOT NULL,
 content_id TEXT NOT NULL,
 deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(room_id,content_id)
);
