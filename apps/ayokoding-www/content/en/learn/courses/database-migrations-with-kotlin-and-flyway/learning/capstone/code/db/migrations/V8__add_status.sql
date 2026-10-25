-- V8: a status lookup plus a backfilled status column.
CREATE TABLE order_status (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL
);
INSERT INTO order_status (code, label) VALUES ('new', 'New'), ('paid', 'Paid'), ('sent', 'Sent');
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
UPDATE orders SET status = 'paid' WHERE id <= 2;
