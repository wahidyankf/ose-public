-- V3: the new column readers will move to.
ALTER TABLE orders ADD COLUMN code_new TEXT;
UPDATE orders SET code_new = code;
