DROP TABLE IF EXISTS jd_review_findings;
DROP TABLE IF EXISTS jd_reviews;
DROP TABLE IF EXISTS risk_rules;

CREATE TABLE risk_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_code TEXT NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  risk_category TEXT NOT NULL,
  severity TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  positive_patterns TEXT NOT NULL,
  negative_patterns TEXT NOT NULL,
  context_window INTEGER NOT NULL DEFAULT 30,
  base_score REAL NOT NULL DEFAULT 0,
  legal_source_id INTEGER,
  rule_explanation TEXT NOT NULL,
  verification_advice TEXT,
  rule_version TEXT NOT NULL DEFAULT '1.0.0',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_rules_enabled
ON risk_rules(is_enabled);

CREATE INDEX idx_risk_rules_severity
ON risk_rules(severity);

CREATE TABLE jd_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_title TEXT,
  company_name TEXT,
  input_text TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  overall_score REAL NOT NULL DEFAULT 0,
  overall_level TEXT NOT NULL,
  confidence REAL,
  engine_version TEXT NOT NULL,
  processing_time_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jd_reviews_created_at
ON jd_reviews(created_at);

CREATE INDEX idx_jd_reviews_level
ON jd_reviews(overall_level);

CREATE TABLE jd_review_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  rule_id INTEGER,
  legal_source_id INTEGER,
  risk_category TEXT NOT NULL,
  severity TEXT NOT NULL,
  risk_score REAL NOT NULL,
  evidence_text TEXT NOT NULL,
  evidence_start INTEGER,
  evidence_end INTEGER,
  reason TEXT NOT NULL,
  verification_advice TEXT,
  confidence REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jd_review_findings_review
ON jd_review_findings(review_id);

CREATE INDEX idx_jd_review_findings_category
ON jd_review_findings(risk_category);
