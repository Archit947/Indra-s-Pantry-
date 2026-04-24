ALTER TABLE items
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0);

CREATE INDEX IF NOT EXISTS idx_items_stock ON items(stock);

UPDATE items
SET stock = CASE
  WHEN is_available THEN 100
  ELSE 0
END
WHERE stock IS NULL OR stock = 0;
