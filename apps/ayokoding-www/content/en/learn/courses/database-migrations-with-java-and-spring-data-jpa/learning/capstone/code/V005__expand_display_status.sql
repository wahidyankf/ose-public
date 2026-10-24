-- V005 expands orders with display_status beside the old status.
-- Expand: the new name exists before anything writes it.
ALTER TABLE cap_orders
ADD COLUMN display_status VARCHAR(20);

-- => the new name, present but unused until the migrate phase
