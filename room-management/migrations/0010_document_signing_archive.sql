-- Archive agreements without changing signatures, links or signing history.
CREATE TABLE IF NOT EXISTS room_signing_document_states (document_id TEXT PRIMARY KEY REFERENCES room_signing_documents(id), archived_at TEXT);
