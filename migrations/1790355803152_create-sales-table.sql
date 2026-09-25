-- Up Migration

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  outlet_id INT NOT NULL REFERENCES outlets(id) ON DELETE RESTRICT,
  receipt_number INT NOT NULL,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_outlet_receipt UNIQUE (outlet_id, receipt_number)
);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  outlet_menu_item_id INT NOT NULL REFERENCES outlet_menu_items(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sale_item UNIQUE (sale_id, outlet_menu_item_id)
);

-- Down Migration

DROP TABLE sales;
DROP TABLE sale_items;