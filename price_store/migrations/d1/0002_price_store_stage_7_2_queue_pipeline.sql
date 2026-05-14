DROP TABLE IF EXISTS price_publish_artifacts;
DROP TABLE IF EXISTS price_publish_runs;
DROP TABLE IF EXISTS price_data;
DROP TABLE IF EXISTS price_process_runs;
DROP TABLE IF EXISTS price_capture_justtcg_pages;
DROP TABLE IF EXISTS price_capture_justtcg_runs;
DROP TABLE IF EXISTS price_pipeline_state;

CREATE TABLE IF NOT EXISTS price_pipeline_runs (
  run_id TEXT PRIMARY KEY,
  game_slug TEXT NOT NULL,
  capture_mode TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  discovery_completed_at TEXT,
  ingestion_completed_at TEXT,
  cook_started_at TEXT,
  cook_completed_at TEXT,
  publish_started_at TEXT,
  completed_at TEXT,
  updated_after TEXT,
  verified_limit INTEGER NOT NULL,
  request_budget_per_chunk INTEGER NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 0,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  completed_chunk_count INTEGER NOT NULL DEFAULT 0,
  remaining_chunk_count INTEGER NOT NULL DEFAULT 0,
  raw_page_count INTEGER NOT NULL DEFAULT 0,
  cooked_row_count INTEGER NOT NULL DEFAULT 0,
  published_row_count INTEGER NOT NULL DEFAULT 0,
  cook_enqueue_requested_at TEXT,
  publish_enqueue_requested_at TEXT,
  live_published_at TEXT,
  latest_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_ingestion_chunks (
  chunk_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  page_start_index INTEGER NOT NULL,
  page_end_index INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  claimed_at TEXT,
  completed_at TEXT,
  latest_error TEXT,
  FOREIGN KEY (run_id) REFERENCES price_pipeline_runs (run_id) ON DELETE CASCADE,
  UNIQUE (run_id, page_start_index, page_end_index)
);

CREATE TABLE IF NOT EXISTS price_raw_pages (
  page_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  page_index INTEGER NOT NULL,
  page_offset INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  request_url TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES price_pipeline_runs (run_id) ON DELETE CASCADE,
  UNIQUE (run_id, page_index)
);

CREATE TABLE IF NOT EXISTS price_cooked_rows (
  row_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  upstream_provider_id TEXT NOT NULL,
  price_source_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  source_card_id TEXT NOT NULL,
  source_variant_id TEXT NOT NULL,
  tcgplayer_id TEXT,
  tcgplayer_sku_id TEXT,
  language TEXT,
  condition_name TEXT,
  printing TEXT,
  currency TEXT NOT NULL,
  current_price_amount REAL,
  current_price_last_updated_at TEXT,
  price_history_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES price_pipeline_runs (run_id) ON DELETE CASCADE,
  UNIQUE (run_id, source_variant_id)
);

CREATE TABLE IF NOT EXISTS price_publish_runs (
  publish_run_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  manifest_key TEXT,
  snapshot_key TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES price_pipeline_runs (run_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_publish_artifacts (
  artifact_id TEXT PRIMARY KEY,
  publish_run_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  game_key TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (publish_run_id) REFERENCES price_publish_runs (publish_run_id) ON DELETE CASCADE,
  FOREIGN KEY (run_id) REFERENCES price_pipeline_runs (run_id) ON DELETE CASCADE,
  UNIQUE (run_id, game_key, artifact_type)
);

CREATE TABLE IF NOT EXISTS price_pipeline_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_pipeline_runs_status_completed_at
  ON price_pipeline_runs (status, completed_at);

CREATE INDEX IF NOT EXISTS idx_price_pipeline_runs_started_at
  ON price_pipeline_runs (started_at);

CREATE INDEX IF NOT EXISTS idx_price_ingestion_chunks_run_status
  ON price_ingestion_chunks (run_id, status);

CREATE INDEX IF NOT EXISTS idx_price_raw_pages_run_page
  ON price_raw_pages (run_id, page_index);

CREATE INDEX IF NOT EXISTS idx_price_cooked_rows_run_variant
  ON price_cooked_rows (run_id, source_variant_id);

CREATE INDEX IF NOT EXISTS idx_price_publish_runs_run_completed_at
  ON price_publish_runs (run_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_price_publish_artifacts_run_game_type
  ON price_publish_artifacts (run_id, game_key, artifact_type);
