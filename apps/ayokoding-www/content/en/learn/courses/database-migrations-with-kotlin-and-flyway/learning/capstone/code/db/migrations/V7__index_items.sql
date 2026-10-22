-- V7: the new foreign key earns its index before traffic cutover.
CREATE INDEX idx_items_order ON order_items (order_id);
