PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS studio_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  avatar_seed TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS studio_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS studio_memberships (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES studio_workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_apps (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  app_key TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, app_key),
  FOREIGN KEY (workspace_id) REFERENCES studio_workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  subject TEXT,
  topic TEXT,
  level TEXT,
  audience TEXT,
  trainer TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  duration_minutes INTEGER,
  format TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','upcoming','live','post_session','cancelled')),
  banner_url TEXT,
  meeting_url TEXT,
  meeting_mode TEXT,
  output TEXT,
  learning_outcomes_json TEXT NOT NULL DEFAULT '[]',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, slug),
  FOREIGN KEY (workspace_id) REFERENCES studio_workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES studio_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_events_workspace_start
  ON studio_events(workspace_id, starts_at);

CREATE TABLE IF NOT EXISTS studio_event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT,
  display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled')),
  consent_to_studio INTEGER NOT NULL DEFAULT 0 CHECK (consent_to_studio IN (0,1)),
  registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES studio_events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES studio_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS studio_challenges (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES studio_events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_resources (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('template','worksheet','guide','link','file')),
  label TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  available_from TEXT NOT NULL DEFAULT 'upcoming' CHECK (available_from IN ('upcoming','live','post_session')),
  public_preview INTEGER NOT NULL DEFAULT 0 CHECK (public_preview IN (0,1)),
  content_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES studio_events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_questions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  event_id TEXT,
  context_id TEXT NOT NULL,
  context_type TEXT NOT NULL,
  author_user_id TEXT,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  answer TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','hidden')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES studio_workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES studio_events(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES studio_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_questions_context
  ON studio_questions(context_id, created_at);

CREATE TABLE IF NOT EXISTS studio_question_votes (
  question_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id, user_id),
  FOREIGN KEY (question_id) REFERENCES studio_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_threads (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  event_id TEXT,
  context_id TEXT NOT NULL,
  context_type TEXT NOT NULL,
  author_user_id TEXT,
  author_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('idea','need_help','can_help','made_something')),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  related_context_ids_json TEXT NOT NULL DEFAULT '[]',
  related_items_json TEXT NOT NULL DEFAULT '[]',
  attachments_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','locked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES studio_workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES studio_events(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES studio_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_threads_context
  ON studio_threads(context_id, created_at);

CREATE TABLE IF NOT EXISTS studio_thread_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  author_user_id TEXT,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES studio_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES studio_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS studio_thread_reactions (
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reaction TEXT NOT NULL DEFAULT 'heart',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id, reaction),
  FOREIGN KEY (thread_id) REFERENCES studio_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_submissions (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL,
  author_user_id TEXT,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  help_text TEXT NOT NULL DEFAULT '',
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  moderation_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challenge_id) REFERENCES studio_challenges(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES studio_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS studio_calendar_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  owner_user_id TEXT,
  linked_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT,
  meeting_url TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  all_day INTEGER NOT NULL DEFAULT 0 CHECK (all_day IN (0,1)),
  visibility TEXT NOT NULL DEFAULT 'workspace' CHECK (visibility IN ('private','workspace')),
  recurrence_rule TEXT,
  color_key TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','tentative','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES studio_workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_user_id) REFERENCES studio_users(id) ON DELETE SET NULL,
  FOREIGN KEY (linked_event_id) REFERENCES studio_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_calendar_workspace_start
  ON studio_calendar_events(workspace_id, starts_at);

CREATE TABLE IF NOT EXISTS studio_calendar_attendees (
  calendar_event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  response_status TEXT NOT NULL DEFAULT 'needs_action' CHECK (response_status IN ('needs_action','accepted','declined','tentative')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (calendar_event_id, user_id),
  FOREIGN KEY (calendar_event_id) REFERENCES studio_calendar_events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES studio_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS studio_schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO studio_schema_migrations(version)
VALUES ('0001_core');
