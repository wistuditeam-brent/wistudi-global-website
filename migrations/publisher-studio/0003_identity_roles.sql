PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS studio_verified_emails (
  email_normalized TEXT PRIMARY KEY,
  studio_user_id TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 1 CHECK (is_primary IN (0,1)),
  FOREIGN KEY (studio_user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS studio_verified_email_user ON studio_verified_emails(studio_user_id);

CREATE TABLE IF NOT EXISTS studio_auth_challenges (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('join','sign_in')),
  display_name TEXT NOT NULL DEFAULT '',
  consent_version TEXT NOT NULL DEFAULT '',
  code_hash TEXT NOT NULL,
  ip_digest TEXT NOT NULL DEFAULT '',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending','sent','failed')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS studio_auth_challenges_email ON studio_auth_challenges(email_normalized, created_at DESC);
CREATE INDEX IF NOT EXISTS studio_auth_challenges_ip ON studio_auth_challenges(ip_digest, created_at DESC);

CREATE TABLE IF NOT EXISTS studio_auth_sessions (
  token_hash TEXT PRIMARY KEY,
  studio_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (studio_user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS studio_auth_sessions_user ON studio_auth_sessions(studio_user_id, expires_at);

CREATE TABLE IF NOT EXISTS studio_auth_identities (
  id TEXT PRIMARY KEY,
  studio_user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  linked_at TEXT NOT NULL,
  unlinked_at TEXT,
  UNIQUE (provider, provider_subject),
  FOREIGN KEY (studio_user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_access_memberships (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL,
  studio_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','withdrawn','suspended')),
  joined_at TEXT NOT NULL,
  withdrawn_at TEXT,
  UNIQUE (studio_id, studio_user_id),
  FOREIGN KEY (studio_user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_membership_consents (
  id TEXT PRIMARY KEY,
  studio_user_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('studio_membership')),
  policy_version TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('grant','withdraw')),
  source TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  FOREIGN KEY (studio_user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS studio_membership_consent_user ON studio_membership_consents(studio_user_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS studio_role_assignments (
  id TEXT PRIMARY KEY,
  studio_user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_super_admin','studio_admin','event_builder','event_lead','event_co_trainer','event_moderator','showcase_reviewer')),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('platform','studio','event')),
  scope_id TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  revoked_by TEXT,
  FOREIGN KEY (studio_user_id) REFERENCES studio_users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES studio_users(id),
  FOREIGN KEY (revoked_by) REFERENCES studio_users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS studio_role_one_active_assignment
  ON studio_role_assignments(studio_user_id, role, scope_type, scope_id)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS studio_role_scope_active
  ON studio_role_assignments(scope_type, scope_id, revoked_at, role);

CREATE TABLE IF NOT EXISTS studio_role_invitations (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_super_admin','studio_admin','event_builder','event_lead','event_co_trainer','event_moderator','showcase_reviewer')),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('platform','studio','event')),
  scope_id TEXT NOT NULL,
  invited_by TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired','revoked')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  accepted_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (invited_by) REFERENCES studio_users(id)
);
CREATE INDEX IF NOT EXISTS studio_role_invite_email_state
  ON studio_role_invitations(email_normalized, status, expires_at);
CREATE INDEX IF NOT EXISTS studio_role_invite_scope
  ON studio_role_invitations(scope_type, scope_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS studio_role_audit (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id TEXT,
  target_email_normalized TEXT,
  role TEXT,
  scope_type TEXT,
  scope_id TEXT,
  invitation_id TEXT,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES studio_users(id),
  FOREIGN KEY (target_user_id) REFERENCES studio_users(id) ON DELETE SET NULL,
  FOREIGN KEY (invitation_id) REFERENCES studio_role_invitations(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS studio_role_audit_time ON studio_role_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS studio_role_audit_scope ON studio_role_audit(scope_type, scope_id, created_at DESC);

INSERT OR IGNORE INTO studio_schema_migrations(version)
VALUES ('0003_identity_roles');
