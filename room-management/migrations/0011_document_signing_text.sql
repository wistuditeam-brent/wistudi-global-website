-- Plain text fields share the signer revision and submission lock.
CREATE TABLE IF NOT EXISTS room_signing_text_fields (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT NOT NULL REFERENCES room_signing_parties(id), page INTEGER NOT NULL, x REAL NOT NULL, y REAL NOT NULL, width REAL NOT NULL, height REAL NOT NULL, text_value TEXT NOT NULL DEFAULT '', font_size REAL NOT NULL DEFAULT 12);
CREATE INDEX IF NOT EXISTS room_signing_text_fields_party ON room_signing_text_fields(document_id,party_id);
