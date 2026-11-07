CREATE TABLE IF NOT EXISTS customers (
  id text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id),
  product text NOT NULL,
  issued_on date NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('Pending', 'Paid', 'Overdue'))
);

INSERT INTO customers (id, name) VALUES
  ('CUS-001', 'Roger Gold'),
  ('CUS-002', 'Aokiji Kuzan'),
  ('CUS-003', 'Kizaru Borsalino'),
  ('CUS-004', 'Noah Williams')
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (id, customer_id, product, issued_on, amount, status) VALUES
  ('INV-1048', 'CUS-001', 'Brand strategy session', '2026-11-06', 1000, 'Paid'),
  ('INV-1047', 'CUS-002', 'Website maintenance', '2026-11-05', 800, 'Pending'),
  ('INV-1046', 'CUS-003', 'Design subscription', '2026-11-05', 3000, 'Paid'),
  ('INV-1045', 'CUS-004', 'Social media package', '2026-11-04', 480, 'Overdue')
ON CONFLICT (id) DO NOTHING;
