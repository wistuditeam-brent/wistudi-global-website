CREATE TABLE IF NOT EXISTS room_managers (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE,
 password_salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS room_manager_permissions (
 manager_id TEXT NOT NULL REFERENCES room_managers(id) ON DELETE CASCADE,
 room_id TEXT NOT NULL CHECK(room_id IN ('client','distributor','investor')),
 role TEXT NOT NULL CHECK(role IN ('editor','admin')),
 PRIMARY KEY(manager_id,room_id)
);
CREATE TABLE IF NOT EXISTS room_manager_sessions (
 id TEXT PRIMARY KEY,
 manager_id TEXT NOT NULL REFERENCES room_managers(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS room_manager_sessions_expiry ON room_manager_sessions(expires_at);
