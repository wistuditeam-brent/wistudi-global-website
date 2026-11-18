-- Append-only preparer text versions and separate per-party approvals.
-- No existing document, signature, link or timestamp is rewritten.
CREATE TABLE IF NOT EXISTS room_signing_document_text_versions (document_id TEXT NOT NULL REFERENCES room_signing_documents(id), revision INTEGER NOT NULL, fields_json TEXT NOT NULL, changes_json TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(document_id,revision));
CREATE TABLE IF NOT EXISTS room_signing_document_text_approvals (document_id TEXT NOT NULL REFERENCES room_signing_documents(id), revision INTEGER NOT NULL, party_id TEXT NOT NULL, actor TEXT NOT NULL, approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(document_id,revision,party_id));
