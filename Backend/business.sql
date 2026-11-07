CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  price numeric(12,2) NOT NULL CHECK (price >= 0)
);
INSERT INTO products(id,name,price)
SELECT 'PRD-' || md5(product),product,max(amount) FROM invoices GROUP BY product
ON CONFLICT DO NOTHING;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS request_id uuid UNIQUE;
