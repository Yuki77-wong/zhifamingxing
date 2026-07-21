DROP TABLE IF EXISTS contract_review_findings;
DROP TABLE IF EXISTS contract_reviews;
DROP TABLE IF EXISTS contract_rules;

CREATE TABLE contract_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_title TEXT,
  contract_text TEXT NOT NULL,
  overall_score REAL NOT NULL DEFAULT 0,
  overall_level TEXT NOT NULL DEFAULT 'low',
  confidence REAL NOT NULL DEFAULT 0,
  engine_version TEXT NOT NULL,
  finding_count INTEGER NOT NULL DEFAULT 0,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_reviews_created_at
ON contract_reviews(created_at);

CREATE INDEX idx_contract_reviews_overall_level
ON contract_reviews(overall_level);

CREATE TABLE contract_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_code TEXT NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  risk_category TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score REAL NOT NULL DEFAULT 0,
  match_type TEXT NOT NULL DEFAULT 'hybrid',
  patterns TEXT NOT NULL,
  negative_patterns TEXT,
  reason TEXT NOT NULL,
  advice TEXT NOT NULL,
  legal_source_id INTEGER NOT NULL,
  applicability_note TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_rules_review_enabled
ON contract_rules(review_status, is_enabled);

CREATE INDEX idx_contract_rules_risk_level
ON contract_rules(risk_level);

CREATE INDEX idx_contract_rules_legal_source
ON contract_rules(legal_source_id);

CREATE TABLE contract_review_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  rule_id INTEGER NOT NULL,
  risk_category TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score REAL NOT NULL,
  matched_text TEXT NOT NULL,
  evidence_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  advice TEXT NOT NULL,
  legal_source_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_findings_review
ON contract_review_findings(review_id);

CREATE INDEX idx_contract_findings_rule
ON contract_review_findings(rule_id);

CREATE INDEX idx_contract_findings_category
ON contract_review_findings(risk_category);

CREATE INDEX idx_contract_findings_legal_source
ON contract_review_findings(legal_source_id);
