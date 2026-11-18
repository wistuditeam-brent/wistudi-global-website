-- Private PDF signing. New tables only; also applied idempotently by the signing API.

CREATE TABLE IF NOT EXISTS room_signing_documents (id TEXT PRIMARY KEY, room_id TEXT NOT NULL DEFAULT 'client', title TEXT NOT NULL, filename TEXT NOT NULL, total_bytes INTEGER NOT NULL, chunk_size INTEGER NOT NULL, pages_json TEXT NOT NULL, created_by TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', file_ready INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, edit_token TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS room_signing_parties (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'signer', link_hash TEXT UNIQUE, link_version INTEGER NOT NULL DEFAULT 0, code_salt TEXT, code_hash TEXT, revoked_at TEXT, signed_at TEXT, revision INTEGER NOT NULL DEFAULT 0, edit_token TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS room_signing_fields (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT NOT NULL REFERENCES room_signing_parties(id), page INTEGER NOT NULL, x REAL NOT NULL, y REAL NOT NULL, width REAL NOT NULL, height REAL NOT NULL, signature_key TEXT);

CREATE TABLE IF NOT EXISTS room_signing_parts (document_id TEXT NOT NULL REFERENCES room_signing_documents(id), part INTEGER NOT NULL, bytes INTEGER NOT NULL, PRIMARY KEY(document_id,part));

CREATE TABLE IF NOT EXISTS room_signing_sessions (token_hash TEXT PRIMARY KEY, party_id TEXT NOT NULL REFERENCES room_signing_parties(id), link_version INTEGER NOT NULL, expires_at INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS room_signing_throttle (throttle_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, blocked_until INTEGER NOT NULL, window_started INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS room_signing_events (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT, actor TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS room_signing_parties_document ON room_signing_parties(document_id);

CREATE INDEX IF NOT EXISTS room_signing_fields_document ON room_signing_fields(document_id);

CREATE INDEX IF NOT EXISTS room_signing_events_document ON room_signing_events(document_id,created_at);

CREATE INDEX IF NOT EXISTS room_signing_sessions_expiry ON room_signing_sessions(expires_at);
