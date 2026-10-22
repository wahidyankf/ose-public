-- V4: the old shape as a view over the new tables.
CREATE VIEW legacy_orders AS SELECT o.id, i.item FROM orders o JOIN order_items i ON i.order_id = o.id;
