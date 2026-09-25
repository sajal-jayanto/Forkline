-- Up Migration

CREATE INDEX idx_outlet_menu_items_outlet_id ON outlet_menu_items(outlet_id);
CREATE INDEX idx_outlet_menu_items_menu_item_id ON outlet_menu_items(menu_item_id);
CREATE INDEX idx_sales_outlet_id ON sales(outlet_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_outlet_menu_item_id ON sale_items(outlet_menu_item_id);

-- Down Migration

DROP INDEX IF EXISTS idx_outlet_menu_items_outlet_id;
DROP INDEX IF EXISTS idx_outlet_menu_items_menu_item_id;
DROP INDEX IF EXISTS idx_sales_outlet_id;
DROP INDEX IF EXISTS idx_sale_items_sale_id;
DROP INDEX IF EXISTS idx_sale_items_outlet_menu_item_id;