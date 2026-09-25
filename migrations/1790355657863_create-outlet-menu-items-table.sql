-- Up Migration

CREATE TABLE outlet_menu_items (
  id SERIAL PRIMARY KEY,
  outlet_id INT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  price_override NUMERIC(10, 2) CHECK (price_override IS NULL OR price_override >= 0),  
  available_unit INT NOT NULL DEFAULT 0 CHECK (available_unit >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_outlet_menu_item UNIQUE (outlet_id, menu_item_id)
);

-- Down Migration

DROP TABLE outlet_menu_items;