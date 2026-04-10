-- ============================================================
-- Indra's Pantry — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  role            VARCHAR(20)  DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active       BOOLEAN      DEFAULT true,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id           UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id  UUID           REFERENCES categories(id) ON DELETE SET NULL,
  name         VARCHAR(255)   NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2)  NOT NULL CHECK (price >= 0),
  image_url    TEXT,
  is_available BOOLEAN        DEFAULT true,
  created_at   TIMESTAMPTZ    DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    DEFAULT NOW()
);

-- ─── cart_items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    UUID        NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity   INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

-- ─── orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID           REFERENCES users(id) ON DELETE SET NULL,
  items          JSONB          NOT NULL,         -- snapshot of items at order time
  total_amount   NUMERIC(10,2)  NOT NULL CHECK (total_amount >= 0),
  status         VARCHAR(20)    DEFAULT 'placed'
                   CHECK (status IN ('placed','accepted','preparing','ready','completed','cancelled')),
  payment_method VARCHAR(50)    DEFAULT 'cash_at_pickup',
  notes          TEXT,
  created_at     TIMESTAMPTZ    DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_items_category_id   ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_is_available  ON items(is_available);
CREATE INDEX IF NOT EXISTS idx_cart_user_id        ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id      ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at DESC);

-- ─── Disable Row Level Security ───────────────────────────────
-- The Express backend uses the service-role key which bypasses RLS.
-- Auth + authorization are handled in Express middleware.
ALTER TABLE users       DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories  DISABLE ROW LEVEL SECURITY;
ALTER TABLE items       DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items  DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders      DISABLE ROW LEVEL SECURITY;
