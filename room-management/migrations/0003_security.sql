CREATE TABLE IF NOT EXISTS room_login_throttle (
 throttle_key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL DEFAULT 0,
 window_started INTEGER NOT NULL,
 blocked_until INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS room_login_throttle_blocked ON room_login_throttle(blocked_until);

CREATE TABLE IF NOT EXISTS room_management_audit (
 id TEXT PRIMARY KEY,
 actor_manager_id TEXT,
 action TEXT NOT NULL,
 room_id TEXT,
 target_id TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS room_management_audit_created ON room_management_audit(created_at);
