CREATE TABLE IF NOT EXISTS price_capture_justtcg_runs (
  run_id TEXT PRIMARY KEY,
  capture_mode TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  updated_after TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  card_count INTEGER NOT NULL DEFAULT 0,
  verified_limit INTEGER,
  include_price_history INTEGER NOT NULL DEFAULT 0,
  include_statistics INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_capture_justtcg_pages (
  page_id TEXT PRIMARY KEY,
  capture_run_id TEXT NOT NULL,
  page_index INTEGER NOT NULL,
  page_offset INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  request_url TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capture_run_id) REFERENCES price_capture_justtcg_runs (run_id),
  UNIQUE (capture_run_id, page_index)
);

CREATE TABLE IF NOT EXISTS price_process_runs (
  process_run_id TEXT PRIMARY KEY,
  capture_run_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capture_run_id) REFERENCES price_capture_justtcg_runs (run_id)
);

CREATE TABLE IF NOT EXISTS price_data (
  row_id TEXT PRIMARY KEY,
  process_run_id TEXT NOT NULL,
  capture_run_id TEXT NOT NULL,
  upstream_provider_id TEXT NOT NULL,
  price_source_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  source_card_id TEXT NOT NULL,
  source_variant_id TEXT NOT NULL,
  tcgplayer_id TEXT,
  tcgplayer_sku_id TEXT,
  language TEXT,
  condition TEXT,
  printing TEXT,
  currency TEXT NOT NULL,
  current_price_amount REAL,
  current_price_last_updated_at TEXT,
  price_history_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_run_id) REFERENCES price_process_runs (process_run_id),
  FOREIGN KEY (capture_run_id) REFERENCES price_capture_justtcg_runs (run_id),
  UNIQUE (process_run_id, source_variant_id)
);

CREATE TABLE IF NOT EXISTS price_publish_runs (
  publish_run_id TEXT PRIMARY KEY,
  process_run_id TEXT NOT NULL,
  capture_run_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  artifact_count INTEGER NOT NULL DEFAULT 0,
  row_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_run_id) REFERENCES price_process_runs (process_run_id),
  FOREIGN KEY (capture_run_id) REFERENCES price_capture_justtcg_runs (run_id)
);

CREATE TABLE IF NOT EXISTS price_publish_artifacts (
  artifact_id TEXT PRIMARY KEY,
  publish_run_id TEXT NOT NULL,
  process_run_id TEXT NOT NULL,
  capture_run_id TEXT NOT NULL,
  game_key TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (publish_run_id) REFERENCES price_publish_runs (publish_run_id),
  FOREIGN KEY (process_run_id) REFERENCES price_process_runs (process_run_id),
  FOREIGN KEY (capture_run_id) REFERENCES price_capture_justtcg_runs (run_id),
  UNIQUE (game_key, artifact_type)
);

CREATE TABLE IF NOT EXISTS price_pipeline_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_capture_justtcg_runs_status_completed_at
  ON price_capture_justtcg_runs (status, completed_at);

CREATE INDEX IF NOT EXISTS idx_price_capture_justtcg_pages_run_page
  ON price_capture_justtcg_pages (capture_run_id, page_index);

CREATE INDEX IF NOT EXISTS idx_price_capture_justtcg_pages_expires_at
  ON price_capture_justtcg_pages (expires_at);

CREATE INDEX IF NOT EXISTS idx_price_process_runs_capture_completed_at
  ON price_process_runs (capture_run_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_price_data_capture_source_card
  ON price_data (capture_run_id, source_card_id);

CREATE INDEX IF NOT EXISTS idx_price_data_process_tcgplayer
  ON price_data (process_run_id, tcgplayer_id);

CREATE INDEX IF NOT EXISTS idx_price_publish_runs_capture_completed_at
  ON price_publish_runs (capture_run_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_price_publish_artifacts_game_type
  ON price_publish_artifacts (game_key, artifact_type);
