-- App settings table for small key-value configuration (e.g. UPI QR)
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
