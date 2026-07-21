DROP TABLE IF EXISTS legal_sources;
DROP TABLE IF EXISTS rights_guides;

CREATE TABLE legal_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  document_number TEXT,
  article_number TEXT,
  source_type TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  published_date TEXT,
  effective_date TEXT,
  retrieved_at TEXT NOT NULL,
  citation_text TEXT,
  content_hash TEXT,
  source_status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_legal_sources_status
ON legal_sources(source_status);

CREATE INDEX idx_legal_sources_type
ON legal_sources(source_type);

CREATE TABLE rights_guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guide_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  applicability_note TEXT NOT NULL,
  first_action TEXT NOT NULL,
  evidence_items TEXT NOT NULL,
  action_steps TEXT NOT NULL,
  official_channels TEXT NOT NULL,
  caution_text TEXT NOT NULL,
  source_reviewed_at TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending',
  is_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rights_guides_enabled
ON rights_guides(is_enabled);

CREATE INDEX idx_rights_guides_review_status
ON rights_guides(review_status);

CREATE INDEX idx_rights_guides_risk_level
ON rights_guides(risk_level);
